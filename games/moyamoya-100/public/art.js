/* ============================================================
 * モヤモヤ退治100 — モヤモヤたちの絵（すべてSVGで描く）
 * ============================================================ */
(function (root) {
  const LOOK = {
    taikutsu: { c: "#9aa8c7", d: "#7686a8", eye: "sleep", mouth: "yawn" },
    guruguru: { c: "#a184d6", d: "#7d5fb8", eye: "spiral", mouth: "wavy" },
    fuan:     { c: "#e2b64f", d: "#c4933a", eye: "wide", mouth: "wavy" },
    jihi:     { c: "#8f8aa0", d: "#6c6780", eye: "down", mouth: "frown" },
    kodoku:   { c: "#6f9fce", d: "#5180ad", eye: "down", mouth: "small" },
    tsukare:  { c: "#b3a58d", d: "#8f8069", eye: "sleep", mouth: "frown" },
    ikari:    { c: "#e0604a", d: "#b8432f", eye: "angry", mouth: "teeth" },
    muki:     { c: "#6f7f93", d: "#556477", eye: "blank", mouth: "line" },
    nige:     { c: "#b0805c", d: "#8c6243", eye: "angry", mouth: "line" },
    boss:     { c: "#6a5fa6", d: "#4a4180", eye: "wide", mouth: "teeth" },
  };

  function eyes(kind) {
    const L = 76, R = 124, Y = 92;
    const ink = "#2b2740";
    const pair = (fn) => fn(L) + fn(R);
    switch (kind) {
      case "sleep": return pair((x) => `<path d="M${x - 11} ${Y}q11 8 22 0" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/>`);
      case "spiral": return pair((x) => `<path d="M${x} ${Y}c3-3 8 0 7 5s-9 8-14 3-4-15 4-18 18 2 18 12" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`);
      case "wide": return pair((x) => `<circle cx="${x}" cy="${Y}" r="12" fill="#fff"/><circle cx="${x + 1}" cy="${Y + 2}" r="5" fill="${ink}"/>`);
      case "down": return pair((x) => `<circle cx="${x}" cy="${Y + 2}" r="5.5" fill="${ink}"/><path d="M${x - 11} ${Y - 15}l${x < 100 ? 18 : 4} ${x < 100 ? -5 : 5}" transform="${x < 100 ? "" : `translate(${0} 0)`}" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`);
      case "angry": return pair((x) => {
        const dir = x < 100 ? 1 : -1;
        return `<circle cx="${x}" cy="${Y + 3}" r="6" fill="${ink}"/><path d="M${x - 13 * dir} ${Y - 14}L${x + 12 * dir} ${Y - 5}" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
      });
      case "blank": return pair((x) => `<path d="M${x - 9} ${Y}h18" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/><circle cx="${x}" cy="${Y + 5}" r="3.5" fill="${ink}"/>`);
      default: return pair((x) => `<circle cx="${x}" cy="${Y}" r="6" fill="${ink}"/>`);
    }
  }

  function mouth(kind) {
    const ink = "#2b2740";
    switch (kind) {
      case "yawn": return `<ellipse cx="100" cy="122" rx="13" ry="16" fill="${ink}"/>`;
      case "wavy": return `<path d="M82 124q6-8 12 0t12 0 12 0" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
      case "frown": return `<path d="M86 128q14-13 28 0" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/>`;
      case "small": return `<circle cx="100" cy="123" r="4" fill="${ink}"/>`;
      case "teeth": return `<rect x="78" y="114" width="44" height="20" rx="6" fill="#fff" stroke="${ink}" stroke-width="3.5"/><path d="M89 114v20M100 114v20M111 114v20" stroke="${ink}" stroke-width="2.5"/>`;
      case "line": return `<path d="M86 124h28" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/>`;
      default: return "";
    }
  }

  function body(key, c, d) {
    if (key === "nige") {
      // レンガの壁
      let bricks = "";
      for (let y = 40, row = 0; y < 150; y += 22, row++) {
        for (let x = 30 + (row % 2 ? -18 : 0); x < 170; x += 36) {
          const left = Math.max(30, x), right = Math.min(170, x + 33);
          if (right > left) bricks += `<rect x="${left}" y="${y}" width="${right - left}" height="19" rx="3" fill="${row % 2 ? d : c}"/>`;
        }
      }
      return bricks;
    }
    if (key === "tsukare") {
      // とろけている
      return `<path d="M34 138c-10-34 8-82 66-82s76 48 66 82c-2 10-10 18-22 13-8-4-13 10-24 6-9-3-14-8-22-3-10 7-20 6-28-1-8-6-18 10-26 3-6-5-9-12-10-18z" fill="${c}"/>`;
    }
    if (key === "kodoku") {
      return `<ellipse cx="100" cy="164" rx="58" ry="7" fill="#000" opacity=".22"/><g transform="translate(100 104) scale(.72) translate(-100 -104)"><circle cx="100" cy="100" r="58" fill="${c}"/><circle cx="60" cy="118" r="34" fill="${c}"/><circle cx="140" cy="118" r="34" fill="${c}"/></g>`;
    }
    if (key === "fuan") {
      // ぎざぎざの輪郭
      let pts = "";
      const n = 22;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const r = i % 2 ? 72 : 58;
        pts += `${(100 + Math.cos(t) * r * 1.08).toFixed(1)},${(104 + Math.sin(t) * r * 0.92).toFixed(1)} `;
      }
      return `<polygon points="${pts}" fill="${c}" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>`;
    }
    // ふつうのもくもく
    return [
      [100, 92, 54], [58, 112, 36], [142, 112, 36], [76, 128, 30], [124, 128, 30], [62, 82, 26], [138, 82, 26],
    ].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("");
  }

  function extra(key, tint) {
    const ink = "#fff";
    switch (key) {
      case "taikutsu": return `<text x="150" y="46" font-size="22" font-weight="900" fill="${ink}" opacity=".85">Z</text><text x="170" y="28" font-size="15" font-weight="900" fill="${ink}" opacity=".6">z</text>`;
      case "guruguru": return `<path d="M14 60c10-14 30-10 28 6s-22 14-22 2" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round" opacity=".7"/><path d="M186 44c-10-12-27-8-25 6s20 12 20 2" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`;
      case "jihi": return `<g opacity=".92"><rect x="142" y="26" width="52" height="30" rx="10" fill="#fff"/><path d="M152 56l-6 11 15-11" fill="#fff"/><path d="M160 34l14 14M174 34l-14 14" stroke="#c94a4a" stroke-width="5" stroke-linecap="round"/></g>`;
      case "ikari": return `<path d="M64 46C56 28 72 22 70 6c16 12 22 24 16 38zM136 46c8-18-8-24-6-40-16 12-22 24-16 38z" fill="#f4a13b"/>`;
      case "muki": return [24, 46, 158, 178].map((x, i) => `<path d="M${x} ${150 + (i % 2) * 12}q-6 10 0 14q6-4 0-14z" fill="#9ec4e8" opacity=".85"/>`).join("") + `<ellipse cx="100" cy="32" rx="48" ry="15" fill="#4f5d70"/>`;
      case "boss": return `<g fill="none" stroke-linecap="round" stroke-width="7" opacity=".95"><path d="M18 120c30-50 56 34 92-14s42-50 74-22" stroke="${tint[0]}"/><path d="M22 74c46-20 42 62 84 34s34-20 72 22" stroke="${tint[1]}"/><path d="M40 150c22-52 56-8 78-44s36-26 56-46" stroke="${tint[2]}"/></g>`;
      default: return "";
    }
  }

  // key: 敵の種類 / tints: ボスのからまった糸の色
  function foeSVG(key, tints) {
    const l = LOOK[key] || LOOK.taikutsu;
    const tintColors = (tints || []).map((k) => (LOOK[k] || LOOK.boss).c);
    while (tintColors.length < 3) tintColors.push("#f6a13c");
    const isKodoku = key === "kodoku";
    const face = `<g${isKodoku ? ' transform="translate(100 112) scale(.72) translate(-100 -104)"' : ""}>${eyes(l.eye)}${mouth(l.mouth)}</g>`;
    const bossBack = key === "boss" ? extra(key, tintColors) : "";
    return `<svg viewBox="0 0 200 180" class="foe-svg" role="img" aria-hidden="true">${body(key, l.c, l.d)}${bossBack}${face}${key === "boss" ? "" : extra(key, tintColors)}</svg>`;
  }

  root.MoyaArt = { foeSVG, LOOK };
})(typeof globalThis !== "undefined" ? globalThis : this);
