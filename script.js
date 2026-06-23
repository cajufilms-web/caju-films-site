/**
 * ═══════════════════════════════════════════════════════════════
 *  CAJU FILMS — script.js  (V3)
 *  Interações cinematográficas. Performance-first. Acessível.
 *  Zero dependências externas.
 * ═══════════════════════════════════════════════════════════════
 *
 *  Módulos:
 *  1. Utilitários
 *  2. Scroll Reveal    — IntersectionObserver, stagger por grupo
 *  3. Navbar           — estado ao rolar, cor dinâmica
 *  4. Parallax         — movimento sutil no vídeo do hero
 *  5. Hero Reveal      — animação de entrada imediata
 *  6. Hero Video       — autoplay com fallback gracioso
 *  7. Mobile Menu      — overlay com ARIA completo
 *  8. Smooth Scroll    — compensa a navbar fixa
 *  9. Init             — ponto de entrada único
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   1. UTILITÁRIOS
   ═══════════════════════════════════════════════════════════════ */

/** Atalho para querySelector */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/** Atalho para querySelectorAll como Array */
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/**
 * Verifica prefers-reduced-motion — cacheado para não consultar
 * o media query mais de uma vez por sessão.
 */
const prefersReducedMotion = (() => {
  let cached = null;
  return () => {
    if (cached === null) {
      cached = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return cached;
  };
})();

/**
 * Throttle via requestAnimationFrame.
 * Garante no máximo 1 execução por frame de pintura.
 */
function rafThrottle(fn) {
  let ticking = false;
  return function (...args) {
    if (!ticking) {
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
      ticking = true;
    }
  };
}


/* ═══════════════════════════════════════════════════════════════
   2. SCROLL REVEAL
   IntersectionObserver com stagger automático dentro de cada seção.
   Cada grupo de .fade-up dentro de um container recebe delays
   calculados dinamicamente — sem depender de classes estáticas.
   ═══════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const elements = $$('.fade-up');
  if (!elements.length) return;

  // Sem animação para usuários com sensibilidade a movimento
  if (prefersReducedMotion()) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        el.classList.add('visible');
        observer.unobserve(el);
      });
    },
    {
      threshold:  0.08,
      rootMargin: '0px 0px -56px 0px',
    }
  );

  elements.forEach(el => {
    // Elementos do hero são tratados por initHeroReveal()
    if (!el.closest('#hero')) {
      observer.observe(el);
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   3. NAVBAR — ESTADO AO ROLAR
   Adiciona .scrolled quando o usuário rola além de 80px.
   O CSS lida com todo o visual (cor, backdrop-filter, border).
   ═══════════════════════════════════════════════════════════════ */
function initNavScroll() {
  const nav = $('#nav');
  if (!nav) return;

  const THRESHOLD = 80;

  const update = rafThrottle(() => {
    const scrolled = window.scrollY > THRESHOLD;
    if (scrolled !== nav.classList.contains('scrolled')) {
      nav.classList.toggle('scrolled', scrolled);
    }
  });

  window.addEventListener('scroll', update, { passive: true });
  update(); // aplica estado inicial (ex: refresh com página já rolada)
}


/* ═══════════════════════════════════════════════════════════════
   4. PARALLAX — HERO VIDEO (sutil)
   ─────────────────────────────────────────────────────────────
   Desloca o vídeo de fundo levemente no eixo Y ao rolar.
   Fator: 0.25 — leve o suficiente para parecer profundidade,
   sutil o suficiente para não distrair.

   Nota: o .hero-video tem height: 110% no CSS para que as
   bordas não fiquem visíveis durante o deslocamento.
   ═══════════════════════════════════════════════════════════════ */
function initHeroParallax() {
  const heroBg = $('#heroBg');
  const video  = $('.hero-video');

  if (!heroBg || !video || prefersReducedMotion()) return;

  const FACTOR = 0.25;

  const update = rafThrottle(() => {
    const scrollY = window.scrollY;
    // Só ativa se ainda estiver na zona do hero
    if (scrollY > window.innerHeight) return;

    const offset = scrollY * FACTOR;
    // Translate negativo: vídeo sobe mais devagar que a página
    video.style.transform = `translateY(${offset}px)`;
  });

  window.addEventListener('scroll', update, { passive: true });
}


/* ═══════════════════════════════════════════════════════════════
   5. HERO — ANIMAÇÃO DE ENTRADA
   Revela os elementos do hero imediatamente no load,
   com os delays declarados nas classes CSS (.fade-delay-*).
   Usa dois frames para garantir que o paint ocorreu antes.
   ═══════════════════════════════════════════════════════════════ */
function initHeroReveal() {
  const heroEls = $$('#hero .fade-up');
  if (!heroEls.length) return;

  if (prefersReducedMotion()) {
    heroEls.forEach(el => el.classList.add('visible'));
    return;
  }

  // Aguarda 2 frames: layout → paint → revela
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroEls.forEach(el => el.classList.add('visible'));
    });
  });
}


