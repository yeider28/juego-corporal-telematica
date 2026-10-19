# Plan final — Tramas y Bloques

## Estado

Proyecto implementado como juego arcade 2D de cinco oleadas con resolución lógica de 960×540 y escalado `Phaser.Scale.FIT`. La quinta oleada incluye un jefe de tres fases. La guía de instalación, controles y prueba manual está en [README.md](README.md).

## Estructura implementada

- `src/main.js` compone la escena e integra los módulos.
- `src/escenas/`: Menú, Loadout, Juego, Mejoras, Pausa y Resultados.
- `src/sistemas/`: reglas, oleadas, colisiones, combo, congestión, jefe, entrada, métricas, almacenamiento validado y recursos opcionales.
- `src/config/`: balance, UI y constantes de juego.
- `src/vision/`, `src/gestos/`, `src/entidades/` y `src/ui/`: cámara, gestos, pools e interfaz.

## Decisiones de reglas cerradas

- **Ciclo:** las tramas se generan por intervalo y descienden continuamente. La selección de mejoras detiene el juego entre oleadas.
- **Oleada superada:** ya se generó el total configurado y no quedan tramas vivas. Las corruptas que llegan al nodo cuentan como perdidas; las sanas no penalizan al llegar. Agotar las vidas termina la partida.
- **Detección/corrección:** Paridad y CRC detectan y destruyen; Hamming corrige el bit y conserva la trama.
- **% detectado:** tramas corruptas detectadas y destruidas ÷ tramas corruptas generadas.
- **% corregido:** bits corregidos por Hamming ÷ bits erróneos generados; se muestra 0 % si no se equipó Hamming.
- **BER bruto:** bits erróneos generados ÷ bits transmitidos.
- **BER residual:** bits erróneos de tramas corruptas que llegaron al nodo sin detectar ÷ bits transmitidos.
- Cada trama transmite 8 bits; por tanto, el denominador de ambos BER es `tramas generadas × 8`.
- El JSON se descarga desde resultados y los datos que contiene se normalizan y validan antes de exportar. El navegador mantiene puntajes localmente, sin sincronización remota.

## Sistemas y recursos

Paridad, CRC y Hamming tienen efectos distintos. Mejoras de disparo y las fusiones permiten evolucionar bolas iguales hasta `++`. El escudo y la ralentización son los dos power-ups; muestran su duración en HUD. El balance reside en `src/config/balance.js`.

La lista de sprites opcionales está en `src/sistemas/sprites.js`: `protagonista_quieto.png`, `trama_sana_bajando.png`, `trama_corrupta_error.png`, `jefe_masivo.png`, `proyectiles_tipos.png`, `fondo_lejano.png`, `fondo_parallax.png`, `fondo_cercano.png`, `tileset_circuitos.png` y `ui_elementos.png`. El preload verifica disponibilidad; al faltar un archivo, usa primitivas dibujadas. `public/assets/sonidos/` ya contiene los efectos y la música; no se requiere un archivo de instrucciones de audio.

Phaser 3.87.0 y MediaPipe Tasks Vision 0.10.14 están fijados a sus versiones CDN con SRI SHA-384. Los datos de puntajes, accesibilidad y gestos se validan y limitan al leer `localStorage`. Los listeners de puntero de la escena se retiran al cerrarla. Los pools gráficos se precalientan y acotan: 64 tramas, 36 proyectiles, 128 partículas, 24 bits y 12 pulsos CRC. La cámara transfiere bitmaps de 320×240 a un worker, limita la muestra a 30 FPS y aplica contrapresión de un solo fotograma en vuelo; el límite real de inferencia depende del equipo.

## Pruebas automatizadas

`npm test` cubre reglas de vidas, puntuación y cierre de oleada; ledger y fórmulas; simulación sin interfaz para 3–5 minutos en las tres dificultades; presión de las primeras oleadas y estrategia de disparo fijo; fusión, pool, fallback de sprites y datos locales corruptos. `npm run build` valida la build de producción.

La lista de verificación manual de teclado, gamepad, cámara, denegación de permisos, dificultades, jefe, resultados y exportación JSON se mantiene en la sección **Checklist de prueba manual** del README para evitar mantener dos copias divergentes.

## Limitaciones conocidas

- El arte de sprites no está incluido; se muestran primitivas de Phaser.
- Phaser y la función de cámara requieren CDN; SRI no equivale a soporte sin conexión.
- La cámara depende de permisos, dispositivo compatible y descarga de MediaPipe/modelos. La simulación no valida periféricos reales.
- El rendimiento gráfico depende del equipo y el navegador.
