(function (global) {
  "use strict";

  const Common = global.ComaCommon;
  if (!Common) {
    throw new Error("ComaCommon is required before jquery.top.js");
  }

  let state = Common.loadState();

  const el = {
    siteTitle: document.getElementById("siteTitle"),
    siteSubtitle: document.getElementById("siteSubtitle"),
    tonamelHubLink: document.getElementById("tonamelHubLink"),
    lastUpdated: document.getElementById("lastUpdated"),
    leaderboardMeta: document.getElementById("leaderboardMeta"),
    leaderboardBody: document.getElementById("leaderboardBody"),
    tournamentCards: document.getElementById("tournamentCards"),
    adminTournamentsBody: document.getElementById("adminTournamentsBody"),
    siteForm: document.getElementById("siteForm"),
    tournamentForm: document.getElementById("tournamentForm"),
    exportBtn: document.getElementById("exportBtn"),
    importInput: document.getElementById("importInput"),
    resetBtn: document.getElementById("resetBtn")
  };

  init();

  function init() {
    bindEvents();
    fillSiteForm();
    render();
  }

  function bindEvents() {
    el.siteForm.addEventListener("submit", onSaveSiteSettings);
    el.tournamentForm.addEventListener("submit", onAddTournament);
    el.exportBtn.addEventListener("click", onExport);
    el.importInput.addEventListener("change", onImport);
    el.resetBtn.addEventListener("click", onReset);
    el.adminTournamentsBody.addEventListener("click", onAdminTableClick);
  }

  function onSaveSiteSettings(event) {
    event.preventDefault();
    const formData = new FormData(el.siteForm);
    const title = String(formData.get("title") || "").trim();
    const subtitle = String(formData.get("subtitle") || "").trim();
    const tonamelHubUrl = String(formData.get("tonamelHubUrl") || "").trim();

    if (!title || !subtitle || !tonamelHubUrl) {
      global.alert("サイト設定をすべて入力してください。");
      return;
    }

    state.site = { title, subtitle, tonamelHubUrl };
    commit("サイト設定を保存しました。");
  }

  function onAddTournament(event) {
    event.preventDefault();
    const formData = new FormData(el.tournamentForm);

    const name = String(formData.get("name") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const venue = String(formData.get("venue") || "").trim();
    const sourceUrl = String(formData.get("sourceUrl") || "").trim();
    const resultsText = String(formData.get("resultsText") || "").trim();

    if (!name || !date || !venue || !sourceUrl || !resultsText) {
      global.alert("大会情報と結果リストをすべて入力してください。");
      return;
    }

    const parseResult = Common.parseResultsText(resultsText);
    if (!parseResult.ok) {
      global.alert(parseResult.message);
      return;
    }

    state.tournaments.push({
      id: Common.createId(),
      name,
      date,
      venue,
      sourceUrl,
      results: parseResult.results
    });

    state.tournaments.sort((a, b) => a.date.localeCompare(b.date));
    el.tournamentForm.reset();
    commit("大会結果を追加しました。");
  }

  function onAdminTableClick(event) {
    const button = event.target.closest("[data-action='delete-tournament']");
    if (!button) {
      return;
    }

    const id = button.getAttribute("data-id");
    if (!id) {
      return;
    }

    const tournament = state.tournaments.find((item) => item.id === id);
    if (!tournament) {
      return;
    }

    const confirmed = global.confirm(`「${tournament.name}」を削除しますか？`);
    if (!confirmed) {
      return;
    }

    state.tournaments = state.tournaments.filter((item) => item.id !== id);
    commit("大会結果を削除しました。");
  }

  function onExport() {
    const exportData = JSON.stringify(state, null, 2);
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comamasters-ranking-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function onImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const imported = JSON.parse(String(reader.result || "{}"));
        if (!Common.isValidState(imported)) {
          throw new Error("invalid format");
        }
        state = Common.sanitizeState(imported);
        Common.saveState(state);
        fillSiteForm();
        render();
        global.alert("JSONを読み込みました。");
      } catch (error) {
        global.alert("JSONの形式が正しくありません。");
      } finally {
        el.importInput.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function onReset() {
    const confirmed = global.confirm("全データを削除して初期状態に戻します。よろしいですか？");
    if (!confirmed) {
      return;
    }
    state = Common.resetState();
    fillSiteForm();
    render();
  }

  function render() {
    renderHeader();
    renderLeaderboard();
    renderTournamentCards();
    renderAdminTournaments();
  }

  function renderHeader() {
    el.siteTitle.textContent = state.site.title;
    el.siteSubtitle.textContent = state.site.subtitle;
    el.tonamelHubLink.href = state.site.tonamelHubUrl || "https://tonamel.com/";

    if (state.updatedAt) {
      el.lastUpdated.textContent = `Last update: ${Common.formatDateTime(state.updatedAt)}`;
    } else {
      el.lastUpdated.textContent = "Last update: -";
    }
  }

  function renderLeaderboard() {
    const leaderboard = Common.computeLeaderboard(state);

    if (leaderboard.length === 0) {
      el.leaderboardBody.innerHTML = '<tr><td colspan="8" class="empty">まだ大会結果がありません。Adminから大会結果を追加してください。</td></tr>';
    } else {
      el.leaderboardBody.innerHTML = leaderboard
        .map((row) => {
          const rankClass = row.rank <= 3 ? `rank-badge rank-badge--${row.rank}` : "rank-badge";
          return `
            <tr>
              <td><span class="${rankClass}">${row.rank}</span></td>
              <td>${Common.escapeHtml(row.player)}</td>
              <td>${Common.escapeHtml(row.team || "-")}</td>
              <td>${Common.formatNumber(row.totalPoints)}</td>
              <td>${row.events}</td>
              <td>${Common.formatNumber(row.avgPoints)}</td>
              <td>${row.bestFinish}</td>
              <td>${Common.formatNumber(row.latestPts)}</td>
            </tr>
          `;
        })
        .join("");
    }

    el.leaderboardMeta.textContent = `${leaderboard.length} players / ${state.tournaments.length} tournaments`;
  }

  function renderTournamentCards() {
    if (state.tournaments.length === 0) {
      el.tournamentCards.innerHTML = '<p class="empty">大会結果が追加されるとここに表示されます。</p>';
      return;
    }

    const sorted = [...state.tournaments].sort((a, b) => b.date.localeCompare(a.date));
    el.tournamentCards.innerHTML = sorted
      .map((tournament) => {
        const top3 = [...tournament.results]
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 3);

        const topList = top3
          .map((entry) => `<li>${entry.rank}位 ${Common.escapeHtml(entry.player)} (${Common.formatNumber(entry.points)} pts)</li>`)
          .join("");

        return `
          <article class="tournament-card">
            <div class="tournament-card__head">
              <h3 class="tournament-card__name">${Common.escapeHtml(tournament.name)}</h3>
              <a class="action-link" href="${Common.escapeAttr(tournament.sourceUrl)}" target="_blank" rel="noopener noreferrer">Tonamel</a>
            </div>
            <p class="tournament-card__meta">${Common.formatDate(tournament.date)} / ${Common.escapeHtml(tournament.venue)} / ${tournament.results.length} entries</p>
            <ol class="tournament-card__top">${topList || "<li>-</li>"}</ol>
          </article>
        `;
      })
      .join("");
  }

  function renderAdminTournaments() {
    if (state.tournaments.length === 0) {
      el.adminTournamentsBody.innerHTML = '<tr><td colspan="5" class="empty">登録済み大会はありません。</td></tr>';
      return;
    }

    const sorted = [...state.tournaments].sort((a, b) => b.date.localeCompare(a.date));
    el.adminTournamentsBody.innerHTML = sorted
      .map((tournament) => {
        return `
          <tr>
            <td>${Common.formatDate(tournament.date)}</td>
            <td>${Common.escapeHtml(tournament.name)}</td>
            <td>${Common.escapeHtml(tournament.venue)}</td>
            <td>${tournament.results.length}</td>
            <td>
              <button class="btn btn--danger" type="button" data-action="delete-tournament" data-id="${Common.escapeAttr(tournament.id)}">
                Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function fillSiteForm() {
    el.siteForm.title.value = state.site.title || "";
    el.siteForm.subtitle.value = state.site.subtitle || "";
    el.siteForm.tonamelHubUrl.value = state.site.tonamelHubUrl || "";
  }

  function commit(message) {
    state.updatedAt = new Date().toISOString();
    Common.saveState(state);
    render();
    if (message) {
      global.alert(message);
    }
  }
})(window);
