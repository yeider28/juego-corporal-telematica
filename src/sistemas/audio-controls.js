export function audioControlsState(muted, volume) {
  const effectiveVolume = muted ? 0 : Math.max(0, Math.min(100, Number(volume) || 0))
  return {
    header: muted ? '· AUDIO: MUTE' : '· AUDIO: ON',
    button: muted ? 'ACTIVAR SONIDO (M)' : 'SILENCIAR (M)',
    buttonPressed: Boolean(muted),
    effectiveVolume,
    volumeText: `${effectiveVolume}%`,
    volumeDescription: muted ? '0% (silenciado)' : `${effectiveVolume}%`,
  }
}
