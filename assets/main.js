/**
 * はじめて注文住宅相談LINE - LP JavaScript
 * FAQ accordion, smooth scroll, hamburger menu, scroll animations
 */

(function () {
  'use strict';

  // ---- Hamburger Menu ----
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('is-active');
      nav.classList.toggle('is-open');
    });

    // Close menu on nav link click
    nav.querySelectorAll('.header__nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('is-active');
        nav.classList.remove('is-open');
      });
    });
  }

  // ---- Scroll animations (IntersectionObserver) ----
  var animatedElements = document.querySelectorAll(
    '.card--promise, .card--topic, .steps__item, .empathy__card, .faq__item'
  );

  if ('IntersectionObserver' in window && animatedElements.length > 0) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all immediately
    animatedElements.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // ---- Close mobile menu on outside click ----
  document.addEventListener('click', function (e) {
    if (nav && nav.classList.contains('is-open')) {
      if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('is-active');
        nav.classList.remove('is-open');
      }
    }
  });
})();
