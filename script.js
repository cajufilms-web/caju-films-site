/**
 * ═══════════════════════════════════════════════════════════════
 *  CAJU FILMS — script.js  (V2)
 *  Interações discretas, performance-first, acessível
 * ═══════════════════════════════════════════════════════════════
 *
 *  1. Scroll Reveal (IntersectionObserver)
 *  2. Navbar — estado ao rolar
 *  3. Mobile Menu — hambúrguer + overlay
 *  4. Hero — reveal imediato no load
 *  5. Hero — fallback vídeo
 *  6. Smooth Scroll — âncoras internas
 */

'use strict';

/* ─── UTILITÁRIOS ────────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ─────────────────────────────────────────────────────────────
   1. SCROLL REVEAL
   ───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const elements = $$('.fade-up');
  if (!elements.length) return;

  if (reducedMotion()) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
  );

  elements.forEach(el => {
    // Elementos do hero são revelados pelo initHeroReveal()
    if (!el.closest('#hero')) observer.observe(el);
  });
}


/* ─────────────────────────────────────────────────────────────
   2. NAVBAR — ESTADO AO ROLAR
   ───────────────────────────────────────────────────────────── */
function initNavScroll() {
  const nav = $('#nav');
  if (!nav) return;

  let ticking = false;

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  updateNav(); // estado inicial
}


/* ─────────────────────────────────────────────────────────────
   3. MOBILE MENU — HAMBÚRGUER + OVERLAY
   Nota: .nav-overlay está fora da <nav> no HTML para não
   interferir no layout flex. O seletor por ID ainda funciona.
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
    document.body.style.overflow = 'hidden';
    // Move foco para o primeiro link
    const firstLink = $('.overlay-link', overlay);
    if (firstLink) setTimeout(() => firstLink.focus(), 80);
  }

  function closeMenu() {
    isOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    burger.focus();
  }

  burger.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

  // Fecha ao clicar num link do overlay
  $$('.overlay-link', overlay).forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Fecha com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });
}


/* ─────────────────────────────────────────────────────────────
   4. HERO — REVEAL IMEDIATO NO LOAD
   ───────────────────────────────────────────────────────────── */
function initHeroReveal() {
  const heroEls = $$('#hero .fade-up');
  if (!heroEls.length) return;

  if (reducedMotion()) {
    heroEls.forEach(el => el.classList.add('visible'));
    return;
  }

  requestAnimationFrame(() => {
    heroEls.forEach(el => el.classList.add('visible'));
  });
}


/* ─────────────────────────────────────────────────────────────
   5. HERO — FALLBACK VÍDEO
   ───────────────────────────────────────────────────────────── */
function initHeroVideo() {
  const video = $('.hero-video');
  if (!video) return;

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay bloqueado: poster.jpg é exibido automaticamente
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   6. SMOOTH SCROLL — ÂNCORAS INTERNAS
   Compensa a altura fixa da navbar.
   ───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  const nav = $('#nav');

  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();
      const offset = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top,
        behavior: reducedMotion() ? 'auto' : 'smooth',
      });
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initHeroReveal();
  initHeroVideo();
});
