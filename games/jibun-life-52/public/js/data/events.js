/* ==========================================================
 * ランダムイベントデータ（全100種類）
 *
 * イベントの形式:
 * {
 *   id:      一意なID
 *   emoji:   表示アイコン
 *   title:   イベント名
 *   text:    説明文
 *   weight:  抽選の重み（省略時 1）
 *   cond: {                     // 発生条件（省略時は常に候補）
 *     minTurn / maxTurn         // 週数の範囲
 *     stats: { key: {min,max} } // パラメータ条件
 *     flags: { key: bool }      // フラグ条件（hasPartner など）
 *     minSkill / minJobLevel / maxJobLevel / minWorkCount
 *   }
 *   effects: パラメータ変化（happiness/stress/health/money/relationship/skill/jobLevel）
 *   set:     フラグ変更（例: { hasPartner: true }）
 * }
 *
 * カテゴリ別件数: 健康15 / 仕事15 / 恋愛・人間関係15 / お金10 /
 *                趣味・余暇15 / 学び10 / 季節10 / ハプニング10 = 100
 * ========================================================== */

/* ---------- 健康系（15） ---------- */
const EVENTS_HEALTH = [
  { id: "cold", emoji: "🤧", title: "風邪をひいた", text: "季節の変わり目に体調を崩してしまった。無理は禁物。", weight: 2, cond: { stats: { health: { max: 60 } } }, effects: { health: -8, stress: 5, happiness: -3 } },
  { id: "flu", emoji: "🤒", title: "インフルエンザ", text: "高熱でダウン。1週間まるまる寝込んでしまった…。", cond: { stats: { health: { max: 45 } } }, effects: { health: -15, stress: 8, money: -3, happiness: -5 } },
  { id: "backpain", emoji: "😖", title: "ぎっくり腰", text: "重い荷物を持った瞬間、腰に激痛が走った！", cond: { stats: { health: { max: 55 } } }, effects: { health: -10, stress: 6, money: -2 } },
  { id: "checkup_good", emoji: "🩺", title: "健康診断の結果が良好", text: "日頃の生活習慣が数字にあらわれた。お医者さんに褒められた！", cond: { stats: { health: { min: 65 } } }, effects: { happiness: 6, stress: -4 } },
  { id: "checkup_bad", emoji: "📋", title: "健康診断で要注意", text: "「このままだと危ないですよ」と言われてしまった…。", cond: { stats: { health: { max: 40 } } }, effects: { stress: 8, happiness: -4 } },
  { id: "goodsleep", emoji: "😴", title: "ぐっすり眠れた", text: "最近まれに見る快眠。目覚めスッキリ、心も軽い。", cond: { stats: { stress: { max: 50 } } }, effects: { health: 6, stress: -6, happiness: 4 } },
  { id: "insomnia", emoji: "🌙", title: "眠れない夜", text: "考えごとが頭をぐるぐる回って眠れない…。", weight: 2, cond: { stats: { stress: { min: 60 } } }, effects: { health: -6, stress: 6, happiness: -3 } },
  { id: "headache", emoji: "🤕", title: "頭痛が続く", text: "ストレスからくる頭痛かもしれない。休息が必要だ。", cond: { stats: { stress: { min: 65 } } }, effects: { health: -5, happiness: -4 } },
  { id: "marathon", emoji: "🏅", title: "マラソン大会で完走", text: "鍛えた体で地元のマラソン大会に挑戦。見事完走！", cond: { stats: { health: { min: 70 } } }, effects: { happiness: 8, health: 4, stress: -5, relationship: 3 } },
  { id: "morning_walk", emoji: "🌄", title: "朝さんぽが習慣に", text: "朝の空気が気持ちいい。散歩が日課になってきた。", effects: { health: 5, stress: -4, happiness: 3 } },
  { id: "healthy_meal", emoji: "🥗", title: "自炊にハマる", text: "野菜たっぷりの自炊生活。体の調子がいい気がする。", effects: { health: 6, money: 2, happiness: 2 } },
  { id: "dentist", emoji: "🦷", title: "虫歯が見つかった", text: "甘いものの食べすぎ？ 歯医者通いが始まった…。", effects: { money: -3, stress: 4, happiness: -2 } },
  { id: "stomach", emoji: "😵", title: "胃の調子が悪い", text: "ストレスで胃がキリキリ…。食事がのどを通らない。", cond: { stats: { stress: { min: 70 } } }, effects: { health: -8, happiness: -4 } },
  { id: "sauna", emoji: "🧖", title: "サウナで“ととのう”", text: "話題のサウナへ。心も体もリフレッシュ！", effects: { stress: -10, health: 3, money: -1, happiness: 5 } },
  { id: "allergy", emoji: "🤧", title: "花粉症デビュー", text: "目がかゆい、鼻がムズムズ…。ついにこの日が来てしまった。", cond: { minTurn: 45 }, effects: { health: -4, stress: 4, money: -1 } },
];

