# 🍊 だいだいゲームズ

手づくりゲームをまとめて公開するポータル。
**Expressアプリ1つ・GitHubリポジトリ1つ・Renderサービス1つ** で全ゲームを配信する。

- トップページ `/` … ゲーム一覧
- 各ゲーム `/games/<ゲーム名>/`

---

## 起動のしかた

```bash
npm install
npm start
```

→ http://localhost:3000

ポートを変えたいときは `PORT=3010 npm start`。

---

## フォルダ構成

```
だいだいゲームズ/
├── server.js          共通サーバー（games/ を自動で読み込む。基本さわらない）
├── package.json       依存はここ1つだけ（express / socket.io）
├── render.yaml        Renderの設定
├── public/            トップページ（ゲーム一覧）
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── 404.html
└── games/
    ├── _template/     ← 新しいゲームのひな形（"_" で始まるフォルダは読み込まれない）
    ├── kansha-nou/        🙏 感謝脳ゲーム
    ├── yuuki-no-shizuku/  💧 勇気のしずくゲーム
    ├── 9masu-writing/     ✍️ 9マス式ライティングゲーム
    ├── dokusho-quest/     📚 読書クエスト
    ├── jibun-life-52/     🌱 じぶんライフ52
    ├── jikka-dasshutsu/   🚪 実家がしんどい大脱出ゲーム
    └── asatantan/         🍚 あさたんたんゲーム
```

ゲーム1つ分の中身：

```
games/<ゲーム名>/
├── game.json     一覧に出す情報（タイトル・説明など）
├── server.js     通信ありのゲームだけ。無くてもよい
└── public/       画面ファイル（index.html / style.css / app.js / 画像 …）
```

### 競合しないしくみ

| | どう分けているか |
|---|---|
| CSS・JS・画像 | ゲームごとの `public/` に閉じ、`/games/<ゲーム名>/` 以下でしか配信されない。同じ `style.css` という名前でも混ざらない |
| リアルタイム通信 | Socket.io の**ネームスペース** `/games/<ゲーム名>` で分離。イベント名（`createRoom` など）がかぶっても他のゲームには届かない |
| 保存データ | localStorage はゲームごとに違うキーを使うこと（同じドメインなので共有される） |

---

## 新しいゲームを追加する手順

`server.js` も `package.json` も**書き換えなくてよい**。フォルダを足すだけ。

### 1. ひな形をコピーする

```bash
cp -R games/_template games/my-game
```

フォルダ名がそのままURLになる（→ `/games/my-game/`）。
英数字とハイフンだけ・小文字が安全。

### 2. `games/my-game/game.json` を書く

```json
{
  "title": "わたしのゲーム",
  "emoji": "🎲",
  "tagline": "ひとことキャッチコピー",
  "description": "トップページのカードに出る説明文。",
  "tags": ["ひとりで", "カードゲーム"],
  "players": "1〜4人",
  "order": 100,
  "hidden": false
}
```

| 項目 | 意味 |
|---|---|
| `title` | ゲーム名（省略するとフォルダ名） |
| `emoji` | カードのアイコン |
| `tagline` | 短いキャッチコピー |
| `description` | 説明文（2〜3行） |
| `tags` | カード下部のタグ |
| `players` | 人数の目安 |
| `order` | 一覧の並び順。小さいほど上（省略時1000） |
| `hidden` | `true` にすると一覧に出ない（URLを知っている人だけ遊べる） |

### 3. `games/my-game/public/` にゲームを作る

`index.html` が入口。CSS・JS・画像も全部このフォルダの中に置く。

> **注意**: `<link href="style.css">` のように**相対パス**で書くこと。
> `/style.css` と先頭スラッシュを付けるとトップページのCSSを読んでしまう。

### 4. （通信ありのゲームだけ）`server.js` を置く

`games/my-game/server.js.example` を `server.js` にリネームして中身を書く。
形はこれだけ：

```js
let io = null; // 共通サーバーから渡される、このゲーム専用のネームスペース

function onConnection(socket) {
  socket.on("createRoom", ({ name }) => { /* … */ });
}

module.exports = function register({ nsp }) {
  io = nsp;
  io.on("connection", onConnection);
};
```

`register` が受け取れるもの：

| 引数 | 中身 |
|---|---|
| `nsp` | このゲーム専用の Socket.io ネームスペース（`/games/my-game`） |
| `io` | アプリ全体の Socket.io サーバー（普通は使わない） |
| `router` | `/games/my-game` 配下にAPIを足したいとき用の Express Router |
| `slug` / `dir` / `publicDir` / `basePath` | フォルダ名やパス |

クライアント側（`public/app.js`）は **必ずネームスペースを指定して**つなぐ：

```html
<script src="/socket.io/socket.io.js"></script>
```

```js
const socket = io("/games/my-game"); // ← io() だけだと他ゲームと混線する
```

### 5. 再起動して確認

```bash
npm start
```

起動ログに `🎲  /games/my-game/  わたしのゲーム` と出て、トップページのカードが増えていればOK。

---

## Renderへのデプロイ

デプロイするのは**このプロジェクト1つだけ**。ゲームが増えてもサービスは増やさない。

### はじめの1回

1. GitHubにリポジトリ `daidai-games` を作り、このフォルダの中身を push（`node_modules/` は `.gitignore` 済み）
2. Render → **New → Web Service** → そのリポジトリを選ぶ
3. 設定（`render.yaml` があれば自動で入る）
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
4. デプロイ完了 → `https://daidai-games.onrender.com`

### 2回目以降

GitHubに push すれば Render が自動で再デプロイする。
**ゲームを増やしたときも同じ**（Renderの設定変更は不要）。

> 無料プランは15分アクセスが無いとスリープする。次のアクセスで起き上がるまで30秒ほどかかる。

---

## 移行メモ

もとは以下が別プロジェクト・別サービスだった。ここに1つへまとめた。

| 旧プロジェクト | 新しい場所 |
|---|---|
| `感謝脳ゲーム/online-app/` | `games/kansha-nou/` |
| `感謝脳ゲーム/yuuki-no-shizuku/` | `games/yuuki-no-shizuku/` |
| `感謝脳ゲーム/9masu-writing/` | `games/9masu-writing/` |
| `感謝脳ゲーム/dokusho-quest-v2/` | `games/dokusho-quest/`（ソロ＋読書会。旧 `dokusho-quest/` のソロ専用版は取り込み済み） |
| `感謝脳ゲーム/jibun-life-52/` | `games/jibun-life-52/` |
| `実家がしんどい大脱出ゲーム/` | `games/jikka-dasshutsu/` |
| `あさたんたんゲーム_オンラインP2P版/` | `games/asatantan/` |

統合にあたって変えたのは次の2点だけで、ゲームのロジックは元のまま：

- 各ゲームの `server.js` … Expressの起動処理を外し、`module.exports = function register({ nsp })` の形にした
- 各ゲームのクライアント … `io()` → `io("/games/<ゲーム名>")`

旧URL（`yuuki-no-shizuku.onrender.com` など）は、切り替え後は新URLへの案内に差し替えるか、Renderのサービスを止めてよい。
