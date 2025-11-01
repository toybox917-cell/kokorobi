// build.mjs — 心灯｜完全版（昼可読性 + カラー説明行間調整 + 雑誌カード風ランキング）
// Node18+ / GitHub Actions (JST) 用

import { writeFileSync, existsSync, readFileSync } from "node:fs";

// ====== ソース定義（存在すれば優先。無ければ自動生成へ） ======
const SOURCE = {
  daily:   "https://gist.githubusercontent.com/toybox917-cell/5cc5efcc825f7cc57f0e7b49ff9dc7c5/raw",
  weather: "https://gist.githubusercontent.com/toybox917-cell/95124527b68524c2b4d551c7cbb5a14b/raw",
  ranking: "https://gist.githubusercontent.com/toybox917-cell/c344ff836842c63913079d0a3637f1fb/raw",
  weekly:  "https://raw.githubusercontent.com/toybox917-cell/kokorobi/main/weekly.txt",
  monthly: "https://raw.githubusercontent.com/toybox917-cell/kokorobi/main/monthly.txt",
};

// リポ内の同名ファイルがあればそれを最優先に使う
function preferLocal(path, fallbackUrl) {
  if (existsSync(path)) return { type: "local", ref: path };
  return { type: "url", ref: fallbackUrl };
}

const SRC_PREF = {
  daily:   preferLocal("daily.txt",   SOURCE.daily),
  weather: preferLocal("eto-ranking.txt", SOURCE.weather), // 互換名そのまま維持
  ranking: preferLocal("ranking.txt", SOURCE.ranking),
  weekly:  preferLocal("weekly.txt",  SOURCE.weekly),
  monthly: preferLocal("monthly.txt", SOURCE.monthly),
};

// ---------- util ----------
async function fetchText(url){
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("fetch fail");
  return r.text();
}
const readMaybe = p => existsSync(p) ? readFileSync(p, "utf8") : "";

const pad = n => String(n).padStart(2,"0");

