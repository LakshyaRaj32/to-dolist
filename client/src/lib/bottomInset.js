// Netlify's free plan injects a fixed "Powered by Netlify" badge (an iframe) in the bottom-right
// corner, above everything. It would cover our bottom buttons (+, Create task, Edit, Get Started),
// so we measure it and expose the space it takes as `--bottom-inset`. Without the badge it stays 0.

const BADGE_SELECTOR = '#nl-badge-frame';
const GAP = 8;

function update() {
  const badge = document.querySelector(BADGE_SELECTOR);
  const rect = badge?.getBoundingClientRect();
  const visible = rect && rect.height > 0 && getComputedStyle(badge).display !== 'none';
  // Space from the bottom of the viewport to the top of the badge.
  const inset = visible ? Math.max(0, Math.round(window.innerHeight - rect.top + GAP)) : 0;
  document.documentElement.style.setProperty('--bottom-inset', `${inset}px`);
}

export function watchBottomInset() {
  update();
  // The badge is added (and can be dismissed) after the page loads.
  new MutationObserver(update).observe(document.body, { childList: true, subtree: false, attributes: false });
  window.addEventListener('resize', update);
}
