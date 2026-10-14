# Plan de desarrollo — Tramas y Bloques

## Objetivo

Construir un juego arcade 2D para un jugador, inspirado en *Ball x Pit*, en el que se interceptan tramas de datos descendentes. La partida debe durar aproximadamente 3–5 minutos y contener cinco oleadas, controles por gestos de cámara para apuntar y disparar, tres tipos de bolas con efectos distintos y una pantalla final con métricas y explicación educativa.

## Stack seleccionado

- **Node.js:** 24.x LTS recomendado; 22.12+ LTS compatible con Vite 8.
- **Vite:** 8.x en `devDependencies` para servidor y build.
- **Phaser:** 3.87.0 desde jsDelivr, excluido de npm.
- **MediaPipe Tasks Vision:** 0.10.14 mediante import ES desde CDN.
- **Navegador objetivo:** Chrome o Edge 115 o superior. La cámara requiere localhost o HTTPS.

## Alcance y criterios de terminado

La entrega mínima incluye las cinco oleadas (la quinta con jefe), tramas sanas y corruptas, vidas, puntuación, mejoras entre oleadas, Paridad/CRC/Hamming, apuntado y disparo mediante gestos, pantalla final educativa y guardado local de iniciales y puntaje en JSON. Teclado y gamepad sirven como alternativas de entrada y apoyo para desarrollo.

El juego se considera listo cuando una persona puede iniciar, completar o perder una partida, entender qué objetivos debe destruir, elegir mejoras y consultar sus resultados sin errores que bloqueen el flujo. Las métricas deben coincidir con los eventos ocurridos durante la partida.

## Fases de desarrollo

| Fase | Trabajo | Entregable / condición de salida |
| --- | --- | --- |
| 1. Base y prototipo jugable | Crear escenas Phaser para menú, juego, pausa/mejoras y resultados. Definir resolución lógica 1280×720 con escala adaptable. Implementar jugador, apuntado provisional por teclado, disparo y colisiones. | Prototipo donde el jugador se mueve/apunta, dispara y golpea tramas; estructura lista para sustituir el control provisional por cámara. |
| 2. Reglas y bucle de oleadas | Generar tramas de 8 bits, marcar visualmente un bit erróneo, descender, contar impactos/eventos, aplicar vidas y puntuación. Implementar oleadas 1–4 con aumento gradual de cantidad y velocidad. | Reglas verificables: destruir corruptas suma; dejar escapar corruptas o destruir sanas resta vida; derrota al llegar a cero. Oleadas terminan cuando se limpia el conjunto o se cumple la condición de cierre definida. |
| 3. Tres bolas y jefe | Añadir Paridad (impacto simple), CRC (hasta tres rebotes/perforaciones) y Hamming (corrige corrupta y da puntos extra). Crear oleada 5 con jefe de múltiples impactos y aparición de tramas pequeñas. | Las tres bolas se distinguen por apariencia y comportamiento. El jefe tiene vida visible, recibe impactos y genera amenazas menores. |
| 4. Mejoras y fusión | Al superar oleadas, detener la acción y ofrecer tres mejoras; implementar selección con teclado/gamepad y gestos. Añadir fusión de dos bolas del mismo tipo si queda tiempo tras completar el flujo principal. | La partida se reanuda con la mejora seleccionada; no hay disparos accidentales durante la pantalla de selección. Fusión queda como extra. |
| 5. Cámara y gestos | Inicializar MediaPipe Pose bajo demanda, pedir permiso de cámara, mostrar vista previa y estado de seguimiento. Normalizar el centro de hombros para movimiento lateral; calcular ángulo hombro–muñeca para apuntar; detectar mano izquierda sobre hombro para disparar. Añadir suavizado, zona muerta y umbral temporal para evitar ruido. | Apuntar y disparar funcionan con la cámara en un entorno compatible; errores de permiso o cámara ausente muestran una explicación y permiten continuar con teclado. |
| 6. Arte, HUD y presentación | Integrar spritesheets y escenario, efectos de flujo de datos, paleta cian/rojo, HUD de vidas y métricas. Añadir estados visuales claros para tramas sanas/corruptas, tipo de bola, jefe, pausas y daño. | Lectura clara de objetivos y estado en pantalla completa y tamaños comunes; si faltan recursos, el prototipo usa formas provisionales sin bloquearse. |
| 7. Resultados y pulido | Calcular tramas procesadas, errores corregidos, perdidos, porcentaje corregido y BER final; mostrar texto educativo. Pedir iniciales y guardar resultado como JSON local. Revisar flujo, instrucciones, audio/efectos opcionales y empaquetado. | Se puede jugar desde inicio hasta resultados y registrar iniciales/puntaje. La pantalla final refleja los contadores reales. |

## Orden de prioridad

