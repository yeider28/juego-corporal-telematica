export const DEFAULT_GESTURE_THRESHOLDS = Object.freeze({
  shoulderVisibility: 0.18,
  wristVisibility: 0.15,
  moveDeadZone: 0.012,
  aimDeadZoneRadians: 0.035,
  throwRaise: 0.07,
  throwRelease: 0.035,
  wristRotationRadians: 0.32,
})

const isVisible = (landmark, threshold) => Boolean(
  landmark && (landmark.visibility === undefined || landmark.visibility >= threshold),
)

export class GestureTranslator {
  constructor(thresholds = DEFAULT_GESTURE_THRESHOLDS) {
    this.thresholds = { ...thresholds }
    this.reset()
  }

  reset() {
    this.lastCenterX = null
    this.lastPlayerX = null
    this.lastAim = -Math.PI / 2
    this.lastHandAngle = null
    this.rotationSinceShot = 0
    this.leftRaised = false
  }

  update(landmarks, gameWidth, handLandmarks = null) {
    const shoulderL = landmarks?.[11]
    const shoulderR = landmarks?.[12]
    if (!isVisible(shoulderL, this.thresholds.shoulderVisibility) || !isVisible(shoulderR, this.thresholds.shoulderVisibility)) {
      this.leftRaised = false
      this.lastHandAngle = null
      this.rotationSinceShot = 0
      return { tracked: false, landmarks: landmarks ?? null, playerX: this.lastPlayerX, aim: this.lastAim, leftRaised: false, handAngle: null, throwPressed: false, movementDetected: false, aimDetected: false }
    }

    const centerX = (shoulderL.x + shoulderR.x) / 2
    const moved = this.lastCenterX === null || Math.abs(centerX - this.lastCenterX) >= this.thresholds.moveDeadZone
    if (moved) {
      this.lastCenterX = centerX
      this.lastPlayerX = gameWidth * (1 - centerX)
    }

    const wristR = landmarks[16]
    const wristL = landmarks[15]
    const aimDetected = isVisible(wristR, this.thresholds.wristVisibility)
    if (aimDetected) {
      // Preview and game coordinates are mirrored for intuitive right/left movement.
      const dx = shoulderR.x - wristR.x
      const dy = shoulderR.y - wristR.y
      const measuredAim = Math.max(-Math.PI + 0.25, Math.min(-0.2, -Math.atan2(dy, dx)))
      const aimChanged = Math.abs(measuredAim - this.lastAim) >= this.thresholds.aimDeadZoneRadians
      if (aimChanged) this.lastAim = measuredAim
    }

    // Pose only locates the wrist; HandLandmarker supplies palm landmarks so
    // wrist twists can be detected even when the arm does not rise.
    let leftHand = null
    if (wristL && handLandmarks?.length) {
      let nearestDistance = Infinity
      for (const hand of handLandmarks) {
        const handWrist = hand?.[0]
        if (!handWrist) continue
        const distance = Math.hypot(handWrist.x - wristL.x, handWrist.y - wristL.y)
        if (distance < nearestDistance) { nearestDistance = distance; leftHand = hand }
      }
      if (nearestDistance > 0.18) leftHand = null
    }
    const wristVisible = isVisible(wristL, this.thresholds.wristVisibility)
    const wasRaised = this.leftRaised
    if (!wristVisible || !shoulderL) this.leftRaised = false
    else if (!this.leftRaised && wristL.y <= shoulderL.y - this.thresholds.throwRaise) this.leftRaised = true
    else if (this.leftRaised && wristL.y >= shoulderL.y - this.thresholds.throwRelease) this.leftRaised = false
    const raisePressed = !wasRaised && this.leftRaised

    const palmIndex = leftHand?.[5]
    const palmPinky = leftHand?.[17]
    let turnPressed = false
    let handAngle = null
    if (palmIndex && palmPinky) {
      handAngle = Math.atan2(palmPinky.y - palmIndex.y, palmPinky.x - palmIndex.x)
      if (this.lastHandAngle !== null) {
        const delta = Math.atan2(Math.sin(handAngle - this.lastHandAngle), Math.cos(handAngle - this.lastHandAngle))
        this.rotationSinceShot += delta
        if (Math.abs(delta) >= this.thresholds.wristRotationRadians || Math.abs(this.rotationSinceShot) >= this.thresholds.wristRotationRadians) {
          turnPressed = true
          this.rotationSinceShot = 0
        }
      }
      this.lastHandAngle = handAngle
    } else {
      this.lastHandAngle = null
      this.rotationSinceShot = 0
    }

    return {
      tracked: true,
      landmarks,
      centerX,
      playerX: this.lastPlayerX,
      aim: this.lastAim,
      leftRaised: this.leftRaised,
      handAngle,
      // Keep the firing channel raw: no moving average delays this edge.
      throwPressed: raisePressed || turnPressed,
      movementDetected: moved,
      aimDetected,
    }
  }
}
