/* AdBoard site interactions — theme, reveals, counters, charts, faq */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var staticMode = /[?&]static=1(?:&|$)/.test(location.search);

  /* ---------- Theme ---------- */
  var themeKey = "adboard-theme";
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(mode) {
    root.setAttribute("data-theme", mode);
    try { localStorage.setItem(themeKey, mode); } catch (e) {}
    if (themeMeta) {
      themeMeta.setAttribute("content", mode === "light" ? "#f5f4f0" : "#0e0f10");
    }
    var btn = document.getElementById("themeToggle");
    if (btn) btn.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
  }
  function initialTheme() {
    try {
      var saved = localStorage.getItem(themeKey);
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {}
    return "light";
  }
  applyTheme(root.getAttribute("data-theme") || initialTheme());
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("#themeToggle");
    if (!btn) return;
    var cur = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(cur);
  });

  /* ---------- Header + sticky CTA ---------- */
  var header = document.getElementById("siteHeader");
  var sticky = document.getElementById("stickyCta");
  var hero = document.getElementById("hero");
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (sticky && hero) {
      var past = y > hero.offsetTop + hero.offsetHeight - 120;
      sticky.classList.toggle("is-visible", past);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function revealInView() {
    var vh = window.innerHeight || 800;
    revealEls.forEach(function (el) {
      if (el.classList.contains("is-visible")) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > -40) el.classList.add("is-visible");
    });
  }
  if ("IntersectionObserver" in window && !reduceMotion && !staticMode) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    revealInView();
    window.addEventListener("scroll", revealInView, { passive: true });
    setTimeout(revealInView, 1200);
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count") || "0");
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion || staticMode) {
      el.textContent = prefix + target.toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;
      return;
    }
    var dur = 1400;
    var start = null;
    function frame(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      var val = target * eased;
      el.textContent = prefix + val.toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          countUp(en.target);
          cio.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------- SVG draw + grow animations ---------- */
  function animateOnView(el, fn) {
    if (reduceMotion || staticMode) { fn(1); return; }
    if (!("IntersectionObserver" in window)) { fn(1); return; }
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { fn(0); o.unobserve(el); }
      });
    }, { threshold: 0.35 });
    o.observe(el);
  }

  // Trend lines draw left -> right
  Array.prototype.slice.call(document.querySelectorAll(".trend-svg")).forEach(function (svg) {
    var lines = svg.querySelectorAll(".draw-line");
    lines.forEach(function (path) {
      var len = 1200;
      try { len = path.getTotalLength() || 1200; } catch (e) {}
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      animateOnView(svg, function (instant) {
        if (instant) {
          path.style.transition = "none";
          path.style.strokeDashoffset = "0";
          return;
        }
        path.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1)";
        requestAnimationFrame(function () { path.style.strokeDashoffset = "0"; });
      });
    });
  });

  // Sparkline draw
  Array.prototype.slice.call(document.querySelectorAll(".spark")).forEach(function (svg) {
    var line = svg.querySelector(".spark-line");
    if (!line) return;
    var len = 600;
    try { len = line.getTotalLength() || 600; } catch (e) {}
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = String(len);
    animateOnView(svg, function (instant) {
      if (instant) {
        line.style.transition = "none";
        line.style.strokeDashoffset = "0";
        return;
      }
      line.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) 0.15s";
      requestAnimationFrame(function () { line.style.strokeDashoffset = "0"; });
    });
  });

  // Bar + source fills grow
  Array.prototype.slice.call(document.querySelectorAll("[data-grow]")).forEach(function (el) {
    var to = el.getAttribute("data-grow") || "1";
    if (staticMode) {
      el.style.transform = "scaleX(" + to + ")";
      return;
    }
    el.style.transform = "scaleX(0)";
    el.style.transition = "transform 1s cubic-bezier(0.16,1,0.3,1)";
    animateOnView(el, function () {
      requestAnimationFrame(function () {
        el.style.transform = "scaleX(" + to + ")";
      });
    });
    if (reduceMotion) el.style.transform = "scaleX(" + to + ")";
  });

  /* ---------- Stagger-in groups ---------- */
  var staggerEls = Array.prototype.slice.call(document.querySelectorAll("[data-stagger]"));
  if ("IntersectionObserver" in window && !reduceMotion && !staticMode) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-inview");
          sio.unobserve(en.target);
        }
      });
    }, { threshold: 0.22 });
    staggerEls.forEach(function (el) { sio.observe(el); });
  } else {
    staggerEls.forEach(function (el) { el.classList.add("is-inview"); });
  }

  /* ---------- Scrollspy ---------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var spyMap = {};
  spyLinks.forEach(function (a) {
    var sec = document.querySelector(a.getAttribute("href"));
    if (sec) spyMap[a.getAttribute("href")] = { link: a, sec: sec };
  });
  function setActive(hash) {
    spyLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === hash);
    });
  }
  if ("IntersectionObserver" in window && spyLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive("#" + en.target.id);
      });
    }, { rootMargin: "-38% 0px -55% 0px" });
    Object.keys(spyMap).forEach(function (hash) { spy.observe(spyMap[hash].sec); });
  }

  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Card spotlight ---------- */
  if (finePointer && !reduceMotion) {
    document.addEventListener("pointermove", function (ev) {
      var card = ev.target.closest &&
        ev.target.closest(".bento-card,.problem-card,.step,.stat,.persona-panel");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      card.style.setProperty("--my", (ev.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---------- Magnetic play links ---------- */
  if (finePointer && !reduceMotion) {
    Array.prototype.slice.call(document.querySelectorAll("[data-magnetic]")).forEach(function (el) {
      el.addEventListener("pointermove", function (ev) {
        var r = el.getBoundingClientRect();
        var dx = (ev.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (ev.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = "translate(" + (dx * 6).toFixed(1) + "px," + (dy * 5).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ---------- Hero phone tilt + chip parallax ---------- */
  var heroVisual = document.querySelector(".hero-visual");
  var heroPhone = heroVisual ? heroVisual.querySelector(".phone") : null;
  var heroChips = heroVisual
    ? Array.prototype.slice.call(heroVisual.querySelectorAll(".float-chip"))
    : [];
  if (heroVisual && heroPhone && finePointer && !reduceMotion) {
    var depths = [10, 14, 12, 16];
    heroVisual.addEventListener("pointermove", function (ev) {
      var r = heroVisual.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - 0.5;
      var py = (ev.clientY - r.top) / r.height - 0.5;
      heroPhone.style.setProperty("--ry", (px * 7).toFixed(2) + "deg");
      heroPhone.style.setProperty("--rx", (-py * 6).toFixed(2) + "deg");
      heroChips.forEach(function (chip, i) {
        var d = depths[i % depths.length];
        chip.style.translate = (-px * d).toFixed(1) + "px " + (-py * d).toFixed(1) + "px";
      });
    });
    heroVisual.addEventListener("pointerleave", function () {
      heroPhone.style.setProperty("--rx", "0deg");
      heroPhone.style.setProperty("--ry", "0deg");
      heroChips.forEach(function (chip) { chip.style.translate = ""; });
    });
  }

  /* ---------- Hero headline marker ---------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var heroSec = document.getElementById("top");
      if (heroSec) heroSec.classList.add("hero--ready");
    });
  });

  /* ---------- Final CTA pulse once ---------- */
  var finalSec = document.querySelector(".final");
  if (staticMode && finalSec) {
    finalSec.classList.add("go");
  } else if (finalSec && !reduceMotion && "IntersectionObserver" in window) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          finalSec.classList.add("go");
          fio.disconnect();
        }
      });
    }, { threshold: 0.4 });
    fio.observe(finalSec);
  }
  /* ---------- Splash dismissal ---------- */
  var splash = document.getElementById("splash");
  if (staticMode && splash) {
    splash.parentNode.removeChild(splash);
    splash = null;
    document.documentElement.classList.remove("is-loading");
  }
  function dismissSplash() {
    if (!splash || splash.classList.contains("done")) return;
    splash.classList.add("done");
    document.documentElement.classList.remove("is-loading");
    setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      splash = null;
    }, 650);
  }
  if (location.search.indexOf("splash=hold") === -1) {
    window.addEventListener("load", function () {
      setTimeout(dismissSplash, reduceMotion ? 0 : 1600);
    });
    setTimeout(dismissSplash, 5200);
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-privacy-toggle]")).forEach(function (wrap) {
    var btn = wrap.querySelector(".switch");
    var rows = wrap.querySelectorAll(".privacy-row");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-checked") === "true";
      btn.setAttribute("aria-checked", on ? "false" : "true");
      rows.forEach(function (r) { r.classList.toggle("is-masked", !on ? false : true); });
      // default state is masked=true; first click unmasks? keep simple toggle:
      var masked = btn.getAttribute("aria-checked") === "true";
      rows.forEach(function (r) { r.classList.toggle("is-masked", masked); });
    });
  });

  /* ---------- FAQ analytics hook (no-op, extensible) ---------- */
  document.addEventListener("toggle", function (ev) {
    var d = ev.target.closest && ev.target.closest(".faq-item");
    if (d && d.open) {
      var q = d.querySelector("summary");
      if (q && window.dataLayer === undefined) { /* placeholder for event tracking */ }
    }
  }, true);

  /* ---------- Footer year ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