// 干支（日柱）
function etoOf(y,m,d){
  const T=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"], Z=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const a=Math.floor((14-m)/12); y=y+4800-a; m=m+12*a-3;
  const j=d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  return T[(j+9)%10]+Z[(j+1)%12];
}
// 月相
function moonEmoji(date){
  const syn=29.530588853, base=new Date(Date.UTC(2000,0,6,18,14));
  const diff=(date-base)/86400000, ph=((diff%syn)+syn)%syn;
  if(ph<1.5)return"🌑"; if(ph<6)return"🌒"; if(ph<8)return"🌓"; if(ph<14)return"🌔";
  if(ph<16)return"🌕"; if(ph<21)return"🌖"; if(ph<23)return"🌗"; return"🌘";
}
// 十干→五行
function elementFromStem(stem){
  if("甲乙".includes(stem)) return "木";
  if("丙丁".includes(stem)) return "火";
  if("戊己".includes(stem)) return "土";
  if("庚辛".includes(stem)) return "金";
  return "水"; // 壬癸
}
// 地支→五行
const branchElem = {子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水"};
const branchEmoji = {子:"🐭",丑:"🐮",寅:"🐯",卯:"🐰",辰:"🐲",巳:"🐍",午:"🐴",未:"🐑",申:"🐵",酉:"🐔",戌:"🐶",亥:"🐗"};
const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

// 相生サイクル
const order=["木","火","土","金","水"];
const genNext = e => order[(order.indexOf(e)+1)%5];      // e が 生む → 次
const genPrev = e => order[(order.indexOf(e)+4)%5];      // e を 生む ← 前

// 日替わり乱数（シード固定）
function seededRand(seed){ let x = Math.sin(seed)*10000; return x - Math.floor(x); }
function daySeed(Y,M,D,extra=0){ return Y*10000+M*100+D+extra; }

// 今日の色（五行×曜日ローテ）
function luckyColorByElement(elem, weekday){
  const colors = {
    "木": ["#2ecc71","#27ae60","#1abc9c","#16a085","#23b27e","#3bd199","#2fa36b"],
    "火": ["#e74c3c","#ff7a59","#ff6b81","#ff9f43","#e67e22","#e85d6a","#ff5e3a"],
    "土": ["#f1c40f","#f39c12","#d4a373","#c09f62","#b08968","#e1ad01","#dcb159"],
    "金": ["#ecf0f1","#bdc3c7","#f5f1e3","#f4d03f","#d1ccc0","#d4af37","#c0c0c0"],
    "水": ["#3498db","#2980b9","#6c5ce7","#34495e","#1f6feb","#3a86ff","#2b2d42"]
  };
  const list = colors[elem] || colors["水"];
  return list[weekday % list.length];
}

// 週／月 自動文
function autoWeekly(elem, moon){
  const tone = {
    "木": "芽を伸ばす“調律週間”。小さな成長を積み重ねて。",
    "火": "情熱を配る週。温度差に注意、火の粉は払って吉。",
    "土": "足場固め。予定を3つに絞るほど運が通る。",
    "金": "整える＆手放す。磨くほど光る週。",
    "水": "流れに乗る。しなやかに方向転換で開運。"
  }[elem];
  const moonHint = /🌕/.test(moon) ? "満ちた月。仕上げと発信が◎" :
                   /🌑/.test(moon) ? "新月期。始動と宣言が吉。" :
                   /🌓|🌗/.test(moon) ? "半月期。バランス調整にツキ。" :
                   "ゆるく満ち欠け。心身のリズムに耳を。";
  return `総評：${tone}\n月相：${moonHint}\n鍵：連絡・整頓・深呼吸`;
}
function autoMonthly(month, elem){
  const season = (month>=3&&month<=5)?"春":(month>=6&&month<=8)?"夏":(month>=9&&month<=11)?"秋":"冬";
  const guide = {
    "春": "芽吹き。新しい習慣を“1つだけ”増やす。",
    "夏": "熱を配分。頑張る所と休む所を分けて◎",
    "秋": "仕上げと収穫。記録と振り返りが財産に。",
    "冬": "蓄える月。体を温め、計画を磨く。"
  }[season];
  const elemLine = {
    "木": "木（伸びる力）：ストレッチ・学び日和。",
    "火": "火（広がる力）：発信の質を上げる。",
    "土": "土（整える力）：片づけが金運のカギ。",
    "金": "金（磨く力）：衣食住の“質”を1点更新。",
    "水": "水（つなぐ力）：対話と散歩で巡り良し。"
  }[elem];
  return `季節：${season}\n方針：${guide}\n五行ヒント：${elemLine}`;
}

// ▼ ランキング（雑誌カード風 HTML）を自動生成
function autoRankingHTML(dayElem, seedBase){
  const lines = [
    "勢いに乗れる。先手必勝。","ひらめき好調。短期決戦◎","信用が運を連れてくる。","調和運。聞き役が吉。",
    "堅実運。積み上げに福。","情報運。まずは連絡から。","ケジメで好転。切り替え力。","体調ケアで運気維持。",
    "焦らず整える日。","言葉選びを丁寧に。","準備が勝ち。下地づくり。","小さな優しさが大きな縁。"
  ];
  function scoreFor(branch, i){
    const be = branchElem[branch];
    let s = 70 + Math.floor(seededRand(seedBase+i)*21) - 10; // 60..80
    if (be === dayElem) s += 8;
    if (genNext(be) === dayElem) s += 5;
    if (genNext(dayElem) === be) s += 3;
    return Math.max(55, Math.min(99, s));
  }
  const picks = branches
    .map((b,i)=>({
      b, emoji: branchEmoji[b], elem: branchElem[b],
      score: scoreFor(b,i),
      msg: lines[(Math.floor(seededRand(seedBase+99)*lines.length)+i)%lines.length]
    }))
    .sort((a,b)=>b.score-a.score);

  return picks.map((o,idx)=>`
  <article class="rank-card">
    <div class="no">#${idx+1} ${o.b}（${o.emoji}）</div>
    <p>${o.msg}</p>
    <p class="meta">ラッキー：${o.elem}の気を入れる／小物１点</p>
  </article>`).join("");
}

// ---------- 時刻／日付 ----------
const now = new Date();
const jst = new Date(now.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
const Y=jst.getFullYear(), M=jst.getMonth()+1, D=jst.getDate(), H=jst.getHours(), Wn=jst.getDay();
const W=["日","月","火","水","木","金","土"][Wn];
const eto = etoOf(Y,M,D); const stem=eto[0]; const dayElem=elementFromStem(stem);
const moon = moonEmoji(new Date(`${Y}-${pad(M)}-${pad(D)}T00:00:00+09:00`));
const isNight = (H>=18||H<6);
const seasonColor = (M>=3&&M<=5)?"#b48ef7":(M>=6&&M<=8)?"#33a1ff":(M>=9&&M<=11)?"#cc7a42":"#6a8fbf";
const luckyColor = luckyColorByElement(dayElem, Wn);

// ---------- コンテンツ取得（ローカル優先 → URL → 自動文） ----------
async function getText(src, autoGen){
  if (src.type==="local"){
    const t=readMaybe(src.ref).trim();
    if (t) return t;
  }
  if (src.type==="url"){
    try{ const t=await fetchText(src.ref); if(t.trim()) return t; }catch{}
  }
  return autoGen();
}

const esc=s=>s.replace(/</g,"&lt;").replace(/>/g,"&gt;");

const dailyMsg   = await getText(SRC_PREF.daily,   ()=>"（今日の灯は準備中です）");
const weatherMsg = await getText(SRC_PREF.weather, ()=>"（宙の天気は準備中です）");

// ランキング：テキストがあればそのまま、無ければ HTML 自動生成
let rankingBlock;
{
  let text = await getText(SRC_PREF.ranking, ()=>"");
  if (text) {
    rankingBlock = `<pre class="daily">${esc(text)}</pre>`;
  } else {
    rankingBlock = `<div class="rank-grid">${autoRankingHTML(dayElem, daySeed(Y,M,D))}</div>`;
  }
}

const weeklyMsg  = await getText(SRC_PREF.weekly,  ()=>autoWeekly(dayElem, moon));
const monthlyMsg = await getText(SRC_PREF.monthly, ()=>autoMonthly(M, dayElem));

// ---------- HTML 出力 ----------
const bodyClass = isNight ? "night" : "day";
const html = `<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>心灯｜宙のリズム占い</title>
<meta name="description" content="毎日の“宙の天気”とメッセージ。週占い・月占い・今日の色・干支ランキング（自動更新）。">
<link rel="canonical" href="https://kokorobi.vercel.app/">
<meta property="og:type" content="website"><meta property="og:title" content="心灯｜宙のリズム占い">
<meta property="og:url" content="https://kokorobi.vercel.app/"><meta property="og:image" content="https://kokorobi.vercel.app/og.png">
<meta name="theme-color" content="${luckyColor}">
<style>
:root{ --accent:${seasonColor}; --lucky:${luckyColor}; --card:#12121a; --ink:#eaeaf2; --ink-soft:#cfd3ff; --ink-day:#222; --ink-day-soft:#333; --card-day:#f9f9fb; --card-day-border:#ccc; }
*{box-sizing:border-box} body{margin:0;background:#0a0a12;color:var(--ink);font-family:"Hiragino Sans","Yu Gothic",system-ui,-apple-system,sans-serif}
.sky{position:relative;text-align:center;padding:28px 14px 18px;overflow:hidden}
body.day .sky{background:linear-gradient(135deg,#f7f3ff,#eaf7ff)}
body.night .sky{background:radial-gradient(circle at 50% -10%,#23335a,#0b0f1a 60%)}
.moon{width:92px;height:92px;margin:10px auto 6px;border-radius:50%;animation:breathe 5.5s ease-in-out infinite;position:relative;z-index:2}
body.day .moon{background:radial-gradient(circle at 35% 35%,#ffe066,#f2c14e 60%,#b3862f 100%);box-shadow:0 0 26px rgba(255,214,82,.45)}
body.night .moon{background:radial-gradient(circle at 35% 35%,#e6f0ff,#a8c2ff 60%,#6f86d6 100%);box-shadow:0 0 30px rgba(120,160,255,.40),0 0 60px rgba(120,160,255,.20)}
@keyframes breathe{0%,100%{transform:scale(.96)}50%{transform:scale(1.06)}}
.ripple{position:absolute;top:50%;left:50%;width:92px;height:92px;transform:translate(-50%,-50%);border-radius:50%;z-index:1;pointer-events:none}
body.night .ripple::before, body.night .ripple::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(200,220,255,.35);animation:waveN 6s ease-in-out infinite}
body.night .ripple::after{animation-delay:3s}
@keyframes waveN{0%{transform:scale(1);opacity:.45}70%{opacity:.1}100%{transform:scale(3);opacity:0}}
body.day .ripple::before, body.day .ripple::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,225,120,.40);box-shadow:0 0 20px rgba(255,210,90,.22) inset;animation:waveD 7.5s ease-in-out infinite}
body.day .ripple::after{animation-delay:3.75s}
.stars{position:absolute;inset:0;pointer-events:none;opacity:.22}
body.night .stars{background:
 radial-gradient(1px 1px at 10% 25%,#fff,transparent 60%),
 radial-gradient(1px 1px at 22% 60%,#fff,transparent 60%),
 radial-gradient(1px 1px at 45% 35%,#fff,transparent 60%),
 radial-gradient(1px 1px at 70% 20%,#fff,transparent 60%),
 radial-gradient(1px 1px at 80% 70%,#fff,transparent 60%),
 radial-gradient(1px 1px at 60% 80%,#fff,transparent 60%);animation:twinkle 6s ease-in-out infinite}
@keyframes twinkle{0%,100%{opacity:.18}50%{opacity:.42}}
.title{font-size:1.6rem;margin:.2em 0 .25em}
.date,.info{margin:.2em 0 0}
.btn-ghost{appearance:none;background:#1118;border:1px solid #333;color:#dfe3ff;padding:6px 10px;border-radius:999px;font-size:.9rem}
main{max-width:820px;margin:22px auto;padding:0 16px}
section{background:var(--card);border:1px solid #222;border-radius:12px;padding:16px;margin:16px 0;box-shadow:0 2px 10px rgba(0,0,0,.35)}
h2{margin:.2em 0 .6em;font-size:1.1rem;border-left:6px solid var(--accent);padding-left:.5em}
.daily{white-space:pre-wrap;line-height:1.85}
footer{text-align:center;color:#aaa;font-size:.85rem;margin:28px 0}

/* ===== 雑誌カード風 ランキング ===== */
.rank-grid{display:grid;grid-template-columns:1fr;gap:10px}
.rank-card{background:#0f0f16;border:1px solid #23232f;border-radius:10px;padding:12px}
.rank-card .no{font-weight:700;margin-bottom:4px;color:var(--ink-soft)}
.rank-card p{margin:.35em 0 0;line-height:1.6}
.rank-card .meta{color:#9aa0bf;font-size:.92rem}

/* ===== 🌸 今日の運勢カラー レジェンド（行間詰め） ===== */
.color-legend{ list-style:none; padding:0; margin:8px 0 0 0;}
.color-legend li{ background:#0f0f16; border:1px solid #222; border-radius:12px; padding:8px 12px; margin:8px 0;}
.color-legend .row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap}
.color-legend .dots{ display:flex; gap:6px; align-items:center }
.color-legend .sw{ width:18px; height:18px; border-radius:50%; box-shadow:0 0 12px var(--lucky); }
.color-legend .meta b{ margin-right:4px}
.color-explain{ line-height:1.7; margin:10px 0 2px 0; color:#cfd3ff}
@media (max-width:420px){ .color-legend .row{ gap:8px } }
@media (prefers-reduced-motion: reduce){ .moon{animation:none} .ripple::before,.ripple::after{animation:none} .stars{animation:none} }

/* ===== 昼モード見やすさ（文字・カード・枠） ===== */
body.day{ color: var(--ink-day); }
body.day section{ background: var(--card-day); color: var(--ink-day); border-color: var(--card-day-border); }
body.day h2{ border-left-color: var(--accent); color:#111 }
body.day .daily{ color:#111; }
body.day .rank-card{ background:#fff; border-color:#e6e6e6; }
body.day .rank-card .meta{ color:#667 }
body.day .color-explain{ color:#555 }
</style></head>

<body class="${bodyClass}">
<header>
  <div class="sky">
    <div class="stars"></div>
    <div class="ripple"></div>
    <div class="moon" aria-hidden="true"></div>
    <h1 class="title">心灯｜宙のリズム占い</h1>
    <p class="date">本日：${Y}年${M}月${D}日（${W}）</p>
    <p class="info">干支日：${eto}（五行：${dayElem}）　今夜の月：${moon}</p>
    <button id="ambBtn" class="btn-ghost" type="button">宇宙の呼吸：OFF</button>
  </div>
</header>

<main>
  <section><h2>🌕 今日の灯</h2><div class="daily">${esc(dailyMsg)}</div></section>

  <section><h2>🎨 今日の色</h2>
    <div class="color-card">
      <div class="row">
        <div class="dots">
          <span class="sw" style="background:${luckyColor}"></span>
          <span class="sw" style="background:${luckyColor}90"></span>
          <span class="sw" style="background:${luckyColor}55"></span>
        </div>
        <div class="meta"><b>カラー</b><code>${luckyColor}</code>（五行：${dayElem}）</div>
      </div>
    </div>
    <div class="daily color-explain">
      五行に基づいて、その日の「巡り」を整える色です。<br>
      色は飾りではなく、心と環境の“調律キー”。必要なら身につける／画面に映す／ノートに一筆でOK。
    </div>
    <ul class="color-legend">
      <li><div class="row"><div class="dots">
        <span class="sw" style="background:#2ecc71"></span><span class="sw" style="background:#27ae60"></span><span class="sw" style="background:#1abc9c"></span>
      </div><div class="meta"><b>木：</b>#2ecc71 — 成長・発展・優しさ。</div></div></li>
      <li><div class="row"><div class="dots">
        <span class="sw" style="background:#e74c3c"></span><span class="sw" style="background:#ff7a59"></span><span class="sw" style="background:#e67e22"></span>
      </div><div class="meta"><b>火：</b>#e74c3c — 行動・情熱・勇気。</div></div></li>
      <li><div class="row"><div class="dots">
        <span class="sw" style="background:#f1c40f"></span><span class="sw" style="background:#f39c12"></span><span class="sw" style="background:#d4a373"></span>
      </div><div class="meta"><b>土：</b>#f1c40f — 安定・整える力。</div></div></li>
      <li><div class="row"><div class="dots">
        <span class="sw" style="background:#ecf0f1"></span><span class="sw" style="background:#d4af37"></span><span class="sw" style="background:#bdc3c7"></span>
      </div><div class="meta"><b>金：</b>#ecf0f1 — 洗練・手放し・磨く。</div></div></li>
      <li><div class="row"><div class="dots">
        <span class="sw" style="background:#3498db"></span><span class="sw" style="background:#2980b9"></span><span class="sw" style="background:#34495e"></span>
      </div><div class="meta"><b>水：</b>#3498db — つながり・巡り。</div></div></li>
    </ul>
  </section>

  <section><h2>🪐 宙の天気（干支×五行）</h2><div class="daily">${esc(weatherMsg)}</div></section>
  <section><h2>📅 週間の宙便り</h2><div class="daily">${esc(weeklyMsg)}</div></section>
  <section><h2>🌗 今月のリズム</h2><div class="daily">${esc(monthlyMsg)}</div></section>
  <section><h2>🌠 干支ランキング</h2>${rankingBlock}</section>
</main>

<footer>© 心灯 – 宙のリズム占い</footer>

<script>
// 宇宙の呼吸（アンビエントON/OFF）
(()=>{let ctx,gain,osc,lfo,lfoGain;const btn=document.getElementById('ambBtn');
function ensure(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();
gain=ctx.createGain();gain.gain.value=0.0001;osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=110;
lfo=ctx.createOscillator();lfo.type='sine';lfo.frequency.value=0.08;lfoGain=ctx.createGain();lfoGain.gain.value=0.15;
lfo.connect(lfoGain).connect(gain.gain);osc.connect(gain).connect(ctx.destination);osc.start();lfo.start();}
btn.addEventListener('click',async()=>{ensure();if(ctx.state==='suspended')await ctx.resume();
const on=btn.dataset.playing==='1';if(on){gain.gain.setTargetAtTime(0.0001,ctx.currentTime,0.8);btn.dataset.playing='0';btn.textContent='宇宙の呼吸：OFF';}
else{gain.gain.setTargetAtTime(0.06,ctx.currentTime,1.2);btn.dataset.playing='1';btn.textContent='宇宙の呼吸：ON';}});})();
</script>
</body></html>`;

writeFileSync("index.html", html, "utf8");
console.log("index.html generated ✅");