/* ═══════════════════════════════════════════════════════════════
   6. HERO VIDEO — AUTOPLAY COM FALLBACK
   Alguns browsers bloqueiam autoplay sem interação do usuário.
   Quando bloqueado, o poster.jpg é exibido automaticamente.
   ═══════════════════════════════════════════════════════════════ */
function initHeroVideo() {
  const video = $('.hero-video');
  if (!video) return;

  // Só tenta se há uma fonte declarada
  const hasSrc = video.querySelector('source[src]');
  const srcAttr = video.getAttribute('src');
  if (!hasSrc && !srcAttr) return;

  const promise = video.play();
  if (promise !== undefined) {
    promise.catch(() => {
      // Autoplay bloqueado: poster.jpg é exibido pelo browser
      // Nenhuma ação adicional necessária
    });
  }
}


/* ═══════════════════════════════════════════════════════════════
   7. MOBILE MENU — OVERLAY COM ARIA COMPLETO
   ─────────────────────────────────────────────────────────────
   Controla o overlay fullscreen de navegação mobile.
   Gerencia: estado ARIA, foco, scroll do body, tecla Escape.
   O botão X dentro do overlay também fecha o menu.
   ═══════════════════════════════════════════════════════════════ */
function initMobileMenu() {
  const burger      = $('#navBurger');
  const overlay     = $('#navOverlay');
  const closeBtn    = $('.overlay-close', overlay);
  const overlayLinks = $$('.overlay-link', overlay);

  if (!burger || !overlay) return;

  let isOpen = false;

  function open() {
    isOpen = true;

    // Estado ARIA
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fechar menu');

    // Ativa overlay
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    // Trava scroll do body
    document.body.style.overflow = 'hidden';

    // Move foco para o primeiro link após a animação
    const first = overlayLinks[0];
    if (first) setTimeout(() => first.focus(), 120);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';
    burger.focus();
  }

  // Toggle pelo hambúrguer
  burger.addEventListener('click', () => (isOpen ? close() : open()));

  // Fechar pelo botão X interno
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Fechar ao clicar num link
  overlayLinks.forEach(link => link.addEventListener('click', close));

  // Fechar com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) close();
  });

  // Armadilha de foco: Tab dentro do overlay não escapa
  overlay.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !isOpen) return;
    const focusable = $$('a, button', overlay).filter(
      el => !el.hasAttribute('disabled')
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   8. SMOOTH SCROLL — ANCORA INTERNA
   Intercepta cliques em href="#ancora" e executa scroll fluido,
   compensando exatamente a altura atual da navbar fixa.
   ═══════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  const nav = $('#nav');

  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();

      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion() ? 'instant' : 'smooth',
      });
    });
  });
}


/* ═══════════════════════════════════════════════════════════════
   9. INIT — PONTO DE ENTRADA ÚNICO
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initHeroReveal();    // após ScrollReveal para não observar o hero
  initHeroParallax();
  initHeroVideo();
});
