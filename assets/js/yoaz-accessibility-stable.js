/* YOAZ — focused accessibility fixes for the existing homepage.
   Does not replace the original project modal, gallery, menu or translations. */
(() => {
  'use strict';
  const SELECTOR = 'a[href]:not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]):not([tabindex="-1"]),[tabindex]:not([tabindex="-1"])';

  function focusableElements(root) {
    return Array.from(root.querySelectorAll(SELECTOR)).filter(el =>
      !el.hidden &&
      !(typeof el.closest === 'function' && el.closest('[inert],[aria-hidden="true"]')) &&
      typeof el.getClientRects === 'function' && el.getClientRects().length > 0
    );
  }
  function closeMenu(toggle, links) {
    if (!toggle || !links) return;
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { focusableElements, closeMenu };
  }
  if (typeof document === 'undefined') return;

  function init() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    const dialog = document.getElementById('pj-modal');
    const closeButton = document.getElementById('pj-close');

    if (toggle && links) {
      document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !links.classList.contains('open')) return;
        if (document.body.classList.contains('pj-open')) return;
        event.preventDefault();
        closeMenu(toggle, links);
        toggle.focus({ preventScroll: true });
      }, true);
      document.addEventListener('pointerdown', event => {
        if (!links.classList.contains('open')) return;
        const target = event.target;
        if (links.contains(target) || toggle.contains(target)) return;
        closeMenu(toggle, links);
      }, true);
    }

    if (!dialog || !closeButton) return;
    dialog.setAttribute('tabindex', '-1');
    if (!closeButton.hasAttribute('aria-label')) {
      closeButton.setAttribute('aria-label', 'Fermer le projet');
    }
    let opened = document.body.classList.contains('pj-open');
    let opener = null;
    const cardFrom = node => node && typeof node.closest === 'function'
      ? node.closest('.cw-card[data-pid]') : null;

    document.addEventListener('pointerdown', event => {
      if (!opened) {
        const card = cardFrom(event.target);
        if (card) opener = card;
      }
    }, true);
    document.addEventListener('keydown', event => {
      if (!opened && (event.key === 'Enter' || event.key === ' ')) {
        const card = cardFrom(event.target);
        if (card) opener = card;
      }
      if (!opened || event.key !== 'Tab' || !document.body.classList.contains('pj-open')) return;
      const items = focusableElements(dialog);
      if (!items.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }, true);

    const observer = new MutationObserver(() => {
      const isOpen = document.body.classList.contains('pj-open');
      if (isOpen === opened) return;
      opened = isOpen;
      if (isOpen) {
        requestAnimationFrame(() => {
          if (!document.body.classList.contains('pj-open')) return;
          closeButton.focus({ preventScroll: true });
        });
      } else {
        const returningTo = opener;
        opener = null;
        requestAnimationFrame(() => {
          if (document.body.classList.contains('pj-open')) return;
          if (returningTo && returningTo.isConnected) {
            returningTo.focus({ preventScroll: true });
          }
        });
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else init();
})();
