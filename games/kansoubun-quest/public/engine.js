/* =========================================================================
 * 感想文クエスト — エンジン
 * -------------------------------------------------------------------------
 * 「AIっぽく見えるところ」の中身。外部APIは使わず、回答の文字数・言葉づかい・
 * キーワードを見て、反応・追加質問・感想文の組み立てを決めている。
 *
 *   analyze()      回答を読んで特徴を取り出す
 *   scoreAnswer()  能力値の上がり幅を決める
 *   reactionFor()  回答直後のひとこと
 *   pickFollowup() 追加質問を選ぶ
 *   buildEssay()   集まった回答を感想文の形に組み立てる
 * ========================================================================= */

const Engine = (() => {
  /* ---------------------------------------------------------------------
   * 小道具
   * ------------------------------------------------------------------ */

  const has = (text, words) => words.some((w) => text.includes(w));

  const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

  /** 文字数（空白・改行は数えない） */
  function countChars(text) {
    return (text || "").replace(/\s/g, "").length;
  }

  /**
   * 文に分ける。「。！？」と改行で切る。
   * （後読み /(?<=…)/ は古いSafariで動かないので使わない）
   */
  function splitSentences(text) {
    const out = [];
    (text || "").split(/\n+/).forEach((line) => {
      let buf = "";
      for (const ch of line) {
        buf += ch;
        if ("。．！？!?".includes(ch)) {
          out.push(buf);
          buf = "";
        }
      }
      if (buf) out.push(buf);
    });
    return out.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  /** 文末に「。」がなければ足す（！？や記号で終わるものはそのまま） */
  function endWithPeriod(s) {
    const t = s.trim();
    if (!t) return t;
    if (/[。．！？!?、：:）)」』…—-]$/.test(t)) return t.replace(/[、]$/, "。");
    return t + "。";
  }

  /**
   * 回答の中から「その人らしいキーワード」を1つ取り出す。
   * 形態素解析は使わず、かぎかっこ → 漢字/カタカナの連なり → 冒頭、の順に探す。
   */
  function extractKeyword(text) {
    const t = (text || "").trim();
    if (!t) return "";

    const quoted = t.match(/[「『]([^」』]{2,20})[」』]/);
    if (quoted) return quoted[1];

    const runs = t.match(/[一-龥々]{2,8}|[ァ-ヶー]{3,10}/g) || [];
    const stop = ["自分", "本当", "主人公", "場面", "理由", "気持", "感想", "最後", "最初", "今回"];
    const good = runs.filter((r) => !stop.includes(r));
    if (good.length) {
      return good.sort((a, b) => b.length - a.length)[0];
    }
    if (runs.length) return runs[0];

    const first = splitSentences(t)[0] || t;
    return first.replace(/[。．！？!?]$/, "").slice(0, 12);
  }

  /* ---------------------------------------------------------------------
   * 1. 回答を読む
   * ------------------------------------------------------------------ */

  function analyze(text) {
    const t = text || "";
    const chars = countChars(t);
    return {
      text: t,
      chars,
      lines: splitSentences(t).length,
      hasEmotion: has(t, LEXICON.emotion),
      hasReason: has(t, LEXICON.reason),
      hasSelf: has(t, LEXICON.self),
      hasAction: has(t, LEXICON.action),
      hasConcrete: has(t, LEXICON.concrete) || /[0-9０-９]/.test(t),
      hasQuote: /[「『][^」』]{2,}[」』]/.test(t),
      keyword: extractKeyword(t),
    };
  }

  /* ---------------------------------------------------------------------
   * 2. 点数をつける
   *    基礎点10 ＋ ボーナス（最大+12）。質問が求めている観点は重めに加点する。
   * ------------------------------------------------------------------ */

  function scoreAnswer(question, a) {
    const want = question.want || [];
    const bonuses = [];
    let points = 10;

    const add = (n, label) => {
      points += n;
      bonuses.push(label);
    };

    if (a.chars >= (question.minChars || 20) * 2) add(3, "たっぷり書けた +3");
    else if (a.chars >= (question.minChars || 20)) add(2, "しっかり書けた +2");

    if (a.hasReason) add(want.includes("reason") ? 4 : 2, "「なぜ」がある +" + (want.includes("reason") ? 4 : 2));
    if (a.hasEmotion) add(want.includes("emotion") ? 3 : 2, "気持ちの言葉 +" + (want.includes("emotion") ? 3 : 2));
    if (a.hasQuote) add(want.includes("quote") ? 4 : 2, "引用した +" + (want.includes("quote") ? 4 : 2));
    if (a.hasSelf) add(want.includes("self") ? 3 : 1, "自分の話 +" + (want.includes("self") ? 3 : 1));
    if (a.hasAction) add(want.includes("action") ? 4 : 1, "行動が書けた +" + (want.includes("action") ? 4 : 1));
    if (a.hasConcrete) add(2, "具体的 +2");

    return { stat: question.stat, points: Math.min(points, 22), bonuses };
  }

  /* ---------------------------------------------------------------------
   * 3. ひとこと返す
   * ------------------------------------------------------------------ */

  function reactionFor(question, a, seed) {
    const want = question.want || [];
    const buckets = [];

    if (a.chars < 12) buckets.push("short");
    else {
      // その質問が求めていた観点を最優先で拾う
      if (want.includes("length") && a.chars >= 80) buckets.push("long");
      if (want.includes("quote") && a.hasQuote) buckets.push("quote");
      if (want.includes("action") && a.hasAction) buckets.push("action");
      if (want.includes("reason") && a.hasReason) buckets.push("reason");
      if (want.includes("self") && a.hasSelf) buckets.push("self");
      if (a.hasQuote) buckets.push("quote");
      if (a.hasEmotion) buckets.push("emotion");
      if (a.hasSelf) buckets.push("self");
      if (a.hasAction) buckets.push("action");
      if (a.hasReason) buckets.push("reason");
      if (a.hasConcrete) buckets.push("concrete");
      if (a.chars >= 90) buckets.push("long");
    }
    if (!buckets.length) buckets.push("generic");

    const bucket = buckets[0];
    const line = pick(REACTIONS[bucket] || REACTIONS.generic, seed + bucket.length);
    const stat = STATS[question.stat] ? STATS[question.stat].label : "能力";
    return line.replace(/\{kw\}/g, a.keyword || "その言葉").replace(/\{stat\}/g, stat);
  }

  /* ---------------------------------------------------------------------
   * 4. 追加質問を選ぶ
   * ------------------------------------------------------------------ */

  function pickFollowup(question, a, usedIds) {
    const cand = FOLLOWUPS.filter(
      (f) => f.after.includes(question.id) && !usedIds.includes(f.id) && f.when(a)
    );
    if (!cand.length) return null;
    const f = cand[0];
    return {
      ...f,
      isFollowup: true,
      parentId: question.id,
      text: f.text.replace(/\{kw\}/g, a.keyword || "さっきの答え"),
    };
  }

  /* ---------------------------------------------------------------------
   * 5. 文体を見わける（ですます／だ・である）
   * ------------------------------------------------------------------ */

  function detectStyle(answers) {
    const all = Object.values(answers).join("\n");
    const polite = (all.match(/です|ます|ました|ません|でした/g) || []).length;
    const plain = (all.match(/[^ま]した。|だ。|である|だった|と思う。|ない。/g) || []).length;
    return plain > polite ? "d" : "p";
  }

  /* ---------------------------------------------------------------------
   * 6. 感想文を組み立てる
   * ------------------------------------------------------------------ */

  /** 本文用に、回答を文の配列にする */
  function toSentences(text, qid, audience) {
    const raw = splitSentences(text);
    return raw.map((s, i) => ({
      id: `q${qid}#${i}`,
      text: audience === "sns" ? s.replace(/[。．]$/, "") : endWithPeriod(s),
      from: "me",
      qid,
    }));
  }

  function frameSentence(audience, style, role, vars) {
    const set = FRAMES[audience] || FRAMES.teen;
    const f = set[role];
    if (!f) return null;
    let text = style === "d" ? f.d : f.p;
    Object.keys(vars).forEach((k) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k] || "");
    });
    return { id: `f:${role}`, text, from: "frame", role };
  }

  /**
   * 感想文を組み立てる。
   *   state   … { book, answers, followupAnswers }
   *   opts    … { audience, length, edits, added, dropped }
   * 返り値のブロック配列をそのまま画面に並べれば感想文になる。
   */
  function buildEssay(state, opts) {
    const audience = opts.audience || "teen";
    const length = opts.length || 800;
    const style = opts.style || detectStyle(state.answers);
    const edits = opts.edits || {};
    const added = opts.added || {};
    const isHeading = HEADING_AUDIENCES.includes(audience);
    const vars = {
      title: state.book.title || "この本",
      author: state.book.author || "",
      me: state.book.reader || "私",
    };

    // 追加質問のうち、置き場所（block）が決まっていないものは
    // もとの質問の答えにそのままつなげる。
    const answerFor = (qid) => {
      const own = state.answers[qid];
      const extra = (state.followupAnswers || [])
        .filter((f) => f.parentId === qid && !f.block)
        .map((f) => f.text);
      return [own, ...extra].filter(Boolean).join("\n");
    };

    /* --- ブロックごとに文をならべる --- */
    const built = BLOCKS.map((b) => {
      const sentences = [];
      // 見出しにするのは中身のあるブロックだけ（書き出し・むすびは本文のまま）
      const headBlock = isHeading && b.key !== "opening" && b.key !== "closing";

      if (b.key === "opening") {
        sentences.push(frameSentence(audience, style, "opening", vars));
      } else if (b.key === "closing") {
        sentences.push(frameSentence(audience, style, "closing", vars));
      } else {
        // 見出し役／導入役のフレーム
        const roleMap = {
          reason: ["reason"],
          story: ["story"],
          impression: ["impression", "impressionWhy"],
          scene: ["scene", "sceneWhy"],
          self: ["self", "selfIf"],
          learn: ["learn"],
          recommend: ["recommend"],
        };
        const roles = roleMap[b.key] || [];
        b.questions.forEach((qid, i) => {
          const text = answerFor(qid);
          if (!text) return;
          const role = roles[i] || roles[0];
          if (role) {
            // 見出しモードでは最初の1回だけ見出しを出す
            if (!headBlock || i === 0) {
              sentences.push(frameSentence(audience, style, role, vars));
            }
          }
          sentences.push(...toSentences(text, qid, audience));
        });
      }

      // 追加質問のうち、ブロック指定があるものを混ぜる
      (state.followupAnswers || [])
        .filter((f) => f.block === b.key && f.text)
        .forEach((f, i) => {
          sentences.push(
            ...splitSentences(f.text).map((s, j) => ({
              id: `fu${f.id}#${i}${j}`,
              text: audience === "sns" ? s.replace(/[。．]$/, "") : endWithPeriod(s),
              from: "me",
              qid: f.parentId,
            }))
          );
        });

      // 「一番伝えたい一文」の追記
      (added[b.key] || []).forEach((t, i) => {
        sentences.push({
          id: `add:${b.key}#${i}`,
          text: endWithPeriod(t),
          from: "me",
          added: true,
        });
      });

      // 書きかえられた文は「自分の言葉」として数える
      const list = sentences
        .filter(Boolean)
        .map((s) =>
          edits[s.id] !== undefined ? { ...s, text: edits[s.id], edited: true } : { ...s }
        )
        .filter((s) => s.text && s.text.trim() !== "");

      return {
        key: b.key,
        label: b.label,
        priority: b.priority,
        heading: headBlock && list.length && list[0].from === "frame" ? list[0].text : null,
        sentences: headBlock && list.length && list[0].from === "frame" ? list.slice(1) : list,
      };
    }).filter((b) => b.sentences.length > 0 || b.heading);

    /* --- 字数に合わせて調整する --- */
    const dropped = [];
    const measure = (blocks) =>
      blocks.reduce(
        (n, b) =>
          n + countChars(b.heading || "") + b.sentences.reduce((m, s) => m + countChars(s.text), 0),
        0
      );

    let blocks = built.filter((b) => !(opts.dropped || []).includes(b.key));
    (opts.dropped || []).forEach((k) => {
      const b = built.find((x) => x.key === k);
      if (b) dropped.push({ key: b.key, label: b.label, chars: measure([b]) });
    });

    // 目標より多すぎるときは、優先度の低いブロックから外す
    const overLimit = Math.round(length * 1.15);
    if (measure(blocks) > overLimit) {
      const order = [...blocks].sort((a, b) => b.priority - a.priority);
      for (const b of order) {
        if (measure(blocks) <= overLimit) break;
        if (b.priority <= 1) continue; // ここは感想文の芯なので外さない
        blocks = blocks.filter((x) => x.key !== b.key);
        dropped.push({ key: b.key, label: b.label, chars: measure([b]), auto: true });
      }
    }

    const chars = measure(blocks);
    const mine = blocks.reduce(
      (n, b) =>
        n +
        b.sentences
          .filter((s) => s.from === "me" || s.edited)
          .reduce((m, s) => m + countChars(s.text), 0),
      0
    );

    return {
      audience,
      length,
      style,
      blocks,
      dropped,
      chars,
      shortfall: Math.max(0, Math.round(length * 0.9) - chars),
      overflow: Math.max(0, chars - overLimit),
      ownRatio: chars ? Math.round((mine / chars) * 100) : 0,
    };
  }

  /* ---------------------------------------------------------------------
   * 7. タイトル案
   * ------------------------------------------------------------------ */

  function titleCandidates(state) {
    const book = state.book.title || "この本";
    const impression = analyze(state.answers[3] || "");
    const scene = analyze(state.answers[5] || "");
    const learn = analyze(state.answers[9] || "");
    const kw = impression.keyword || scene.keyword || "この一冊";

    // 長いキーワードはタイトルに埋めこまず、引用の形で見せる
    const sceneTitle = !scene.keyword
      ? null
      : scene.keyword.length <= 8
      ? `${scene.keyword}の場面で、立ちどまった`
      : `「${scene.keyword.slice(0, 16)}」——立ちどまった一行`;

    const list = [
      `『${book}』が教えてくれたこと`,
      kw && kw.length <= 16 ? `「${kw}」と思った日` : null,
      sceneTitle,
      learn.keyword && learn.keyword.length <= 8 ? `${learn.keyword}から始めてみる` : null,
      `わたしと『${book}』`,
    ].filter(Boolean);

    return [...new Set(list)].slice(0, 4);
  }

  /* ---------------------------------------------------------------------
   * 8. 書き出し用テキスト
   * ------------------------------------------------------------------ */

  function essayToText(essay, meta) {
    const lines = [];
    if (meta && meta.title) lines.push(meta.title, "");
    if (meta && meta.reader) lines.push(meta.reader, "");

    essay.blocks.forEach((b) => {
      if (b.heading) lines.push(`## ${b.heading}`, "");
      if (essay.audience === "sns") {
        lines.push(b.sentences.map((s) => s.text).join("\n"));
        lines.push("");
      } else {
        lines.push("　" + b.sentences.map((s) => s.text).join(""));
        lines.push("");
      }
    });

    if (meta && meta.book) {
      const b = meta.book;
      lines.push(`（『${b.title}』${b.author ? " " + b.author : ""}）`);
    }
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  return {
    analyze,
    scoreAnswer,
    reactionFor,
    pickFollowup,
    detectStyle,
    buildEssay,
    titleCandidates,
    essayToText,
    countChars,
    splitSentences,
    extractKeyword,
  };
})();
