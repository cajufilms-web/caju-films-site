/**
 * ═══════════════════════════════════════════════════════════════
 *  CAJU FILMS — script.js  (V2)
 *  Interações discretas, performance-first, acessível
 * ═══════════════════════════════════════════════════════════════
 *
 *  Módulos:
 *  1.  Scroll Reveal (IntersectionObserver)
 *  2.  Navbar — estado ao rolar
 *  3.  Mobile Menu — hambúrguer + overlay
 *  4.  Hero — reveal imediato no carregamento
 *  5.  Hero — fallback vídeo (sem autoplay)
 *  6.  Smooth Scroll — âncoras internas
 *  7.  Utilitários
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   UTILITÁRIOS
   ───────────────────────────────────────────────────────────── */

/**
 * Seleciona um único elemento do DOM.
 * @param {string} selector
 * @param {Element} [root=document]
 * @returns {Element|null}
 */
const $ = (selector, root = document) => root.querySelector(selector);

/**
 * Seleciona múltiplos elementos do DOM.
 * @param {string} selector
 * @param {Element} [root=document]
 * @returns {NodeListOf<Element>}
 */
const $$ = (selector, root = document) => root.querySelectorAll(selector);

/**
 * Verifica se o usuário prefere reduzir animações (acessibilidade).
 * @returns {boolean}
 */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ─────────────────────────────────────────────────────────────
   1. SCROLL REVEAL
   Aplica a classe .visible a elementos .fade-up quando entram
   na viewport. Respeita prefers-reduced-motion.
   ───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const elements = $$('.fade-up');

  if (!elements.length) return;

  // Se o usuário preferir menos movimento, revela tudo de uma vez
  if (prefersReducedMotion()) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Observa uma vez, depois libera
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -48px 0px', // Dispara um pouco antes de entrar
    }
  );

  elements.forEach(el => {
    // Ignora elementos dentro do hero — tratados separadamente
    if (!el.closest('#hero')) {
      observer.observe(el);
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   2. NAVBAR — ESTADO AO ROLAR
   Adiciona classe .scrolled à nav quando a página é rolada
   para além de 60px. Usando scroll passivo para performance.
   ───────────────────────────────────────────────────────────── */
function initNavScroll() {
  const nav = $('#nav');
  if (!nav) return;

  const THRESHOLD = 60;
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateNav() {
    const scrolled = window.scrollY > THRESHOLD;
    nav.classList.toggle('scrolled', scrolled);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      // Usa requestAnimationFrame para throttle natural
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  // Estado inicial ao carregar (caso a página abra já rolada)
  updateNav();
}


/* ─────────────────────────────────────────────────────────────
   3. MOBILE MENU — HAMBÚRGUER + OVERLAY
   Controla abertura/fechamento do menu overlay mobile.
   Gerencia ARIA, foco e scroll do body.
   ───────────────────────────────────────────────────────────── */
function initMobileMenu() {
  const burger  = $('#navBurger');
  const overlay = $('#navOverlay');

  if (!burger || !overlay) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fechar menu');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Trava scroll do body

    // Move foco para o primeiro link do menu
    const firstLink = $('.overlay-link', overlay);
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }
  }

  function closeMenu() {
    isOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    burger.focus(); // Devolve foco ao hambúrguer
  }

  function toggleMenu() {
    isOpen ? closeMenu() : openMenu();
  }

  // Toggle ao clicar no hambúrguer
  burger.addEventListener('click', toggleMenu);

  // Fechar ao clicar num link do overlay
  $$('.overlay-link', overlay).forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Fechar com tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });
}


/* ─────────────────────────────────────────────────────────────
   4. HERO — REVEAL IMEDIATO NO CARREGAMENTO
   Os elementos do hero não passam pelo IntersectionObserver.
   São revelados com stagger CSS imediatamente ao carregar,
   criando a primeira impressão de abertura de filme.
   ───────────────────────────────────────────────────────────── */
function initHeroReveal() {
  const heroElements = $$('#hero .fade-up');

  if (!heroElements.length) return;

  if (prefersReducedMotion()) {
    heroElements.forEach(el => el.classList.add('visible'));
    return;
  }

  // Dispara logo após o DOM estar pronto — sem aguardar imagens
  requestAnimationFrame(() => {
    heroElements.forEach(el => el.classList.add('visible'));
  });
}


/* ─────────────────────────────────────────────────────────────
   5. HERO — FALLBACK VÍDEO
   Se o vídeo não puder ser reproduzido (autoplay bloqueado,
   arquivo ausente, conexão lenta), garante que o overlay
   escuro ainda funcione com o fundo Sombra.
   ───────────────────────────────────────────────────────────── */
function initHeroVideo() {
  const video = $('.hero-video');
  if (!video) return;

  // Adiciona classe de controle para fallback via CSS quando necessário
  video.addEventListener('error', () => {
    const media = video.closest('.hero-media');
    if (media) media.classList.add('video-error');
  });

  // Tenta garantir reprodução (alguns browsers requerem interação)
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Se autoplay falhou (ex: política de browser):
      // O poster image é exibido automaticamente como fallback
      // O overlay continua funcionando sobre o poster
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   6. SMOOTH SCROLL — ÂNCORAS INTERNAS
   Intercepta cliques em links #ancora e executa scroll suave
   nativo, respeitando a altura fixa da navbar.
   ───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  const nav = $('#nav');

  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetSelector = anchor.getAttribute('href');

      // Ignora links que são apenas "#"
      if (targetSelector === '#') return;

      const target = $(targetSelector);
      if (!target) return;

      e.preventDefault();

      // Calcula offset para compensar a navbar fixa
      const navHeight = nav ? nav.offsetHeight : 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top: targetTop,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   INICIALIZAÇÃO
   Executado quando o DOM estiver pronto.
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initHeroReveal();   // Após ScrollReveal para que o hero não seja observado
  initHeroVideo();
});