/* ---------- 仕事系（15） ---------- */
const EVENTS_WORK = [
  { id: "promotion", emoji: "🎖", title: "昇進した！", text: "日頃の頑張りとスキルが認められ、役職が上がった！給料もアップ！", weight: 3, cond: { minWorkCount: 6, minSkill: 25, maxJobLevel: 2 }, effects: { jobLevel: 1, happiness: 10, money: 5, stress: 5 } },
  { id: "bonus", emoji: "💰", title: "ボーナス支給", text: "会社の業績が好調でボーナスが出た！", cond: { minWorkCount: 6 }, effects: { money: 15, happiness: 8 } },
  { id: "praise_boss", emoji: "👏", title: "上司に褒められた", text: "「君に任せてよかったよ」その一言で疲れが吹き飛んだ。", cond: { minWorkCount: 3 }, effects: { happiness: 6, stress: -4, relationship: 3 } },
  { id: "big_project", emoji: "🚀", title: "大きな仕事を任された", text: "プレッシャーは大きいが、成長のチャンスだ！", cond: { minWorkCount: 5 }, effects: { skill: 5, stress: 8, happiness: 3 } },
  { id: "overtime", emoji: "🌃", title: "残業続きの1週間", text: "締め切り前で連日残業…。体が悲鳴を上げている。", weight: 2, cond: { minWorkCount: 4 }, effects: { money: 3, stress: 10, health: -5, happiness: -4 } },
  { id: "work_mistake", emoji: "😱", title: "仕事で大失敗", text: "大事な書類にミス発覚。冷や汗が止まらない…。", cond: { minWorkCount: 2 }, effects: { stress: 10, happiness: -6 } },
  { id: "new_colleague", emoji: "🧑‍💼", title: "気の合う同僚が入社", text: "新しく入った同僚と意気投合。職場が楽しくなった。", cond: { minWorkCount: 2 }, effects: { relationship: 7, happiness: 5, stress: -3 } },
  { id: "side_job", emoji: "💻", title: "副業の依頼が舞い込む", text: "スキルを見込まれて副業のオファーが！週末に頑張った。", cond: { minSkill: 25 }, effects: { money: 8, stress: 5, skill: 2 } },
  { id: "office_party", emoji: "🍻", title: "職場の飲み会", text: "普段話さない人とも打ち解けられた。たまにはいいものだ。", cond: { minWorkCount: 2 }, effects: { relationship: 5, money: -1, health: -2, happiness: 3 } },
  { id: "client_thanks", emoji: "💌", title: "お客様から感謝の手紙", text: "「あなたのおかげで助かりました」——働く意味を思い出した。", cond: { minWorkCount: 4 }, effects: { happiness: 8, stress: -5 } },
  { id: "boss_trouble", emoji: "😤", title: "上司と衝突", text: "意見が真っ向から対立。納得がいかない…。", cond: { minWorkCount: 3 }, effects: { stress: 9, happiness: -5, relationship: -4 } },
  { id: "headhunt", emoji: "📞", title: "ヘッドハンティングの電話", text: "他社からスカウトが！自分の市場価値を実感した。", cond: { minSkill: 50 }, effects: { happiness: 7, skill: 2, stress: -3 } },
  { id: "work_award", emoji: "🏆", title: "社内表彰された", text: "今期のMVPに選ばれた！みんなの前で表彰されて誇らしい。", weight: 1, cond: { minWorkCount: 10, minSkill: 40 }, effects: { happiness: 10, money: 5, relationship: 4 } },
  { id: "pc_crash", emoji: "🖥", title: "パソコンが壊れた", text: "作業中のデータが消えた…。買い替えの出費も痛い。", effects: { money: -8, stress: 8, happiness: -3 } },
  { id: "commute_change", emoji: "🚃", title: "通勤ラッシュにうんざり", text: "満員電車で消耗する毎日。働き方を考えたくなる。", cond: { minWorkCount: 3 }, effects: { stress: 6, health: -3 } },
];

