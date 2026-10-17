export function renderBootError(container) {
  if (!container) return
  container.innerHTML = '<section class="load-error" role="alert"><strong>No se pudo cargar el motor del juego.</strong><p>Comprueba tu conexión a jsDelivr y vuelve a intentarlo.</p><button id="retry-phaser" type="button">REINTENTAR CARGA</button></section>'
  container.querySelector('#retry-phaser')?.addEventListener('click', () => window.location.reload())
}
