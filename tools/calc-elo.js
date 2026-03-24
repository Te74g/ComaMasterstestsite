#!/usr/bin/env node
/**
 * ComaMasters — Elo レーティング計算スクリプト
 *
 * 使い方:
 *   node tools/calc-elo.js data/matches.json
 *   node tools/calc-elo.js data/matches.json --out assets/data/ranking.json
 *
 * 入力: data/matches.json  (data/matches-sample.json を参照)
 * 出力: 標準出力 or --out で指定したファイル
 */

"use strict";

const fs   = require("fs");
const path = require("path");

/* ─── 設定 ─────────────────────────────────────────── */
const INITIAL_RATING = 1500;   // 初期レート
const K_FACTOR       = 32;     // 変動係数（大きいほど荒れる）
const SCALE          = 400;    // Elo スケール定数

/* ─── Elo コアロジック ──────────────────────────────── */

/**
 * 期待勝率を返す（プレイヤー A から見た値）
 * @param {number} ra - A のレート
 * @param {number} rb - B のレート
 * @returns {number} 0〜1
 */
function expectedScore(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / SCALE));
}

/**
 * 1 試合分のレート更新を返す
 * @param {number} ra    - A の現レート
 * @param {number} rb    - B の現レート
 * @param {"win"|"loss"|"draw"} result - A から見た結果
 * @returns {{ newRa: number, newRb: number }}
 */
function updateRatings(ra, rb, result) {
  const wa = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  const wb = 1 - wa;
  const ea = expectedScore(ra, rb);
  const eb = 1 - ea;

  return {
    newRa: Math.round(ra + K_FACTOR * (wa - ea)),
    newRb: Math.round(rb + K_FACTOR * (wb - eb)),
  };
}

/* ─── シーズン全体の計算 ────────────────────────────── */

/**
 * matchesData（matches-sample.json の構造）を受け取り、
 * 全試合を時系列順に処理して最終レートを返す
 *
 * @param {object} matchesData
 * @returns {Array<{ name: string, rating: number, wins: number, losses: number, draws: number, matches: number }>}
 */
function calcSeasonRatings(matchesData) {
  const ratings = {};  // name → current rating
  const stats   = {};  // name → { wins, losses, draws, matches }

  function ensure(name) {
    if (!ratings[name]) {
      ratings[name] = INITIAL_RATING;
      stats[name]   = { wins: 0, losses: 0, draws: 0, matches: 0 };
    }
  }

  for (const event of matchesData.events) {
    for (const match of event.matches) {
      const { p1, p2, result } = match;
      ensure(p1);
      ensure(p2);

      const { newRa, newRb } = updateRatings(ratings[p1], ratings[p2], result);

      ratings[p1] = newRa;
      ratings[p2] = newRb;

      // 統計更新
      stats[p1].matches++;
      stats[p2].matches++;

      if (result === "win") {
        stats[p1].wins++;
        stats[p2].losses++;
      } else if (result === "loss") {
        stats[p1].losses++;
        stats[p2].wins++;
      } else {
        stats[p1].draws++;
        stats[p2].draws++;
      }
    }
  }

  // レート降順にソート
  return Object.keys(ratings)
    .map(function(name) {
      const s = stats[name];
      return {
        name:    name,
        rating:  ratings[name],
        wins:    s.wins,
        losses:  s.losses,
        draws:   s.draws,
        matches: s.matches,
        winRate: s.matches > 0
          ? Math.round((s.wins + s.draws * 0.5) / s.matches * 1000) / 10
          : 0,
      };
    })
    .sort(function(a, b) { return b.rating - a.rating; })
    .map(function(player, index) {
      return Object.assign({ rank: index + 1 }, player);
    });
}

/* ─── CLI エントリポイント ──────────────────────────── */

(function main() {
  const args    = process.argv.slice(2);
  const inFile  = args.find(function(a) { return !a.startsWith("--"); });
  const outIdx  = args.indexOf("--out");
  const outFile = outIdx !== -1 ? args[outIdx + 1] : null;

  if (!inFile) {
    console.error("使い方: node tools/calc-elo.js <matches.json> [--out <ranking.json>]");
    process.exit(1);
  }

  const matchesData = JSON.parse(fs.readFileSync(path.resolve(inFile), "utf8"));
  const ranking     = calcSeasonRatings(matchesData);

  const output = JSON.stringify({
    generated: new Date().toISOString(),
    season:    matchesData.season || "",
    ranking:   ranking,
  }, null, 2);

  if (outFile) {
    const outPath = path.resolve(outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, "utf8");
    console.log("書き出し完了: " + outPath);
  } else {
    console.log(output);
  }
})();
