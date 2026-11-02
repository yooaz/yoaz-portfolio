/* YOAZ — language-aware links to client case studies; static FR links remain crawlable. */
(() => {
  'use strict';
  function update() {
    const nav = document.querySelector('#client .yoaz-project-detail-links');
    if (!nav) return;
    const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
    const labels = {
      fr:'EXPLORER LES PROJETS EN DÉTAIL',
      en:'EXPLORE THE PROJECTS',
      nl:'ONTDEK DE PROJECTEN',
      es:'EXPLORA LOS PROYECTOS'
    };
    const title = nav.querySelector('.yoaz-project-detail-label');
    if (title) title.textContent = labels[lang] || labels.fr;
    nav.querySelectorAll('a[href]').forEach(link => {
      const slug = link.getAttribute('data-yoaz-case-slug') ||
        (link.getAttribute('href').match(/\/(?:projets|en\/projects)\/([a-z0-9-]+)(?:\.html|\/)?/) || [])[1];
      if (!slug) return;
      link.dataset.yoazCaseSlug = slug;
      link.href = lang === 'fr'
        ? '/projets/' + slug + '/'
        : '/en/projects/' + slug + '/';
      link.hreflang = lang === 'fr' ? 'fr' : 'en';
    });
  }
  function init() {
    update();
    new MutationObserver(update).observe(document.documentElement, {
      attributes:true, attributeFilter:['lang']
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
