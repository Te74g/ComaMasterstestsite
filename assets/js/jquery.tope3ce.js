(function (global, document) {
  "use strict";

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
