(function (global, document) {
  "use strict";

  const conf = global.COMA || {};
  const page = document.body.getAttribute("data-page") || "";
  const navLinks = Array.from(document.querySelectorAll(conf.navSelector || ".site-nav__link[data-nav]"));
  const menuButton = document.getElementById("siteMenuButton");
  const nav = document.getElementById("siteNav");
  const yearNode = document.getElementById("jsCurrentYear");

  // ===================================================
  // Current Page Highlight
  // ===================================================

  for (const link of navLinks) {
    if (link.getAttribute("data-nav") === page) {
      link.classList.add("is-current");
    }
  }

  // ===================================================
  // Year
  // ===================================================

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  // ===================================================
  // Mobile Menu
  // ===================================================

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) {
        return;
      }
      if (nav.contains(event.target) || menuButton.contains(event.target)) {
        return;
      }
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });

    global.addEventListener("resize", function () {
      if (global.innerWidth > (conf.mobileWidth || 860) && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ===================================================
  // Header Scroll Shadow
  // ===================================================

  const header = document.querySelector(".site-header");
  if (header) {
    let ticking = false;
    global.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          const sy = global.scrollY;
          if (sy > 10) {
            header.classList.add("is-scrolled");
          } else {
            header.classList.remove("is-scrolled");
          }
          if (sy > 400) {
            btt.classList.add("is-show");
          } else {
            btt.classList.remove("is-show");
          }
          ticking = false;
        });
      }
    });
  }

  // ===================================================
  // Back to Top
  // ===================================================

  const btt = document.createElement("button");
  btt.className = "back-to-top";
  btt.setAttribute("aria-label", "ページ上部へ戻る");
  btt.innerHTML = "&#8593;";
  document.body.appendChild(btt);

  btt.addEventListener("click", function () {
    global.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ===================================================
  // Section EN — Parallax Lite���背景英字の微量横スクロール）
  // ===================================================

  const sectionEns = Array.from(document.querySelectorAll(".section-en, .sub-hero__en"));
  if (sectionEns.length) {
    let paraTicking = false;
    global.addEventListener("scroll", function () {
      if (!paraTicking) {
        paraTicking = true;
        requestAnimationFrame(function () {
          const scrollY = global.scrollY;
          for (let i = 0; i < sectionEns.length; i++) {
            const el = sectionEns[i];
            const rect = el.getBoundingClientRect();
            if (rect.top < global.innerHeight && rect.bottom > 0) {
              const offset = (rect.top / global.innerHeight - 0.5) * -12;
              el.style.transform = "translateY(-50%) translateX(" + offset + "px)";
            }
          }
          paraTicking = false;
        });
      }
    });
  }

  // ===================================================
  // Loading Screen + Ready（全ページ共通）
  // ===================================================

  const loadingEl = document.getElementById("siteLoading");

  global.addEventListener("load", function () {
    document.body.classList.add("is-ready");

    if (loadingEl) {
      loadingEl.classList.add("is-out");
      setTimeout(function () {
        if (loadingEl.parentNode) {
          loadingEl.parentNode.removeChild(loadingEl);
        }
      }, 800);
    }
  });

  // ===================================================
  // Scroll Entrance — IntersectionObserver (.js-fade)
  // ===================================================

  const fadeEls = Array.from(document.querySelectorAll(".js-fade"));
  if (fadeEls.length) {
    const fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    fadeEls.forEach(function (el) {
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll(".js-fade"));
        const pos = siblings.indexOf(el);
        if (pos > 0) {
          el.style.transitionDelay = (pos * 0.06) + "s";
        }
      }
      fadeObserver.observe(el);
    });
  }

})(window, document);
