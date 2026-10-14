# Juego Corporal

## Stack de tecnología

| Componente | Selección | Integración |
| --- | --- | --- |
| Node.js | 24.x LTS recomendado; 22.12+ LTS compatible | Instalado en el sistema. `.nvmrc` selecciona 24. |
| Vite | 8.x (cumple el requisito de 5.x o superior) | `devDependencies` de npm. |
| Phaser | 3.87.0 | CDN de jsDelivr, cargado antes del módulo principal. No se instala con npm. |
| MediaPipe Tasks Vision | `@mediapipe/tasks-vision` 0.10.14 | Import ES desde CDN. No se instala con npm. |
| Navegador | Chrome o Edge 115 o superior | Probar desde un origen seguro (localhost o HTTPS) para permitir el acceso a cámara. |

### Cargar MediaPipe

Importa Tasks Vision desde el código del navegador cuando se inicialice la función de visión:

```js
const { FilesetResolver, PoseLandmarker } = await import(
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
)

const vision = await FilesetResolver.forVisionTasks(
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
)
```

El modelo de visión debe configurarse en la funcionalidad que lo consuma. El navegador necesita permisos de cámara cuando se use esa funcionalidad.

## Desarrollo

```sh
npm install
npm run dev
```

Requiere Node.js 22.12+ LTS o 24.x LTS; se recomienda 24.x.

## Controles

- **Mover:** flechas izquierda y derecha.
- **Apuntar:** `A` y `F`.
- **Disparar:** mantener espacio o hacer clic sobre el juego.
- **Elegir método:** `1` Paridad, `2` CRC, `3` Hamming.
- **Pausa:** `Esc`.
- **Cámara:** el centro de los hombros mueve el nodo; la muñeca derecha apunta y girar la muñeca izquierda dispara. Durante las mejoras, levantar izquierda/derecha/ambas elige una opción. Para reconocer el giro se cargan los modelos MediaPipe Pose y Hand desde Google CDN.
- **Depuración y prueba de gestos:** pulsa `D` para mostrar el esqueleto, las mediciones y el registro. Para cada gesto, ejecuta 20 intentos y pulsa **Acierto** o **Fallo**; durante los periodos de reposo, pulsa **Falso +** si se activa sin intención. Los conteos quedan guardados en el navegador y se pueden descargar como JSON. Calcula el porcentaje de fallos sobre los 20 intentos; si supera el 10 %, ajusta los umbrales en `src/gestos/traductor.js` y repite la prueba.

Para que la cámara detecte el cuerpo, colócala a la altura del torso y aléjate hasta que se vean la cabeza y ambos hombros. Mantén la muñeca derecha visible para apuntar y levanta la izquierda para disparar. La página muestra si el seguimiento está activo o si hace falta ajustar el encuadre.

Los sprites de `recursos.md` todavía no están en el repositorio. El prototipo dibuja los elementos del juego con gráficos de Phaser para que la lógica pueda jugarse antes de integrar el arte final.
