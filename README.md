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
- **Disparar:** mantener espacio, hacer clic sobre el juego o usar el botón principal/trigger del gamepad.
- **Ratón:** mueve el cursor sobre el juego para apuntar; haz clic para disparar.
- **Gamepad:** stick izquierdo para mover, stick derecho para apuntar y botón principal o trigger para disparar.
- **Loadout y método activo:** antes de iniciar, equipa entre 1 y 2 métodos (Paridad, CRC o Hamming). En partida, `1` selecciona el primer método equipado y `2` el segundo; una tecla para un puesto no equipado no cambia el método activo.
- **Pausa:** `Esc`.
- **Temblor de impacto:** `V` activa o desactiva el screen shake; la preferencia se guarda en este navegador.
- **Sonido:** `M` alterna silencio total y el indicador superior muestra `AUDIO: ON / MUTE`; el volumen se configura desde Opciones. La música `bgm` se reproduce en bucle al 30 % y aumenta 3.5 % su velocidad por oleada. Phaser/Web Audio se reanuda después de la primera interacción del usuario, incluido el clic que inicia la cámara.
- **Cámara:** al activarla, permite el acceso y sigue el contorno durante la cuenta atrás. El centro de los hombros mueve el nodo; la muñeca derecha apunta y girar la muñeca izquierda dispara. **Recalibrar** está disponible mientras la cámara funciona. Durante las mejoras, levantar izquierda/derecha/ambas elige una opción. Si el permiso falla o se pierde el cuerpo, se informa del estado y los otros controles siguen activos.
- **Depuración y prueba de gestos:** pulsa `D` para mostrar el esqueleto, las mediciones y el registro. Para cada gesto, ejecuta 20 intentos y pulsa **Acierto** o **Fallo**; durante los periodos de reposo, pulsa **Falso +** si se activa sin intención. Los conteos quedan guardados en el navegador y se pueden descargar como JSON. Calcula el porcentaje de fallos sobre los 20 intentos; si supera el 10 %, ajusta los umbrales en `src/gestos/traductor.js` y repite la prueba.

Para que la cámara detecte el cuerpo, colócala a la altura del torso y aléjate hasta que se vean la cabeza y ambos hombros. Mantén la muñeca derecha visible para apuntar y levanta la izquierda para disparar. La página muestra si el seguimiento está activo o si hace falta ajustar el encuadre.

El indicador **BUFFER** cuenta las tramas activas. Al llegar a 5 se activa la congestión: todas las tramas descienden un 50 % más rápido. El flujo vuelve a la velocidad normal cuando quedan 2 o menos; el umbral de salida evita que el estado cambie repetidamente alrededor de 5.

La línea punteada predice el disparo y su primer rebote, usando el color del método equipado. La barra **RECARGA** muestra el enfriamiento del disparo y la **RÁFAGA** muestra el combo y su multiplicador. El jefe tiene tres fases con avisos y zonas rojas que se deben esquivar; el temblor es opcional con `V`.

La interfaz de Phaser usa IBM Plex Mono con alternativas monoespaciadas. El fondo tiene rejilla y circuitos en capas con partículas de datos en movimiento. Las bolas se distinguen por silueta: círculo (Paridad), hexágono (CRC) y rombo con aura (Hamming). Las tramas corruptas llevan borde discontinuo, ⚠ y bit parpadeante; las sanas llevan borde sólido y ✓.

## Calidad, rendimiento y entrega

Las tramas, sus contenedores, bits y etiquetas se reutilizan al salir del campo; los proyectiles mantienen un pool de objetos visuales y registros. Las partículas se limitan a 96 simultáneas y se reutilizan; los disparos activos tienen un límite de 36. El rastro CRC también usa el pool de partículas. Estos límites evitan crecimiento sin control, aunque los 60 FPS dependen del equipo, la carga del navegador y la inferencia de cámara.

Phaser 3.87.0 se carga desde jsDelivr. Si falla, aparece un mensaje con un botón para reintentar la carga. MediaPipe se ejecuta en un worker desde CDN; si no carga o pierde el seguimiento, el estado de cámara explica el problema y permite volver a activar/reintentar, mientras teclado, ratón y gamepad siguen disponibles.

El audio carga desde `public/assets/sonidos/`: disparo, impacto, corrección, error, rebote, mejora, victoria, derrota, jefe y bgm. Si un recurso no está disponible, se generan tonos y una base musical sencillos con Web Audio API; el fallback respeta volumen y silencio.

