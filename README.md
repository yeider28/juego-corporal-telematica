# Tramas y Bloques

Juego arcade 2D de cinco oleadas sobre integridad de tramas. Destruye las tramas corruptas, conserva las sanas y llega al jefe de la última oleada. La cámara es opcional; teclado, ratón y gamepad ofrecen controles alternativos.

## Requisitos y arranque

- Node.js 22.12+ o 24.x.
- Chrome o Edge moderno. La cámara requiere `localhost` o HTTPS.
- Phaser 3.87.0 y MediaPipe Tasks Vision 0.10.14.

```sh
npm install
npm run dev
```

`npm run build` genera `dist/`; `npm run preview` sirve la build.

## Controles

- **Mover:** flechas izquierda/derecha.
- **Apuntar:** mantener `A` o `F` para ajustar el ángulo.
- **Disparar:** mantener `Espacio`; con ratón, mover para apuntar y hacer clic para disparar.
- **Gamepad:** stick izquierdo para moverse, stick derecho para apuntar, botón principal o gatillo derecho para disparar.
- **Método:** `1` y `2` seleccionan los métodos equipados.
- **Mejoras:** `1`, `2` o `3` eligen una tarjeta; cámara y ratón también permiten seleccionar.
- **Pausa:** `Esc`; **silencio:** `M`; **temblor:** `V`; **depuración de gestos:** `D`.

Antes de cada partida, elige uno o dos métodos (Paridad, CRC o Hamming), una ventaja inicial y una dificultad. Fácil comienza con 7 vidas, Normal con 5 y Difícil con 3. Perder todas las vidas termina la partida.

## Reglas y progreso

Las tramas aparecen con el intervalo de la oleada y descienden continuamente. La oleada termina cuando se generó su cantidad configurada y ya no quedan tramas vivas. Una trama corrupta que llega al nodo se cuenta como perdida; una trama sana que llega no causa penalización. Entre oleadas se detiene el juego para elegir una mejora.

Paridad y CRC detectan una trama corrupta y la destruyen. Hamming corrige el bit erróneo y conserva la trama. Tras obtener **Doble paquete**, pueden aparecer fusiones del método equipado: cada nivel evoluciona visualmente la bola a `+` y `++`, aumenta su radio y daño al jefe, y muestra una animación y aviso. Las tramas corruptas destruidas pueden soltar uno de dos power-ups: escudo de red (12 s) o ralentización (9 s); ambos caen, se recogen al tocar el nodo y muestran icono y duración en el HUD.

El jefe aparece en la quinta oleada, tiene tres fases y anuncia ataques que se pueden esquivar. El disparo continuo se permite, pero acumula calor y eleva el enfriamiento. Los impactos en tramas sanas penalizan puntos o vidas y rompen la racha.

## Cámara, accesibilidad y audio

Activa la cámara desde el panel lateral y concede permiso para usarla. El centro de los hombros mueve el nodo, la muñeca derecha apunta y girar la izquierda dispara. Durante una selección de mejora, los gestos eligen una tarjeta. Si se deniega el permiso o se pierde el seguimiento, el juego informa del estado y deja disponibles los demás controles.

**Opciones** incluye suavizado, zona muerta, debounce del disparo, movimiento reducido, paleta, tamaño de texto y volumen. Las preferencias se guardan en este navegador. El panel **Prueba de gestos** registra aciertos, fallos y falsos positivos; permite descargar esas estadísticas.

Los efectos y la música están en `public/assets/sonidos/`. Phaser/Web Audio se reanuda tras una interacción; si una carga o reproducción de sonido falla, se usa audio generado con Web Audio cuando está disponible.

## Resultados y datos locales

La pantalla de resultados muestra métricas por oleada y distingue:

- **% detectado** = tramas corruptas detectadas y destruidas ÷ tramas corruptas generadas.
- **% corregido** = bits corregidos por Hamming ÷ bits erróneos generados; se muestra `n/a (sin Hamming)` si no se equipó ese método.
- **BER bruto** = bits erróneos generados ÷ bits transmitidos.
- **BER residual** = bits erróneos de tramas corruptas perdidas al llegar al nodo sin detectar ÷ bits transmitidos. Cada trama corrupta aporta un bit erróneo.