/* ---------- 恋愛・人間関係系（15） ---------- */
const EVENTS_LOVE = [
  { id: "new_partner", emoji: "💕", title: "恋人ができた！", text: "交流を重ねるうちに素敵な人と出会い、恋人になった！", weight: 3, cond: { stats: { relationship: { min: 55 } }, flags: { hasPartner: false } }, effects: { happiness: 15, stress: -8, relationship: 5 }, set: { hasPartner: true } },
  { id: "heartbreak", emoji: "💔", title: "失恋…", text: "すれ違いが続き、恋人と別れることになった…。", weight: 2, cond: { flags: { hasPartner: true } }, effects: { happiness: -15, stress: 12, relationship: -5 }, set: { hasPartner: false } },
  { id: "date", emoji: "🎡", title: "恋人とデート", text: "遊園地で1日デート。笑いっぱなしの最高の休日。", weight: 2, cond: { flags: { hasPartner: true } }, effects: { happiness: 10, stress: -8, money: -3 } },
  { id: "partner_quarrel", emoji: "⚡", title: "恋人とケンカ", text: "些細なことから口論に。気まずい空気が続く…。", cond: { flags: { hasPartner: true } }, effects: { stress: 8, happiness: -6 } },
  { id: "makeup", emoji: "🤝", title: "仲直りできた", text: "素直に「ごめんね」を言えた。前より絆が深まった気がする。", cond: { flags: { hasPartner: true }, stats: { stress: { min: 40 } } }, effects: { happiness: 8, stress: -6, relationship: 4 } },
  { id: "old_friend", emoji: "🍵", title: "旧友と再会", text: "学生時代の友人とばったり。思い出話に花が咲いた。", effects: { relationship: 6, happiness: 6, stress: -4 } },
  { id: "friend_trouble", emoji: "🌧", title: "友人とすれ違い", text: "軽い一言が友人を傷つけてしまったみたいだ…。", cond: { stats: { relationship: { min: 30 } } }, effects: { relationship: -6, stress: 5, happiness: -3 } },
  { id: "friend_help", emoji: "🆘", title: "友人を助けた", text: "困っている友人を全力でサポート。「ありがとう」が嬉しい。", cond: { stats: { relationship: { min: 40 } } }, effects: { relationship: 8, happiness: 6, stress: 2 } },
  { id: "helped_by_friend", emoji: "🎁", title: "友人に助けられた", text: "落ち込んでいたら友人が駆けつけてくれた。持つべきものは友。", cond: { stats: { stress: { min: 55 }, relationship: { min: 50 } } }, effects: { stress: -12, happiness: 8 } },
  { id: "family_call", emoji: "📱", title: "家族から電話", text: "久しぶりの家族の声にほっとした。今度顔を見せに行こう。", effects: { happiness: 5, stress: -4, relationship: 3 } },
  { id: "wedding_invite", emoji: "💒", title: "友人の結婚式", text: "幸せそうな友人の姿に感動。ご祝儀は痛いけど…！", cond: { stats: { relationship: { min: 45 } } }, effects: { happiness: 8, money: -3, relationship: 5 } },
  { id: "neighbor", emoji: "🏘", title: "ご近所さんと仲良くなった", text: "あいさつがきっかけで立ち話をする仲に。地域の輪が広がる。", effects: { relationship: 5, happiness: 3 } },
  { id: "sns_flame", emoji: "🔥", title: "SNSで疲れた", text: "他人のキラキラ投稿と自分を比べて落ち込んでしまった…。", effects: { happiness: -5, stress: 6 } },
  { id: "community", emoji: "🌻", title: "地域のボランティアに参加", text: "公園の清掃活動に参加。「ありがとう」と言われて心が温かい。", effects: { relationship: 6, happiness: 6, health: 2 } },
  { id: "mentor", emoji: "🦉", title: "人生の恩師と語り合う", text: "尊敬する先輩とじっくり対話。生き方のヒントをもらった。", cond: { stats: { relationship: { min: 60 } } }, effects: { happiness: 7, skill: 3, stress: -5 } },
];

