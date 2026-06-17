/* =============================================================
   BioNeuroAdelgaza® — main.js (IIFE, sin dependencias externas)
   Solo enriquece: la página funciona aunque el JS falle.
   ============================================================= */
(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $  = function (s, sc) { return (sc || document).querySelector(s); };
  var $$ = function (s, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(s)); };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function scrollToEl(el) {
    var top = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
  }

  /* ---- Config: precio, checkout, legales, año ---- */
  function injectPrice() {
    if (!data.price) return;
    $$("[data-price]").forEach(function (el) { el.textContent = data.price; });
  }

  function wireCheckout() {
    var url = (data.checkoutUrl || "").trim();
    if (!url) return; // sin URL → los botones siguen llevando a #oferta
    $$("[data-checkout]").forEach(function (a) {
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }

  function wireLegal() {
    var legal = data.legal || {};
    $$("[data-legal]").forEach(function (a) {
      var key = a.getAttribute("data-legal");
      if (legal[key]) a.setAttribute("href", legal[key]);
    });
  }

  function setYear() {
    var y = String(new Date().getFullYear());
    $$("[data-year]").forEach(function (el) { el.textContent = y; });
  }

  /* ---- Smooth anchors ---- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      scrollToEl(el);
    });
  }

  /* ---- Reveal on scroll ---- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
    els.forEach(function (el) { io.observe(el); });

    // Red de seguridad: a los 6s revela lo que quede oculto en pantalla
    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* ---- Count-up de los pilares ---- */
  function fmt(n) { return n.toLocaleString("es-ES"); }
  function runCount(el, target) {
    if (reduced || target === 0) { el.textContent = fmt(target); return; }
    var dur = 1300, start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
    }
    requestAnimationFrame(tick);
  }
  function initCountUp() {
    if (!("IntersectionObserver" in window)) return;
    $$("[data-count-to]").forEach(function (el) {
      var target = parseFloat(el.dataset.countTo);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCount(el, target); io.unobserve(el); }
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ---- FAQ acordeón (un solo abierto) ---- */
  function initFaq() {
    var items = $$(".faq-item");
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  /* ---- Barra CTA flotante ---- */
  function initFloatbar() {
    var bar = $("[data-floatbar]");
    var hero = $("#hero");
    var footer = $(".footer");
    if (!bar || !hero) return;
    function on() {
      var past = window.scrollY > hero.offsetHeight * 0.75;
      var nearEnd = footer && footer.getBoundingClientRect().top < window.innerHeight + 60;
      if (past && !nearEnd) { bar.classList.add("is-visible"); bar.setAttribute("aria-hidden", "false"); }
      else { bar.classList.remove("is-visible"); bar.setAttribute("aria-hidden", "true"); }
    }
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
  }

  /* ---- Modal de video ---- */
  function buildEmbed(url) {
    var u = url.trim();
    var yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) {
      return '<iframe src="https://www.youtube.com/embed/' + yt[1] +
             '?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
    }
    var vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) {
      return '<iframe src="https://player.vimeo.com/video/' + vm[1] +
             '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>';
    }
    if (/\.mp4($|\?)/i.test(u)) {
      return '<video src="' + u + '" controls autoplay playsinline></video>';
    }
    return '<iframe src="' + u + '" allow="autoplay; fullscreen" allowfullscreen></iframe>';
  }
  function initVideo() {
    var trigger = $("[data-video]");
    var modal = $("[data-modal]");
    if (!trigger || !modal) return;
    var mount = $("[data-modal-video]");
    function open() {
      var url = (data.videoUrl || "").trim();
      if (!url) {
        var offer = $("#oferta");
        if (offer) scrollToEl(offer);
        return;
      }
      mount.innerHTML = buildEmbed(url);
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function close() {
      modal.hidden = true;
      mount.innerHTML = "";
      document.body.style.overflow = "";
    }
    trigger.addEventListener("click", open);
    $$("[data-modal-close]").forEach(function (b) { b.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });
  }

  function boot() {
    safe(injectPrice, "injectPrice");
    safe(wireCheckout, "wireCheckout");
    safe(wireLegal, "wireLegal");
    safe(setYear, "setYear");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initFaq, "initFaq");
    safe(initFloatbar, "initFloatbar");
    safe(initVideo, "initVideo");
    document.documentElement.classList.add("is-ready");
  }

  function tryBoot() {
    if (window.__BRAND__) { boot(); }
    else { document.addEventListener("brandLoaded", boot); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryBoot);
  } else {
    tryBoot();
  }
})();
