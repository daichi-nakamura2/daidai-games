/* -------------------------------------------------------------------------
 * トップページ（ゲーム一覧）
 *   サーバーの /api/games を読んでカードを並べる。
 *   games/ にフォルダを足せばここも自動で増えるので、このファイルは触らなくてよい。
 * ---------------------------------------------------------------------- */

const listEl = document.getElementById("game-list");

/** HTMLに埋め込む前に記号をエスケープする */
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function cardHtml(game) {
  const tags = (game.tags || []).map((t) => `<li>${esc(t)}</li>`).join("");
  const players = game.players ? `<span class="players">👥 ${esc(game.players)}</span>` : "";

  return `
    <a class="card" href="${esc(game.path)}">
      <div class="card-emoji" aria-hidden="true">${esc(game.emoji)}</div>
      <div class="card-body">
        <h2>${esc(game.title)}</h2>
        ${game.tagline ? `<p class="tagline">${esc(game.tagline)}</p>` : ""}
        ${game.description ? `<p class="desc">${esc(game.description)}</p>` : ""}
        <div class="card-foot">
          ${players}
          <ul class="tags">${tags}</ul>
        </div>
      </div>
    </a>`;
}

fetch("/api/games")
  .then((res) => res.json())
  .then((games) => {
    if (!games.length) {
      listEl.innerHTML = '<p class="loading">まだゲームがありません。</p>';
      return;
    }
    listEl.innerHTML = games.map(cardHtml).join("");
  })
  .catch(() => {
    listEl.innerHTML = '<p class="loading">ゲーム一覧を読み込めませんでした。</p>';
  });