/* ---------- お金系（10） ---------- */
const EVENTS_MONEY = [
  { id: "lottery_small", emoji: "🎫", title: "宝くじが当たった！", text: "なんと1万円の当たりくじ！ちょっとした臨時収入だ。", effects: { money: 1, happiness: 5 } },
  { id: "found_money", emoji: "👛", title: "へそくりを発見", text: "昔の上着のポケットからお札が！過去の自分ありがとう。", effects: { money: 2, happiness: 4 } },
  { id: "phone_broke", emoji: "📵", title: "スマホが故障", text: "画面が真っ暗に…。修理代が痛い出費だ。", effects: { money: -5, stress: 6 } },
  { id: "tax_refund", emoji: "🧾", title: "還付金が振り込まれた", text: "確定申告のご褒美。ちゃんと手続きしてよかった！", cond: { minTurn: 44 }, effects: { money: 4, happiness: 3 } },
  { id: "impulse_buy", emoji: "🛍", title: "衝動買いしてしまった", text: "セールの誘惑に負けた…。でもちょっと幸せ。", effects: { money: -6, happiness: 4, stress: -2 } },
  { id: "furusato", emoji: "🍖", title: "ふるさと納税の返礼品", text: "立派なお肉が届いた！今夜はごちそうだ。", cond: { stats: { money: { min: 30 } } }, effects: { happiness: 5, health: 2 } },
  { id: "point_up", emoji: "💳", title: "ポイ活が実を結ぶ", text: "コツコツ貯めたポイントで生活費が浮いた。", effects: { money: 2, happiness: 2 } },
  { id: "rent_up", emoji: "🏠", title: "家賃の値上げ通知", text: "更新のタイミングで家賃アップ…。固定費が重い。", cond: { minTurn: 20 }, effects: { money: -4, stress: 5 } },
  { id: "subsc_check", emoji: "📉", title: "サブスクを整理した", text: "使っていないサービスを解約。固定費がスッキリ！", effects: { money: 3, stress: -3, happiness: 2 } },
  { id: "invest_seminar", emoji: "📈", title: "マネー講座に参加", text: "お金の勉強は自分への投資。将来設計を考えるきっかけに。", effects: { money: -2, skill: 4, happiness: 2 } },
];