Cada trama transmite 8 bits, así que `bits transmitidos = tramas generadas × 8` para ambas fórmulas. Paridad y CRC detectan y destruyen tramas; Hamming corrige el bit y conserva la trama. Por eso `% detectado` cuenta tramas destruidas y `% corregido` cuenta bits reparados.

Los puntajes se guardan en `localStorage` al introducir hasta cinco caracteres alfanuméricos. Puntajes, ajustes y estadísticas de gestos se validan y limitan al leerlos; datos corruptos se descartan. La exportación descarga un resumen JSON construido con datos validados. Los puntajes solo pertenecen a este navegador.

## Código y recursos

`src/main.js` conecta los módulos. La configuración vive en `src/config/`, las reglas y sistemas en `src/sistemas/`, y Menú, Loadout, Juego, Mejoras, Pausa y Resultados en `src/escenas/`. Cámara, gestos, entidades y UI tienen sus propios módulos.

El juego usa un lienzo lógico de 960×540 escalado con `Phaser.Scale.FIT`. Phaser 3.87.0 se obtiene del CDN jsDelivr con SRI SHA-384 y es necesario para arrancar. MediaPipe 0.10.14 carga primero desde `public/vendor/mediapipe/`; si faltan archivos, usa el CDN fijado por versión y los modelos de Google. El LEEME de esa carpeta enumera los archivos para autoalojarlo.

Los diez sprites definidos en `src/sistemas/sprites.js` son opcionales y se buscan en `public/assets/sprites/`. Se cargan solo si existen; si faltan, Phaser dibuja las formas de respaldo. El favicon está en `public/favicon.svg`.

Los pools de la escena se precalientan al arrancar y tienen límites fijos: 64 tramas, 36 proyectiles, 128 partículas, 24 bits y 12 pulsos CRC. La cámara reduce los fotogramas a 320×240 y limita la inferencia a 30 por segundo. Solo mantiene un fotograma transferido en vuelo; si la inferencia tarda más, omite capturas nuevas para evitar cola y mantener libre el hilo principal de Phaser.

## Limitaciones conocidas

- No se incluyen los sprites del plan; actualmente se usan las formas de Phaser.
- Phaser requiere conexión al CDN; la etiqueta verifica SRI SHA-384. No se incluye una copia local de Phaser.
- No se incluyen bundle, WASM ni modelos locales de MediaPipe. Sin copiarlos a `public/vendor/mediapipe/`, la cámara necesita acceso a los CDN.
- La cámara requiere permisos y un dispositivo compatible. La simulación automática no sustituye las pruebas físicas de cámara y gamepad.
- 30 FPS es el máximo de muestreo de inferencia; el rendimiento real depende del equipo y del navegador. MediaPipe corre en un Web Worker.

## Checklist de prueba manual

- [ ] **Teclado:** iniciar, mover, apuntar, disparar, cambiar método, elegir mejoras y pausar/reanudar.
- [ ] **Gamepad:** conectar antes de jugar; comprobar movimiento, apuntado y disparo con sticks/botón/gatillo.
- [ ] **Cámara:** permitir el acceso; comprobar calibración, movimiento, apuntado, disparo, selección de mejoras, recalibración y apagado.
- [ ] **Permiso denegado:** denegar cámara y confirmar el mensaje de estado y que teclado, ratón y gamepad siguen funcionando.
- [ ] **Tres dificultades:** completar o perder una partida en Fácil, Normal y Difícil; revisar las vidas iniciales y que la partida llega a resultados.
- [ ] **Jefe:** alcanzar la quinta oleada; comprobar fases, avisos, ataques y daño.
- [ ] **Resultados:** revisar puntaje, duración, métricas por oleada, % detectado, % corregido, BER bruto y BER residual.
- [ ] **Exportación JSON:** guardar un puntaje con iniciales alfanuméricas de hasta cinco caracteres y exportarlo; abrir el archivo y comprobar el resumen y las métricas.
- [ ] **Persistencia:** recargar la página y verificar puntajes y opciones; probar con datos corruptos en `localStorage` y confirmar que el juego arranca.

## Verificación automatizada

`npm test` cubre reglas, ledger y fórmulas, simulación automática de duración en las tres dificultades, ritmo y disparo sin apuntar, fusiones, pool, sprites opcionales y validación de datos locales. `npm run build` comprueba la compilación de producción.
