/* =========================================================================
 * だいだいゲームズ — 共通サーバー
 * -------------------------------------------------------------------------
 * ゲームは games/ フォルダの中を1つずつ自動で読み込む。
 * 新しいゲームを増やすときは games/<ゲーム名>/ を足すだけでよく、
 * このファイルを書き換える必要はない（詳しくは README.md）。
 *
 *   起動:  npm start
 *   URL :  http://localhost:3000       … ゲーム一覧（トップページ）
 *          http://localhost:3000/games/<ゲーム名>/  … 各ゲーム
 * ========================================================================= */

const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const GAMES_DIR = path.join(__dirname, "games");
const PORT = process.env.PORT || 3000;

/* -------------------------------------------------------------------------
 * 1. games/ を読み込む
 * ---------------------------------------------------------------------- */

/**
 * games/ の中のフォルダを1つ読み込んで、ゲーム1件の情報にする。
 * public/ が無いフォルダはゲームとして成立しないので null を返す。
 */
function loadGame(slug) {
  const dir = path.join(GAMES_DIR, slug);
  const publicDir = path.join(dir, "public");

  if (!fs.existsSync(path.join(publicDir, "index.html"))) {
    console.warn(`⚠️  games/${slug}: public/index.html が無いので読み込みません`);
    return null;
  }

  // game.json（説明文などのメタ情報）。無くても動く。
  let meta = {};
  const metaPath = path.join(dir, "game.json");
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch (err) {
      console.warn(`⚠️  games/${slug}/game.json を読めませんでした: ${err.message}`);
    }
  }

  // server.js（通信ありのゲームだけ）。無ければ静的配信のみのゲーム。
  let register = null;
  const serverPath = path.join(dir, "server.js");
  if (fs.existsSync(serverPath)) {
    try {
      const mod = require(serverPath);
      if (typeof mod === "function") {
        register = mod;
      } else if (mod && typeof mod.register === "function") {
        register = mod.register;
      } else {
        console.warn(`⚠️  games/${slug}/server.js が関数を export していません`);
      }
    } catch (err) {
      // 1つのゲームの不具合で全体を落とさない
      console.error(`❌ games/${slug}/server.js の読み込みに失敗: ${err.stack}`);
    }
  }

  return {
    slug,
    dir,
    publicDir,
    register,
    basePath: `/games/${slug}`,
    title: meta.title || slug,
    emoji: meta.emoji || "🎮",
    tagline: meta.tagline || "",
    description: meta.description || "",
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    players: meta.players || "",
    realtime: Boolean(register),
    hidden: Boolean(meta.hidden),
    order: typeof meta.order === "number" ? meta.order : 1000,
  };
}

function loadGames() {
  if (!fs.existsSync(GAMES_DIR)) return [];

  return fs
    .readdirSync(GAMES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
    .map((e) => loadGame(e.name))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ja"));
}

/* -------------------------------------------------------------------------
 * 2. Express（アプリ全体でこの1つだけ）
 * ---------------------------------------------------------------------- */

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const games = loadGames();

for (const game of games) {
  // 末尾スラッシュなし(/games/foo)で来たら付けてリダイレクトする。
  // こうしないと index.html の中の相対パス（style.css など）がずれる。
  // ※Expressのルーティングは末尾スラッシュの有無を区別しないので、
  //   実際のURL(originalUrl)を見て判定しないと自分自身に無限リダイレクトする。
  app.get(game.basePath, (req, res, next) => {
    const q = req.originalUrl.indexOf("?");
    const pathname = q === -1 ? req.originalUrl : req.originalUrl.slice(0, q);
    const search = q === -1 ? "" : req.originalUrl.slice(q);
    if (pathname.endsWith("/")) return next();
    res.redirect(302, `${game.basePath}/${search}`);
  });

  // 通信ありのゲームは、専用の Socket.io ネームスペースを渡して登録する。
  // ネームスペースが分かれているので、ゲーム同士でイベント名がかぶっても平気。
  if (game.register) {
    const router = express.Router();
    try {
      game.register({
        nsp: io.of(game.basePath),
        io,
        router,
        express,
        slug: game.slug,
        dir: game.dir,
        publicDir: game.publicDir,
        basePath: game.basePath,
      });
      app.use(game.basePath, router);
    } catch (err) {
      console.error(`❌ games/${game.slug} の登録に失敗: ${err.stack}`);
    }
  }

  // 画面ファイルはゲームごとの public/ に閉じているので、
  // CSS・JS・画像の名前が他のゲームとかぶっても混ざらない。
  app.use(game.basePath, express.static(game.publicDir));

  console.log(
    `  ${game.emoji}  ${game.basePath}/`.padEnd(40) +
      `${game.title}${game.realtime ? "（通信あり）" : ""}`,
  );
}

// トップページがゲーム一覧を描くために使う。
app.get("/api/games", (req, res) => {
  res.json(
    games
      .filter((g) => !g.hidden)
      .map(({ slug, basePath, title, emoji, tagline, description, tags, players, realtime }) => ({
        slug,
        path: `${basePath}/`,
        title,
        emoji,
        tagline,
        description,
        tags,
        players,
        realtime,
      })),
  );
});

// トップページと共通の画像など
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

server.listen(PORT, () => {
  console.log(`\n🍊 だいだいゲームズ 起動: http://localhost:${PORT}  （${games.length}本）\n`);
});