/* ---------- 趣味・余暇系（15） ---------- */
const EVENTS_HOBBY = [
  { id: "travel", emoji: "✈️", title: "旅行に出かけた！", text: "思い切って小旅行へ。知らない街の空気が心を軽くしてくれた。", weight: 2, cond: { stats: { money: { min: 15 } } }, effects: { happiness: 12, stress: -15, money: -8, health: 2 } },
  { id: "onsen", emoji: "♨️", title: "温泉でリフレッシュ", text: "近場の温泉へ日帰り旅。湯けむりに癒やされた…。", cond: { stats: { money: { min: 8 } } }, effects: { stress: -12, health: 4, money: -3, happiness: 6 } },
  { id: "new_hobby", emoji: "🎸", title: "新しい趣味と出会う", text: "ふと始めてみたことが想像以上に楽しい！世界が広がった。", effects: { happiness: 8, stress: -5, money: -2 } },
  { id: "camp", emoji: "🏕", title: "キャンプに挑戦", text: "焚き火を眺める時間の贅沢さよ…。自然に癒やされた。", cond: { stats: { money: { min: 10 } } }, effects: { happiness: 8, stress: -10, money: -4, health: 3 } },
  { id: "movie", emoji: "🎬", title: "映画で号泣", text: "話題の映画が心に刺さった。良い涙を流してスッキリ。", effects: { happiness: 6, stress: -6, money: -1 } },
  { id: "live", emoji: "🎤", title: "推しのライブ参戦", text: "生の音楽は魂に響く！明日からまた頑張れる！", cond: { stats: { money: { min: 10 } } }, effects: { happiness: 12, stress: -10, money: -5, health: -2 } },
  { id: "game_clear", emoji: "🎮", title: "積みゲーをクリア", text: "ずっと積んでいたゲームをついにクリア。大満足のエンディング！", effects: { happiness: 7, stress: -5, health: -2 } },
  { id: "cafe", emoji: "☕", title: "隠れ家カフェを発見", text: "路地裏に素敵なカフェを見つけた。自分だけの特等席。", effects: { happiness: 5, stress: -5, money: -1 } },
  { id: "garden", emoji: "🪴", title: "植物を育て始めた", text: "小さな緑が部屋にあるだけで、毎日が少し優しくなる。", effects: { happiness: 4, stress: -4, money: -1 } },
  { id: "pet", emoji: "🐈", title: "猫を飼い始めた！", text: "運命の出会いをしてしまった…。もふもふの家族が増えた！", weight: 1, cond: { flags: { hasPet: false }, stats: { money: { min: 20 } } }, effects: { happiness: 12, stress: -8, money: -6 }, set: { hasPet: true } },
  { id: "pet_heal", emoji: "😻", title: "ペットに癒やされる", text: "帰宅すると駆け寄ってくる小さな家族。疲れが溶けていく…。", weight: 2, cond: { flags: { hasPet: true } }, effects: { stress: -8, happiness: 6, money: -1 } },
  { id: "reading", emoji: "📖", title: "本の世界に没頭", text: "ページをめくる手が止まらない。良書との出会いは宝物。", effects: { happiness: 5, stress: -4, skill: 2 } },
  { id: "diy", emoji: "🔨", title: "DIYで部屋を改造", text: "棚を自作してみた。ちょっと歪んでるけど愛着がわく。", effects: { happiness: 6, money: -3, skill: 2 } },
  { id: "photo", emoji: "📷", title: "写真散歩", text: "カメラ片手に街を歩く。いつもの道が特別に見えた。", effects: { happiness: 5, stress: -5, health: 2 } },
  { id: "festival", emoji: "🏮", title: "地元のお祭り", text: "屋台の香りと祭囃子。童心に返って楽しんだ！", effects: { happiness: 7, relationship: 4, money: -2 } },
];

