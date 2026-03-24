(function (global, document) {
  "use strict";

  // ===================================================
  // Auth Header Button
  // ===================================================

  if (global.CMA && global.CMA.bindAuthHeader) {
    global.CMA.bindAuthHeader();
  }

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


  // ===================================================
  // Ranking Tier — data-rating でティアクラス付与
  // Silver 1650+ / Gold 1700+ / Diamond 1800+ / Master 2000+ / Apex 2500+
  // ===================================================

  // シーズン進行で拡大する閾値。初期は全員1500スタートなので差が小さい
  const tierMap = [
    { min: 1580, cls: "rank-tier--apex"    }, // 将来: 2500+
    { min: 1550, cls: "rank-tier--master"  }, // 将来: 2000+
    { min: 1530, cls: "rank-tier--diamond" }, // 将来: 1800+
    { min: 1510, cls: "rank-tier--gold"    }, // 将来: 1700+
    { min: 1490, cls: "rank-tier--silver"  }, // 将来: 1650+
  ];

  const rankItems = Array.from(document.querySelectorAll(".ranking-item[data-rating]"));
  rankItems.forEach(function (item) {
    const rating = parseInt(item.dataset.rating, 10);
    for (let i = 0; i < tierMap.length; i++) {
      if (rating >= tierMap[i].min) {
        item.classList.add(tierMap[i].cls);
        break;
      }
    }
  });

  // パネル左ライン — トッププレイヤーのティアを .top-ranking に反映
  const rankingPanel = document.querySelector(".top-ranking");
  if (rankingPanel) {
    const panelTiers = ["rank-tier--apex", "rank-tier--master", "rank-tier--diamond", "rank-tier--gold"];
    for (let i = 0; i < panelTiers.length; i++) {
      if (document.querySelector("." + panelTiers[i])) {
        rankingPanel.classList.add("panel-" + panelTiers[i].replace("rank-tier--", ""));
        break;
      }
    }
  }

})(window, document);
