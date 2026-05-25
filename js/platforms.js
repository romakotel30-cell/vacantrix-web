// =====================================================================
// Модуль «Наши площадки»
// =====================================================================

const Platforms = (() => {

  function render() {
    const container = document.getElementById('platforms-content');
    if (!container) return;

    container.innerHTML = `
      <div class="coming-soon reveal">
        <div class="coming-soon-icon">🚀</div>
        <h3>Скоро</h3>
        <p>Здесь появятся наши каналы и сообщества</p>
      </div>`;
  }

  return { loadAndRender: render };
})();