/* ---------- 学び・成長系（10） ---------- */
const EVENTS_STUDY = [
  { id: "exam_pass", emoji: "📜", title: "資格試験に合格！", text: "コツコツ勉強した成果が実った！自信がついた。", weight: 2, cond: { minSkill: 30 }, effects: { skill: 5, happiness: 10, stress: -5 } },
  { id: "exam_fail", emoji: "😢", title: "試験に落ちた…", text: "あと少し点が足りなかった…。悔しいが次がある！", cond: { minSkill: 15 }, effects: { happiness: -6, stress: 7, skill: 2 } },
  { id: "seminar", emoji: "🎓", title: "セミナーで刺激を受けた", text: "同じ目標を持つ仲間と出会い、モチベーションが爆上がり！", effects: { skill: 4, happiness: 4, relationship: 3, money: -2 } },
  { id: "eng_progress", emoji: "🗽", title: "英語が通じた！", text: "道を聞かれた外国人観光客を案内できた。勉強の成果だ！", cond: { minSkill: 20 }, effects: { happiness: 6, skill: 2 } },
  { id: "online_course", emoji: "💻", title: "オンライン講座にハマる", text: "動画教材が面白くて夜ふかし。学びが娯楽になってきた。", effects: { skill: 5, health: -2, money: -1 } },
  { id: "mentor_advice", emoji: "🧭", title: "勉強法が確立した", text: "自分に合う学び方が見つかった。効率がぐんと上がった！", cond: { minSkill: 25 }, effects: { skill: 5, stress: -3 } },
  { id: "study_slump", emoji: "🥱", title: "勉強スランプ", text: "机に向かっても頭に入らない…。焦りだけが募る。", cond: { minSkill: 10 }, effects: { stress: 5, happiness: -3 } },
  { id: "library", emoji: "🏛", title: "図書館という聖域", text: "静かな図書館は最高の学び場。無料なのもありがたい。", effects: { skill: 3, stress: -3, happiness: 2 } },
  { id: "teach_friend", emoji: "🧑‍🏫", title: "友人に勉強を教えた", text: "人に教えると自分の理解も深まる。感謝もされて一石二鳥！", cond: { minSkill: 20, stats: { relationship: { min: 40 } } }, effects: { skill: 3, relationship: 5, happiness: 4 } },
  { id: "new_field", emoji: "🔭", title: "新しい分野に興味", text: "ふと読んだ記事から未知の分野へ。知的好奇心が止まらない！", effects: { skill: 3, happiness: 4 } },
];

/* ---------- 季節系（10）※ゲームは4月スタート ---------- */
const EVENTS_SEASON = [
  { id: "gw", emoji: "🎏", title: "ゴールデンウィーク", text: "大型連休を満喫！心ゆくまでリフレッシュできた。", weight: 3, cond: { minTurn: 4, maxTurn: 6 }, effects: { happiness: 8, stress: -10, money: -4 } },
  { id: "rainy", emoji: "☔", title: "梅雨のジメジメ", text: "雨続きで洗濯物が乾かない…。気分もどんより。", weight: 2, cond: { minTurn: 9, maxTurn: 13 }, effects: { happiness: -4, stress: 4 } },
  { id: "summer_fes", emoji: "🎆", title: "夏祭りと花火大会", text: "夜空に咲く大輪の花火。夏の思い出がひとつ増えた。", weight: 2, cond: { minTurn: 15, maxTurn: 21 }, effects: { happiness: 9, relationship: 4, money: -2 } },
  { id: "heat", emoji: "🥵", title: "猛暑バテ", text: "連日の猛暑日で食欲がない…。水分補給を忘れずに。", weight: 2, cond: { minTurn: 16, maxTurn: 22 }, effects: { health: -6, stress: 5 } },
  { id: "sea", emoji: "🏖", title: "海に行った！", text: "青い海と白い砂浜！日焼けはしたけど最高の夏の1日。", cond: { minTurn: 14, maxTurn: 22, stats: { money: { min: 8 } } }, effects: { happiness: 9, stress: -8, money: -3 } },
  { id: "autumn_leaves", emoji: "🍁", title: "紅葉狩り", text: "山一面の紅葉に息をのんだ。秋の空気が心地いい。", weight: 2, cond: { minTurn: 28, maxTurn: 34 }, effects: { happiness: 7, stress: -7, health: 2 } },
  { id: "christmas", emoji: "🎄", title: "クリスマス", text: "街はイルミネーション一色。ケーキを食べて聖夜を満喫。", weight: 3, cond: { minTurn: 37, maxTurn: 39 }, effects: { happiness: 8, money: -3, relationship: 3 } },
  { id: "newyear", emoji: "🎍", title: "お正月", text: "初詣で1年の抱負を祈願。お年玉ならぬお年玉出費も…。", weight: 3, cond: { minTurn: 40, maxTurn: 42 }, effects: { happiness: 7, stress: -8, money: -3 } },
  { id: "valentine", emoji: "🍫", title: "バレンタイン", text: "甘いチョコの季節。ちょっとドキドキする1週間。", weight: 2, cond: { minTurn: 45, maxTurn: 47 }, effects: { happiness: 5, relationship: 3, money: -1 } },
  { id: "sakura", emoji: "🌸", title: "桜が咲いた", text: "満開の桜並木。この1年を思い返しながら歩いた。", weight: 3, cond: { minTurn: 49 }, effects: { happiness: 8, stress: -8 } },
];