1. Flujo completo y reglas principales con arte provisional.
2. Cinco oleadas, incluyendo jefe y comportamientos de las tres bolas.
3. Gestos para apuntar y disparar; controles alternativos para accesibilidad y contingencia.
4. Mejoras, HUD, métricas y resultados con guardado local.
5. Sustituir arte provisional por los recursos visuales y pulir animaciones.
6. Fusión de bolas y chispas detalladas como extras.

## Decisiones de diseño que conviene cerrar al comenzar

- **Ciclo de oleada:** el documento menciona una evaluación cada 10 segundos, pero también tramas de descenso continuo. Se recomienda mantener el descenso continuo y usar los 10 segundos como intervalo de generación o como subfase; elegir una única regla antes de balancear.
- **Condición de oleada superada:** definir si se cierra al eliminar/dejar pasar todas las tramas o tras un temporizador. Registrar la decisión para que el ritmo y la duración total sean consistentes.
- **Detección de tramas:** Paridad, CRC y Hamming son métodos de control, pero no deberían convertirse en una regla engañosa. La condición sana/corrupta puede seguir siendo explícita por el bit resaltado; las bolas representan efectos jugables distintos.
- **Control contextual:** el gesto de levantar la mano izquierda dispara durante el juego y elige la mejora 1 en la selección. La mano derecha y ambas manos seleccionan mejoras 2/3 solo en la pantalla de mejora. Documentar esta diferencia en las instrucciones.
- **BER:** acordar el denominador y los eventos que cuentan como errores de bit para que la tasa final sea reproducible. Mostrar la fórmula junto a la métrica si cabe.
- **Guardado JSON:** el navegador no puede escribir libremente un archivo local. Para mantener el juego estático, guardar el objeto JSON en `localStorage` y ofrecer descarga/exportación del JSON desde resultados.

## Plan de uso de recursos

| Recurso | Uso previsto | Dependencia |
| --- | --- | --- |
| `protagonista_quieto.png` (64×64, 4 cuadros) | Nodo de Control en la parte inferior | Animación de reposo; se puede añadir inclinación al apuntar |
| `trama_sana_bajando.png` (64×32, 4 cuadros) | Objetivo sano | Debe leerse como “no destruir” |
| `trama_corrupta_error.png` (64×32, 4 cuadros) | Objetivo corrupto con bit erróneo | El bit marcado también debe distinguirse sin depender solo del color |
| `jefe_masivo.png` (192×96, 4 cuadros) | Jefe de la quinta oleada | Barra/indicador de impactos independiente del sprite |
| `proyectiles_tipos.png` (32×32, 3 cuadros) | Paridad, CRC y Hamming | Confirmar correspondencia de cuadros y tipos |
| `fondo_lejano.png`, `fondo_parallax.png`, `fondo_cercano.png` (1280×720) | Fondo y capas con desplazamiento | Verificar transparencia de las capas generadas; el color magenta descrito es una clave que debe eliminarse si no se exporta alfa |
| `tileset_circuitos.png` (16 baldosas de 64×64) | Elementos de escenario o decoración | No es obligatorio para el bucle central |
| `ui_elementos.png` (8 cuadros de 64×64) | Iconos, logo y HUD | Confirmar mapa de cuadros antes de integrarlo |

Los nombres anteriores son los recursos esperados; si aún no existen, usar primitivas dibujadas en Phaser y sustituirlas cuando estén disponibles. No bloquear la lógica del juego por la producción de arte.

## Riesgos y mitigaciones

- **Ruido en Pose y latencia de cámara:** suavizar posición/ángulo, filtrar detección por duración mínima y permitir calibración rápida. Mantener alternativa por teclado.
- **Ambigüedad de controles y señales superpuestas:** usar entradas dependientes del estado; pausar captura de disparo mientras se eligen mejoras.
- **Errores accidentales sobre tramas sanas:** dar feedback inmediato, hacer el bit corrupto muy legible y ofrecer tiempo de reacción suficiente.
- **CDN o conexión no disponible:** mostrar un error comprensible si Phaser o MediaPipe no cargan; mantener clara la dependencia de red para el arranque y priorizar una copia local solo si las condiciones de entrega exigen jugar sin conexión.
- **Duración/balance:** medir cada oleada y ajustar generación, velocidad, vidas y daño para acercarse al objetivo de 3–5 minutos.
- **Compatibilidad gráfica:** limitar partículas simultáneas y comprobar WebGL/cámara en Chrome y Edge objetivo.

## Secuencia recomendada de validación

1. Probar el juego completo con controles de teclado y formas provisionales.
2. Verificar vidas, impactos, contadores, transiciones de oleada y derrota/victoria.
3. Revisar cada tipo de bola y el jefe por separado.
4. Probar gestos en buena iluminación, con variación de distancia y posición; probar también denegación de permisos.
5. Revisar que la mejora no se seleccione por una pose residual y que disparar no active selección.
6. Comparar duración y métricas de varias partidas, y validar exportación del resultado JSON.
7. Comprobar la build de producción y ejecutar en Chrome y Edge desde localhost o HTTPS.
