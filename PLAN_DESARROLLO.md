# Plan final — Tramas y Bloques

## Estado

Proyecto implementado como juego arcade 2D de cinco oleadas con resolución lógica de 960×540 y escalado `Phaser.Scale.FIT`. La quinta oleada incluye un jefe de tres fases. La guía de instalación, controles y checklist manual están en [README.md](README.md), que es la fuente única para esos pasos.

## Estructura implementada

- `src/main.js` compone la escena e integra los módulos.
- `src/escenas/`: Menú, Loadout, Juego, Mejoras, Pausa y Resultados.
- `src/sistemas/`: reglas, oleadas, colisiones, combo, congestión, jefe, entrada, métricas, almacenamiento validado y recursos opcionales.
- `src/config/`: balance, UI y constantes de juego.
- `src/vision/`, `src/gestos/`, `src/entidades/` y `src/ui/`: cámara, gestos, pools e interfaz.

## Decisiones de reglas cerradas

- **Ciclo de oleada:** la partida recorre las oleadas 1 a 5. Las tramas aparecen según el intervalo configurado y descienden continuamente. Después de superar las oleadas 1–4, el juego se pausa para elegir una mejora y luego inicia la siguiente; derrotar al jefe de la oleada 5 termina la partida con victoria.
- **Oleada superada:** se generó el total configurado y el arreglo activo de tramas quedó vacío. Las corruptas que alcanzan el nodo se retiran y cuentan como perdidas; las sanas que llegan se retiran sin penalización. Agotar las vidas termina la partida con derrota.
- **Detección/corrección:** Paridad y CRC detectan y destruyen; Hamming corrige el bit y conserva la trama.
- **% detectado:** tramas corruptas detectadas y destruidas ÷ tramas corruptas generadas.
- **% corregido:** bits corregidos por Hamming ÷ bits erróneos generados; se muestra `n/a (sin Hamming)` si Hamming no estaba equipado.
- **BER bruto:** bits erróneos generados ÷ bits transmitidos.
- **BER residual:** bits erróneos de tramas corruptas perdidas al llegar al nodo sin detectar ÷ bits transmitidos. Como cada trama corrupta genera un bit erróneo, el contador `perdidas` aporta el numerador residual.
- Cada trama transmite 8 bits; el denominador de ambos BER es `tramas generadas × 8`.
- **Diferencia de tasas:** `% detectado` mide tramas corruptas que Paridad o CRC destruyeron; `% corregido` mide bits que Hamming reparó. Detectar y destruir no cuenta como corregir.
- El JSON se descarga desde resultados y los datos que contiene se normalizan y validan antes de exportar. El navegador mantiene puntajes localmente, sin sincronización remota.

## Sistemas y recursos

Paridad, CRC y Hamming tienen efectos distintos. Las dos primeras oleadas duran aproximadamente 34–42 segundos según dificultad en la simulación automática; un disparo fijo sin apuntar no permite completar las oleadas. Tras adquirir Doble paquete, las fusiones disponibles evolucionan el método equipado hasta `++`, aumentan tamaño y daño al jefe, y muestran efecto visual y aviso. Las tramas corruptas destruidas tienen probabilidad de soltar solo dos tipos de power-up: escudo (12 segundos) y ralentización (9 segundos), con icono y cuenta atrás visible en HUD. El balance reside en `src/config/balance.js`.

La lista de sprites opcionales está en `src/sistemas/sprites.js`: `protagonista_quieto.png`, `trama_sana_bajando.png`, `trama_corrupta_error.png`, `jefe_masivo.png`, `proyectiles_tipos.png`, `fondo_lejano.png`, `fondo_parallax.png`, `fondo_cercano.png`, `tileset_circuitos.png` y `ui_elementos.png`. El preload verifica disponibilidad; al faltar un archivo, usa primitivas dibujadas. `public/assets/sonidos/` ya contiene los efectos y la música; no se requiere un archivo de instrucciones de audio.

Phaser 3.87.0 se carga desde CDN con SRI SHA-384. MediaPipe Tasks Vision 0.10.14 usa URL CDN fijada y admite copias locales opcionales de bundle, WASM y modelos en `public/vendor/mediapipe/`; los binarios no se distribuyen. Puntajes, accesibilidad y gestos se validan y limitan al leer `localStorage`. Los listeners de puntero se retiran al cerrar la escena. Los pools se precalientan y acotan: 64 tramas, 36 proyectiles, 128 partículas, 24 bits y 12 pulsos CRC. La cámara envía bitmaps de 320×240 a un Web Worker, limita la inferencia a 30 FPS y mantiene como máximo un fotograma en vuelo; la velocidad real depende del equipo.

## Pruebas automatizadas

`npm test` cubre reglas de vidas, puntuación y cierre de oleada; ledger y fórmulas de BER bruto/residual; simulación automática sin interfaz que completa las cinco oleadas y verifica una duración de 180–300 segundos en Fácil, Normal y Difícil; presión de las primeras oleadas y estrategia de disparo fijo; fusión, pool, fallback de sprites y datos locales corruptos. `npm run build` valida la build de producción.

## Limitaciones conocidas

- El arte de sprites no está incluido; se muestran primitivas de Phaser.
- Phaser requiere el CDN; el script usa SRI y no hay copia local.
- Los binarios opcionales de MediaPipe no se incluyen; para usar la cámara sin CDN hay que agregarlos a `public/vendor/mediapipe/`.
- La cámara y el gamepad necesitan pruebas en dispositivos reales; la simulación automatizada no cubre periféricos.
- El límite de muestreo de cámara es 30 FPS, pero la inferencia y el renderizado varían según equipo y navegador.
