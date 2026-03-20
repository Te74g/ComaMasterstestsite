(function (global) {
  "use strict";

  const parts = global.COMA_PARTS || {};
  const STORAGE_KEY = parts.storageKey || "comamasters_ranking_portal_v1";
  const siteDefaults = parts.siteDefaults || {};

  const DEFAULT_STATE = {
    site: {
      title: siteDefaults.title || "ComaMasters Ranking Portal",
      subtitle: siteDefaults.subtitle || "Tonamelで確定した大会結果から累計ランキングを自動生成",
      tonamelHubUrl: siteDefaults.tonamelHubUrl || "https://x.com/ComaMastersinfo"
    },
    tournaments: [],
    updatedAt: null
  };

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneDefaultState();
    }

    try {
      const parsed = JSON.parse(raw);
      if (!isValidState(parsed)) {
        return cloneDefaultState();
      }
      return sanitizeState(parsed);
    } catch (error) {
      return cloneDefaultState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState() {
    const next = cloneDefaultState();
    saveState(next);
    return next;
  }

  function parseResultsText(text) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return { ok: false, message: "結果リストに1件以上のデータが必要です。" };
    }

    const results = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const parts = splitLine(line);

      if (parts.length < 2) {
        return { ok: false, message: `${i + 1}行目の形式が不正です。` };
      }

      const rankRaw = String(parts[0] || "").trim();
      const player = String(parts[1] || "").trim();
      const pointsRaw = String(parts[2] || "").trim();
      const team = String(parts[3] || "").trim();

      const rank = parseRank(rankRaw);
      if (!rank || rank < 1) {
        return { ok: false, message: `${i + 1}行目の順位が不正です。` };
      }

      if (!player) {
        return { ok: false, message: `${i + 1}行目のプレイヤー名が空です。` };
      }

      const points = parsePoints(pointsRaw, rank);
      if (Number.isNaN(points)) {
        return { ok: false, message: `${i + 1}行目のポイントが不正です。` };
      }

      results.push({
        rank,
        player,
        points,
        team
      });
    }

    results.sort((a, b) => a.rank - b.rank || b.points - a.points || a.player.localeCompare(b.player, "ja"));
    return { ok: true, results };
  }

  function splitLine(line) {
    if (line.includes("\t")) {
      return line.split("\t").map((cell) => cell.trim());
    }
    return line.split(",").map((cell) => cell.trim());
  }

  function parseRank(raw) {
    const normalized = raw.replace(/[^\d]/g, "");
    const num = Number.parseInt(normalized, 10);
    return Number.isFinite(num) ? num : NaN;
  }

  function parsePoints(raw, rank) {
    if (!raw) {
      return fallbackPointsByRank(rank);
    }
    const normalized = raw.replace(/[^\d.-]/g, "");
    const num = Number.parseFloat(normalized);
    return Number.isFinite(num) ? num : NaN;
  }

  function fallbackPointsByRank(rank) {
    if (rank === 1) return 120;
    if (rank === 2) return 90;
    if (rank === 3) return 75;
    if (rank === 4) return 60;
    if (rank <= 8) return 45;
    if (rank <= 16) return 30;
    if (rank <= 32) return 20;
    return 10;
  }

  function computeLeaderboard(state) {
    const map = new Map();
    const tournamentsByDate = [...state.tournaments].sort((a, b) => a.date.localeCompare(b.date));

    for (const tournament of tournamentsByDate) {
      for (const result of tournament.results) {
        const key = normalizeName(result.player);
        const prev = map.get(key);
        if (!prev) {
          map.set(key, {
            player: result.player,
            team: result.team || "-",
            totalPoints: result.points,
            events: 1,
            bestFinish: result.rank,
            latestPts: result.points,
            latestDate: tournament.date
          });
        } else {
          prev.totalPoints += result.points;
          prev.events += 1;
          prev.bestFinish = Math.min(prev.bestFinish, result.rank);
          if (result.team) prev.team = result.team;
          if (tournament.date >= prev.latestDate) {
            prev.latestDate = tournament.date;
            prev.latestPts = result.points;
          }
        }
      }
    }

    const rows = [...map.values()].map((entry) => ({
      player: entry.player,
      team: entry.team,
      totalPoints: entry.totalPoints,
      events: entry.events,
      avgPoints: entry.totalPoints / entry.events,
      bestFinish: entry.bestFinish,
      latestPts: entry.latestPts
    }));

    rows.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (a.bestFinish !== b.bestFinish) return a.bestFinish - b.bestFinish;
      if (b.latestPts !== a.latestPts) return b.latestPts - a.latestPts;
      return a.player.localeCompare(b.player, "ja");
    });

    let prevTotal = null;
    let prevBest = null;
    let prevLatest = null;
    let rank = 0;

    return rows.map((row, index) => {
      if (row.totalPoints !== prevTotal || row.bestFinish !== prevBest || row.latestPts !== prevLatest) {
        rank = index + 1;
        prevTotal = row.totalPoints;
        prevBest = row.bestFinish;
        prevLatest = row.latestPts;
      }
      return {
        rank,
        player: row.player,
        team: row.team,
        totalPoints: row.totalPoints,
        events: row.events,
        avgPoints: row.avgPoints,
        bestFinish: row.bestFinish,
        latestPts: row.latestPts
      };
    });
  }

  function sanitizeState(input) {
    const site = input.site || {};
    const tournaments = Array.isArray(input.tournaments) ? input.tournaments : [];

    return {
      site: {
        title: String(site.title || DEFAULT_STATE.site.title),
        subtitle: String(site.subtitle || DEFAULT_STATE.site.subtitle),
        tonamelHubUrl: String(site.tonamelHubUrl || DEFAULT_STATE.site.tonamelHubUrl)
      },
      tournaments: tournaments
        .map((t) => sanitizeTournament(t))
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date)),
      updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : null
    };
  }

  function sanitizeTournament(input) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const results = Array.isArray(input.results) ? input.results : [];
    const cleanResults = results
      .map((r) => sanitizeResult(r))
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || b.points - a.points);

    if (cleanResults.length === 0) {
      return null;
    }

    return {
      id: String(input.id || createId()),
      name: String(input.name || "Unnamed Tournament"),
      date: String(input.date || new Date().toISOString().slice(0, 10)),
      venue: String(input.venue || "-"),
      sourceUrl: String(input.sourceUrl || "https://tonamel.com/"),
      results: cleanResults
    };
  }

  function sanitizeResult(input) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const rank = Number(input.rank);
    const player = String(input.player || "").trim();
    const points = Number(input.points);
    const team = String(input.team || "").trim();

    if (!Number.isFinite(rank) || rank <= 0 || !player || !Number.isFinite(points)) {
      return null;
    }

    return {
      rank: Math.floor(rank),
      player,
      points,
      team
    };
  }

  function isValidState(input) {
    if (!input || typeof input !== "object") return false;
    if (!input.site || typeof input.site !== "object") return false;
    if (!Array.isArray(input.tournaments)) return false;
    return true;
  }

  function createId() {
    if (global.crypto && global.crypto.randomUUID) {
      return global.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalizeName(name) {
    return name.trim().toLocaleLowerCase("ja");
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  function formatDateTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  function formatNumber(num) {
    return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(num);
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(text) {
    return escapeHtml(text).replaceAll("`", "&#96;");
  }

  global.ComaCommon = {
    STORAGE_KEY,
    DEFAULT_STATE,
    loadState,
    saveState,
    resetState,
    parseResultsText,
    computeLeaderboard,
    sanitizeState,
    isValidState,
    createId,
    formatDate,
    formatDateTime,
    formatNumber,
    escapeHtml,
    escapeAttr
  };
})(window);
