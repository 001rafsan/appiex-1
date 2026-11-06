/* Minimal progressive enhancement for the Gaming & 3D Worlds use-case selector.
 * All important service information and FAQs remain in server-delivered HTML.
 * No external libraries, animation loops, analytics side-effects, or network calls.
 */
(() => {
  const buttons = [...document.querySelectorAll('[data-world-choice]')];
  const target = document.querySelector('[data-active-world]');
  const title = document.getElementById('g-use-case-heading');
  const copy = document.getElementById('g-use-case-description');
  const scene = document.querySelector('.g-stage[data-world]');
  if (!buttons.length || !target || !title || !copy || !scene) return;

  const options = Object.freeze({
    brand: {
      title: 'Make campaigns worth playing.',
      copy: 'Bring launches, promotions, and stories to life through interactive mini-games and branded digital experiences that invite participation.'
    },
    product: {
      title: 'Let customers explore before they buy.',
      copy: 'Turn product details into an intuitive 3D showroom, configurator, or interactive demonstration with clear paths to the next step.'
    },
    studio: {
      title: 'Prototype a new world, one mechanic at a time.',
      copy: 'Shape your core gameplay loop, player experience, and technical direction with an early prototype before investing in full production.'
    }
  });
  function selectWorld(key) {
    if (!Object.hasOwn(options, key)) return;
    const selected = options[key];
    buttons.forEach(button => {
      const active = button.dataset.worldChoice === key;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    target.dataset.activeWorld = key;
    scene.dataset.world = key;
    title.textContent = selected.title;
    copy.textContent = selected.copy;
  }
  buttons.forEach(button => button.addEventListener('click', () => selectWorld(button.dataset.worldChoice)));
  // The initial brand case is also rendered in static HTML for bots and no-JS users.
})();