El código ya separa configuración (`src/config/`), gestos (`src/gestos/`), visión (`src/vision/`), entidades/pools (`src/entidades/`), sistemas/métricas (`src/sistemas/`), escenas/configuración de Phaser (`src/escenas/`) e interfaz (`src/ui/`). La escena principal continúa concentrada en `src/main.js`; dividirla más requiere extraer sus estados y dependencias compartidas sin alterar el bucle del juego.

Para validar la entrega: `npm run build` genera `dist/`; `npm run preview` sirve esa build. La compatibilidad de escritorio se orienta a Chrome y Edge 115+, pero cada navegador debe probarse en la máquina de entrega para validar cámara y aceleración gráfica.

Los sprites del plan son opcionales y se buscan en `public/assets/sprites/` con los nombres indicados en `PLAN_DESARROLLO.md`. Si falta alguno, el juego conserva las formas y animaciones dibujadas en Phaser.

Los sprites de `recursos.md` todavía no están en el repositorio. El prototipo dibuja los elementos del juego con gráficos de Phaser para que la lógica pueda jugarse antes de integrar el arte final.

## Progresión roguelite y balance

`src/config/balance.js` es la fuente central de velocidades, cantidades de tramas, vidas, daño, cadencia, puntuación, congestión y objetivo de duración (4 minutos, dentro del rango de 3–5 minutos). Ajusta los valores allí para rebalancear la partida.

- **Oleadas:** 1 enseña el flujo base; 2 acelera las tramas; 3 aumenta las tramas sanas; 4 incorpora movimiento en zigzag; 5 presenta al jefe con tres fases.
- **Dificultad:** se elige antes de iniciar: Fácil (7 vidas y flujo lento), Normal (5) o Difícil (3 y flujo rápido).
- **Mejoras:** tras cada oleada completada se elige 1 de 3 opciones. Cada tarjeta muestra icono, rareza (común, rara o épica), descripción y sinergia. Algunas opciones solo aparecen si su método está equipado.
- **Precisión y spam:** destruir corruptas consecutivamente aumenta la ráfaga y el multiplicador; golpear una trama sana rompe la racha. Disparar continuamente acumula calor, que añade enfriamiento; la barra RECARGA indica cuándo vuelve a estar listo.
- **Opcionales futuros:** la fusión de bolas y los power-ups de caída quedan fuera de este ciclo para mantener estable el flujo principal. El balance y las mejoras actuales no dependen de ellos.

## Gestos y accesibilidad

La vista pequeña de cámara se puede ocultar o mostrar. El estado de cámara (buscando, seguimiento activo o perdido) y el gesto reconocido se anuncian en pantalla. En **Accesibilidad y gestos** se ajustan suavizado, zona muerta y debounce temporal del disparo; estos valores se guardan localmente.

El mismo panel permite reducir movimiento (desactiva temblores, flashes y parpadeos), elegir una paleta de alto contraste/azul-amarillo, modificar el tamaño del texto y ajustar el volumen. La cámara es opcional: teclado, ratón y gamepad se mantienen disponibles como alternativas.

## Menús y resultados

El menú ofrece Jugar, Cómo jugar, Opciones y Mejores puntajes. La primera partida muestra cuatro instrucciones contextuales, con controles para avanzar o saltarlas. La pausa (Esc) permite reanudar, abrir opciones, recalibrar la cámara o volver al menú.

Los resultados distinguen tramas procesadas (retiradas del campo), errores detectados (tramas corruptas destruidas), correcciones Hamming registradas, tramas corruptas perdidas (las que llegan al nodo) y disparos contra tramas sanas. **% corregido** = correcciones / tramas con error generadas (se muestra como `n/a (sin Hamming)` si Hamming no estaba equipado). **BER** = bits erróneos / bits de todas las tramas generadas hasta el momento. Cada trama contiene 8 bits: el denominador exacto es `tramas generadas × 8`; por ejemplo, 6 tramas = 48 bits y 3 tramas = 24 bits. La interfaz muestra ambos valores. El rendimiento se desglosa por oleada. Los puntajes se guardan al escribir al menos una letra en las iniciales y pulsar Guardar; Exportar JSON conserva el ledger y el desglose por oleada.

Verificación: `npm test` comprueba que los eventos del ledger se reflejen en las métricas, que retirar dos veces la misma trama no duplique procesadas, que las fórmulas de corrección y BER usan los contadores registrados y que el pool respeta el límite y reutiliza instancias.

La línea punteada predice el disparo y su primer rebote, usando el color del método equipado. La barra **RECARGA** muestra el enfriamiento del disparo y la **RÁFAGA** muestra el combo y su multiplicador. El jefe tiene tres fases con avisos y zonas rojas que se deben esquivar; el temblor es opcional con `V`.
