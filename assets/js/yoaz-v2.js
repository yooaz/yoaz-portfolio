/* YOAZ v2 — one small, dependency-free controller. */
(() => {
  "use strict";
  const copy = {
    fr: {
      navWork:"Projets",navArt:"Art",navShop:"Éditions",navAbout:"À propos",navContact:"Parlons de votre projet ↗",
      heroTag:"ILLUSTRATION & DIRECTION ARTISTIQUE",heroIntro:"Des mondes graphiques qui ne ressemblent à aucun autre.",
      heroPlace:"Géométrie • Couleur • Psychédélisme\nParis — Amsterdam · Disponible partout",
      discover:"Explorer les projets",collaborate:"Travaillons ensemble ↗",scroll:"DÉCOUVRIR ↓",
      workKicker:"01 — SÉLECTION",workTitle:"Des images qui marquent.",workIntro:"Une sélection de collaborations, de campagnes et d'univers visuels créés pour des marques du monde entier.",
      filterAll:"Tout voir",filterCampaign:"Campagnes",filterEditorial:"Éditorial",filterObject:"Objets & packaging",
      artKicker:"02 — UNIVERS PERSONNEL",artTitle:"Un langage visuel à part.",artIntro:"Couleurs franches, symétries improbables et détails à explorer.",
      shopKicker:"03 — À COLLECTIONNER",shopTitle:"L'art, chez vous.",shopIntro:"Une sélection de cinq posters Fine Art, format 50 × 70 cm. 59 € chacun, livraison Europe incluse.",
      buy:"Acheter ↗",aboutKicker:"04 — À PROPOS",aboutLead:"J'imagine des compositions géométriques et psychédéliques où chaque détail compte.",
      aboutText:"Illustrateur et directeur artistique indépendant depuis 2011, je collabore avec des marques, des éditeurs et des studios dans le monde entier. De l'illustration éditoriale aux fresques monumentales, je façonne des univers visuels immédiatement reconnaissables.",
      motionKicker:"EN MOUVEMENT",motionTitle:"L'image prend vie.",
      contactKicker:"05 — FAISONS ÉQUIPE",contactTitle:"On crée quelque chose d'unique ?",contactIntro:"Campagne, pochette, affiche, mural ou collaboration : racontez-moi votre idée.",
      formName:"Votre nom",formEmail:"Votre email",formProject:"Votre projet",send:"Envoyer mon message",formNote:"Ou écrivez directement à l'adresse indiquée.",
      footerLine:"Illustration sans frontières.",backToTop:"Retour en haut ↑",checkoutWait:"Ouverture du paiement sécurisé…",checkoutError:"Paiement momentanément indisponible. Écrivez à yoaz@hotmail.fr."
    },
    en: {
      navWork:"Work",navArt:"Art",navShop:"Prints",navAbout:"About",navContact:"Start a project ↗",
      heroTag:"ILLUSTRATION & ART DIRECTION",heroIntro:"Graphic worlds unlike anything you've seen before.",
      heroPlace:"Geometry • Colour • Psychedelia\nParis — Amsterdam · Available worldwide",
      discover:"Explore the work",collaborate:"Let's collaborate ↗",scroll:"EXPLORE ↓",
      workKicker:"01 — SELECTED WORK",workTitle:"Images that stay with you.",workIntro:"Selected collaborations, campaigns and visual worlds for brands across the globe.",
      filterAll:"All projects",filterCampaign:"Campaigns",filterEditorial:"Editorial",filterObject:"Objects & packaging",
      artKicker:"02 — PERSONAL WORK",artTitle:"A visual language of its own.",artIntro:"Electric colours, unexpected symmetry and details worth discovering.",
      shopKicker:"03 — COLLECTIBLE ART",shopTitle:"Art for your walls.",shopIntro:"Five Fine Art prints, 50 × 70 cm. €59 each, European shipping included.",
      buy:"Buy print ↗",aboutKicker:"04 — ABOUT",aboutLead:"I create geometric, psychedelic compositions where every detail matters.",
      aboutText:"An independent illustrator and art director since 2011, I collaborate with brands, publishers and studios worldwide. From editorial artwork to monumental murals, I build instantly recognisable visual worlds.",
      motionKicker:"IN MOTION",motionTitle:"Artwork comes alive.",
      contactKicker:"05 — GET IN TOUCH",contactTitle:"Let's make something unique.",contactIntro:"A campaign, record sleeve, poster, mural or collaboration? Tell me about your idea.",
      formName:"Your name",formEmail:"Your email",formProject:"Your project",send:"Send message",formNote:"Or email me directly at the address shown.",
      footerLine:"Illustration without borders.",backToTop:"Back to top ↑",checkoutWait:"Opening secure checkout…",checkoutError:"Checkout is temporarily unavailable. Email yoaz@hotmail.fr."
    },
    nl: {
      navWork:"Projecten",navArt:"Kunst",navShop:"Prints",navAbout:"Over mij",navContact:"Start een project ↗",
      heroTag:"ILLUSTRATIE & ART DIRECTION",heroIntro:"Grafische werelden die je nergens anders ziet.",
      heroPlace:"Geometrie • Kleur • Psychedelica\nParijs — Amsterdam · Wereldwijd beschikbaar",
      discover:"Bekijk de projecten",collaborate:"Laten we samenwerken ↗",scroll:"ONTDEK ↓",
      workKicker:"01 — SELECTIE",workTitle:"Beelden die bijblijven.",workIntro:"Een selectie samenwerkingen, campagnes en visuele werelden voor merken wereldwijd.",
      filterAll:"Alles",filterCampaign:"Campagnes",filterEditorial:"Redactioneel",filterObject:"Objecten & verpakkingen",
      artKicker:"02 — EIGEN WERK",artTitle:"Een eigen beeldtaal.",artIntro:"Heldere kleuren, verrassende symmetrie en eindeloos veel details.",
      shopKicker:"03 — KUNSTPRINTS",shopTitle:"Kunst voor aan de muur.",shopIntro:"Vijf Fine Art prints, 50 × 70 cm. €59 per stuk, verzending binnen Europa inbegrepen.",
      buy:"Bestellen ↗",aboutKicker:"04 — OVER MIJ",aboutLead:"Ik maak geometrische, psychedelische composities waarin elk detail telt.",
      aboutText:"Sinds 2011 werk ik als zelfstandig illustrator en artdirector met merken, uitgevers en studio's over de hele wereld. Van redactionele illustraties tot monumentale muurschilderingen: mijn werk heeft een herkenbare visuele signatuur.",
      motionKicker:"IN BEWEGING",motionTitle:"Beeld komt tot leven.",
      contactKicker:"05 — CONTACT",contactTitle:"Zullen we iets bijzonders maken?",contactIntro:"Een campagne, albumhoes, poster, muurschildering of samenwerking? Vertel over je idee.",
      formName:"Je naam",formEmail:"Je e-mailadres",formProject:"Je project",send:"Bericht versturen",formNote:"Of mail me rechtstreeks via het bovenstaande adres.",
      footerLine:"Illustratie zonder grenzen.",backToTop:"Terug naar boven ↑",checkoutWait:"Beveiligde betaling openen…",checkoutError:"Betalen is tijdelijk niet beschikbaar. Mail naar yoaz@hotmail.fr."
    },
    es: {
      navWork:"Proyectos",navArt:"Arte",navShop:"Láminas",navAbout:"Sobre mí",navContact:"Hablemos de tu proyecto ↗",
      heroTag:"ILUSTRACIÓN & DIRECCIÓN DE ARTE",heroIntro:"Universos gráficos como nunca antes habías visto.",
      heroPlace:"Geometría • Color • Psicodelia\nParís — Ámsterdam · Disponible en todo el mundo",
      discover:"Explorar proyectos",collaborate:"Colaboremos ↗",scroll:"EXPLORAR ↓",
      workKicker:"01 — SELECCIÓN",workTitle:"Imágenes que dejan huella.",workIntro:"Una selección de colaboraciones, campañas y universos visuales para marcas internacionales.",
      filterAll:"Todos",filterCampaign:"Campañas",filterEditorial:"Editorial",filterObject:"Objetos y packaging",
      artKicker:"02 — OBRA PERSONAL",artTitle:"Un lenguaje visual único.",artIntro:"Colores vibrantes, simetrías sorprendentes y detalles por descubrir.",
      shopKicker:"03 — ARTE PARA COLECCIONAR",shopTitle:"Arte en tus paredes.",shopIntro:"Cinco láminas Fine Art de 50 × 70 cm. 59 € cada una, envío a Europa incluido.",
      buy:"Comprar ↗",aboutKicker:"04 — SOBRE MÍ",aboutLead:"Creo composiciones geométricas y psicodélicas en las que cada detalle importa.",
      aboutText:"Soy ilustrador y director de arte independiente desde 2011. Colaboro con marcas, editoriales y estudios de todo el mundo. Desde ilustraciones editoriales hasta murales monumentales, creo universos visuales inconfundibles.",
      motionKicker:"EN MOVIMIENTO",motionTitle:"El arte cobra vida.",
      contactKicker:"05 — CONTACTO",contactTitle:"¿Creamos algo único?",contactIntro:"¿Una campaña, portada, póster, mural o colaboración? Cuéntame tu idea.",
      formName:"Tu nombre",formEmail:"Tu email",formProject:"Tu proyecto",send:"Enviar mensaje",formNote:"O escríbeme directamente a la dirección indicada.",
      footerLine:"Ilustración sin fronteras.",backToTop:"Volver arriba ↑",checkoutWait:"Abriendo pago seguro…",checkoutError:"El pago no está disponible temporalmente. Escribe a yoaz@hotmail.fr."
    }
  };
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const languageSelect = qs("#lang-select");
  const menuToggle = qs(".menu-toggle");
  const navigation = qs("#site-nav");
  const dialog = qs("#art-dialog");
  const viewerImage = qs("#viewer-image");
  const viewerTitle = qs("#viewer-title");
  const viewerCount = qs("#viewer-counter");
  const viewerCaption = qs("#viewer-caption");
  const prev = qs("#viewer-prev");
  const next = qs("#viewer-next");
  const checkoutStatus = qs("#checkout-status");
  let lang = "fr";
  let images = [];
  let activeIndex = 0;
  let lastFocus = null;

  function setLanguage(value, updateUrl = true) {
    lang = Object.hasOwn(copy, value) ? value : "fr";
    document.documentElement.lang = lang;
    languageSelect.value = lang;
    qsa("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const translated = copy[lang][key] || copy.fr[key];
      if (translated) el.textContent = translated;
    });
    const place = qs("[data-i18n='heroPlace']");
    if (place) place.style.whiteSpace = "pre-line";
    menuToggle.setAttribute("aria-label", lang === "fr" ? "Ouvrir le menu" : "Open menu");
    if (updateUrl) {
      const url = new URL(location.href);
      if (lang === "fr") url.searchParams.delete("lang");
      else url.searchParams.set("lang", lang);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }
  const initialLang = new URLSearchParams(location.search).get("lang") || "fr";
  setLanguage(initialLang, false);
  languageSelect.addEventListener("change", () => setLanguage(languageSelect.value));

  function closeNav() {
    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    navigation.classList.toggle("is-open", !expanded);
    menuToggle.setAttribute("aria-expanded", String(!expanded));
  });
  qsa(".site-nav a").forEach(link => link.addEventListener("click", closeNav));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNav();
  });
  document.addEventListener("click", event => {
    if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) closeNav();
  });

  const filters = qsa(".filter");
  const projects = qsa(".project");
  filters.forEach(filter => filter.addEventListener("click", () => {
    const type = filter.dataset.filter;
    filters.forEach(button => {
      const selected = button === filter;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    projects.forEach(project => { project.hidden = type !== "all" && project.dataset.type !== type; });
    qs("#work-grid").classList.toggle("is-filtered", type !== "all");
  }));

  function updateViewer() {
    if (!images.length) return;
    const src = images[activeIndex];
    viewerImage.src = src;
    viewerImage.alt = viewerTitle.textContent + " — " + (activeIndex + 1);
    viewerCount.textContent = (activeIndex + 1) + " / " + images.length;
    prev.disabled = images.length <= 1;
    next.disabled = images.length <= 1;
  }
  function showViewer(sources, title, description) {
    if (!dialog || typeof dialog.showModal !== "function") {
      location.href = sources[0];
      return;
    }
    images = sources.filter(source => source.startsWith("/images/"));
    if (!images.length) return;
    activeIndex = 0;
    viewerTitle.textContent = title;
    viewerCaption.textContent = description || title;
    lastFocus = document.activeElement;
    updateViewer();
    dialog.showModal();
    document.body.classList.add("dialog-open");
    qs("#viewer-close").focus();
  }
  function changeImage(step) {
    if (!images.length) return;
    activeIndex = (activeIndex + step + images.length) % images.length;
    updateViewer();
  }
  qsa(".project-open").forEach(button => button.addEventListener("click", () => {
    showViewer((button.dataset.projectImages || "").split("|"), button.dataset.projectTitle, button.dataset.projectDesc);
  }));
  qsa(".art-tile").forEach(button => button.addEventListener("click", () => {
    showViewer([button.dataset.art], button.dataset.caption, button.dataset.caption);
  }));
  qs("#viewer-close").addEventListener("click", () => dialog.close());
  prev.addEventListener("click", () => changeImage(-1));
  next.addEventListener("click", () => changeImage(1));
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); changeImage(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); changeImage(1); }
  });
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    viewerImage.removeAttribute("src");
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  });

  qsa("[data-buy]").forEach(button => button.addEventListener("click", async () => {
    if (button.disabled) return;
    button.disabled = true;
    checkoutStatus.textContent = copy[lang].checkoutWait;
    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({slug:button.dataset.buy})
      });
      if (!response.ok) throw new Error("Checkout " + response.status);
      const data = await response.json();
      const checkoutUrl = new URL(data.url);
      if (checkoutUrl.protocol !== "https:") throw new Error("Invalid checkout URL");
      location.assign(checkoutUrl.href);
    } catch (error) {
      checkoutStatus.textContent = copy[lang].checkoutError;
      button.disabled = false;
    }
  }));
  qs("#year").textContent = String(new Date().getFullYear());
})();
