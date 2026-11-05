/* Appiex editorial reading progress; no dependencies, no tracking. */
(() => {
  const meter = document.querySelector('.appiex-reading-meter > span');
  if (!meter) return;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const root = document.documentElement;
    const available = Math.max(1, root.scrollHeight - root.clientHeight);
    const progress = Math.min(1, Math.max(0, root.scrollTop / available));
    meter.style.width = (progress * 100).toFixed(2) + '%';
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  schedule();
})();
