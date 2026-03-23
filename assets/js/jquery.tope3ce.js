(function (global, document) {
  "use strict";

  // ===================================================
  // Loading Screen + Ready
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
  // KV Gem Parallax
  // ===================================================

  const deco = document.querySelector(".top-kv__deco");
  if (deco) {
    const gems = Array.from(deco.querySelectorAll(".ring-gem"));

    function onMove(event) {
      const rect = deco.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      gems.forEach(function (gem, index) {
        const factor = (index + 1) * 0.3;
        gem.style.transform =
          "translateX(" + (x * 12 * factor) + "px) translateY(" + (y * 9 * factor) + "px)";
      });
    }

    function resetMove() {
      gems.forEach(function (gem) {
        gem.style.transform = "";
      });
    }

    deco.addEventListener("pointermove", onMove);
    deco.addEventListener("pointerleave", resetMove);
  }

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

    fadeEls.forEach(function (el, index) {
      // ランキング・ニュースは連番ディレイ（同じセクション内のみ）
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