/* ---------- ハプニング系（10） ---------- */
const EVENTS_HAPPENING = [
  { id: "moving", emoji: "🚚", title: "引っ越しした！", text: "心機一転、新しい部屋へ。お金はかかったが環境が良くなった！", weight: 1, cond: { minTurn: 10, stats: { money: { min: 40 } }, flags: { hasMoved: false } }, effects: { money: -20, happiness: 10, stress: -5, health: 3 }, set: { hasMoved: true } },
  { id: "rain_soaked", emoji: "🌧", title: "ゲリラ豪雨で全身ずぶ濡れ", text: "傘を持たない日に限って豪雨。ついてない…。", effects: { happiness: -3, health: -3, stress: 3 } },
  { id: "lost_wallet", emoji: "😨", title: "財布を落とした！", text: "青ざめたが、親切な人が届けてくれた。世の中捨てたもんじゃない。", effects: { stress: 8, money: -2, relationship: 3 } },
  { id: "bike_flat", emoji: "🚲", title: "自転車がパンク", text: "急いでいる時に限ってパンク…。修理して帰った。", effects: { money: -1, stress: 4 } },
  { id: "tv_feature", emoji: "📺", title: "行きつけの店がTVに", text: "お気に入りの店が紹介されて大行列に。嬉しいような悲しいような。", effects: { happiness: 3, stress: 2 } },
  { id: "lucky_day", emoji: "🍀", title: "なんだかツイてる日", text: "信号は全部青、くじ引きは当たり。小さな幸運が続いた！", effects: { happiness: 6, stress: -4, money: 1 } },
  { id: "power_out", emoji: "🔌", title: "停電した夜", text: "ろうそくの灯りで過ごす夜。不便だけど、たまには悪くない。", effects: { stress: 3, happiness: 2 } },
  { id: "reunion_tv", emoji: "🫶", title: "推し番組に元気をもらう", text: "深夜のバラエティで大笑い。笑いは最高の薬だ。", effects: { happiness: 5, stress: -5, health: -1 } },
  { id: "typhoon", emoji: "🌀", title: "台風が直撃", text: "予定がすべてキャンセルに。家で嵐が過ぎるのを待った。", cond: { minTurn: 18, maxTurn: 30 }, effects: { happiness: -4, stress: 4, money: -1 } },
  { id: "shooting_star", emoji: "🌠", title: "流れ星を見た", text: "夜空に一筋の光。とっさに願いごとをした。叶うといいな。", effects: { happiness: 5, stress: -3 } },
];

/* ---------- 統合 ---------- */
const EVENTS = [
  ...EVENTS_HEALTH,
  ...EVENTS_WORK,
  ...EVENTS_LOVE,
  ...EVENTS_MONEY,
  ...EVENTS_HOBBY,
  ...EVENTS_STUDY,
  ...EVENTS_SEASON,
  ...EVENTS_HAPPENING,
];

/* イベント発生確率（発生しない週もある） */
const EVENT_CHANCE = 0.7;
