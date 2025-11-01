// build.mjs — 心灯｜完全版 + クイック占いフォーム
// Node18+ / GitHub Actions (JST)

import { writeFileSync, existsSync, readFileSync } from "node:fs";

// ====== ソース定義 ======
const SOURCE = {
  daily:   "https://gist.githubusercontent.com/toybox917-cell/5cc5efcc825f7cc57f0e7b49ff9dc7c5/raw",
  weather: "https://gist.githubusercontent.com/toybox917-cell/95124527b68524c2b4d551c7cbb5a14b/raw",
  ranking: "https://gist.githubusercontent.com/toybox917-cell/c344ff836842c63913079d0a3637f1fb/raw",
  weekly:  "https://raw.githubusercontent.com/toybox917-cell/kokorobi/main/weekly.txt",
  monthly: "https://raw.githubusercontent.com/toybox917-cell/kokorobi/main/monthly.txt",
};

function preferLocal(path, fallbackUrl){ return existsSync(path) ? {type:"local",ref:path} : {type:"url",ref:fallbackUrl}; }

const SRC_PREF = {
  daily:   preferLocal("daily.txt",   SOURCE.daily),
  weather: preferLocal("eto-ranking.txt", SOURCE.weather),
  ranking: preferLocal("ranking.txt", SOURCE.ranking),
  weekly:  preferLocal("weekly.txt",  SOURCE.weekly),
  monthly: preferLocal("monthly.txt", SOURCE.monthly),
};

// ---------- util ----------
async function fetchText(url){ const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw 0; return r.text(); }
const readMaybe = p => existsSync(p) ? readFileSync(p,"utf8") : "";
const pad = n => String(n).padStart(2,"0");

// 干支・五行
function etoOf(y,m,d){
  const T=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"], Z=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const a=Math.floor((14-m)/12); y=y+4800-a; m=m+12*a-3;
  const j=d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  // 年干支は簡易式（十分実用）
  const year = T[(j+9)%10]+Z[(y-4800+a+8)%12];
  const day  = T[(j+9)%10]+Z[(j+1)%12];
  return {year,day};
}
function elementFromStem(stem){
  if("甲乙".includes(stem)) return "木";
  if("丙丁".includes(stem)) return "火";
  if("戊己".includes(stem)) return "土";
  if("庚辛".includes(stem)) return "金";
  return "水";
}
const branchElem={子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水"};
const branchEmoji={子:"🐭",丑:"🐮",寅:"🐯",卯:"🐰",辰:"🐲",巳:"🐍",午:"🐴",未:"🐑",申:"🐵",酉:"🐔",戌:"🐶",亥:"🐗"};
const branches=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

// 月相
function moonEmoji(date){
  const syn=29.530588853, base=new Date(Date.UTC(2000,0,6,18,14));
  const diff=(date-base)/86400000, ph=((diff%syn)+syn)%syn;
  if(ph<1.5)return"🌑"; if(ph<6)return"🌒"; if(ph<8)return"🌓"; if(ph<14)return"🌔";
  if(ph<16)return"🌕"; if(ph<21)return"🌖"; if(ph<23)return"🌗"; return"🌘";
}

// 五行カラー
function luckyColorByElement(elem, weekday){
  const colors={
    "木":["#2ecc71","#27ae60","#1abc9c","#16a085"],
    "火":["#e74c3c","#ff7a59","#ff6b81","#e67e22"],
    "土":["#f1c40f","#f39c12","#d4a373","#c09f62"],
    "金":["#ecf0f1","#d4af37","#bdc3c7","#c0c0c0"],
    "水":["#3498db","#2980b9","#34495e","#3a86ff"]
  };
  const list = colors[elem] || colors["水"];
  return list[weekday % list.length];
}
const order=["木","火","土","金","水"];
const genNext=e=>order[(order.indexOf(e)+1)%5];
const genPrev=e=>order[(order.indexOf(e)+4)%5];

// ランキング自動
function autoRankingHTML(dayElem, seedBase){
  function seededRand(seed){ let x=Math.sin(seed)*10000; return x-Math.floor(x); }
  function scoreFor(branch,i){
    const be=branchElem[branch];
    let s=70+Math.floor(seededRand(seedBase+i)*21)-10;
    if(be===dayElem) s+=8;
    if(genNext(be)===dayElem) s+=5;
    if(genNext(dayElem)===be) s+=3;
    return Math.max(55,Math.min(99,s));
  }
  const lines=[
    "勢いに乗れる。先手必勝。","ひらめき好調。短期決戦◎","信用が運を連れてくる。","調和運。聞き役が吉。",
    "堅実運。積み上げに福。","情報運。まずは連絡から。","ケジメで好転。切り替え力。","体調ケアで運気維持。",
    "焦らず整える日。","言葉選びを丁寧に。","準備が勝ち。下地づくり。","小さな優しさが大きな縁。"
  ];
  const picks=branches.map((b,i)=>({
    b,emoji:branchEmoji[b],elem:branchElem[b],
    score:scoreFor(b,i),
    msg:lines[(Math.floor(seededRand(seedBase+99)*lines.length)+i)%lines.length]
  })).sort((a,b)=>b.score-a.score);

  return picks.map((o,idx)=>`
    <article class="rank-card">
      <div class="no">#${idx+1} ${o.b}（${o.emoji}）</div>
      <p>${o.msg}</p>
      <p class="meta">ラッキー：${o.elem}の気を入れる／小物１点</p>
    </article>`).join("");
}

// 週/月 自動文
function autoWeekly(elem, moon){
  const tone={
    "木":"芽を伸ばす“調律週間”。小さな成長を積み重ねて。",
    "火":"情熱を配る週。温度差に注意、火の粉は払って吉。",
    "土":"足場固め。予定を3つに絞るほど運が通る。",
    "金":"整える＆手放す。磨くほど光る週。",
    "水":"流れに乗る。しなやかに方向転換で開運。"
  }[elem];
  const moonHint=/🌕/.test(moon)?"満ちた月。仕上げと発信が◎":/🌑/.test(moon)?"新月期。始動と宣言が吉。":/🌓|🌗/.test(moon)?"半月期。バランス調整にツキ。":"ゆるく満ち欠け。心身のリズムに耳を。";
  return `総評：${tone}\n月相：${moonHint}\n鍵：連絡・整頓・深呼吸`;
}
function autoMonthly(month, elem){
  const season=(month>=3&&month<=5)?"春":(month>=6&&month<=8)?"夏":(month>=9&&month<=11)?"秋":"冬";
  const guide={春:"芽吹き。新しい習慣を“1つだけ”増やす。",夏:"熱を配分。頑張る所と休む所を分けて◎",秋:"仕上げと収穫。記録と振り返りが財産に。",冬:"蓄える月。体を温め、計画を磨く。"}[season];
  const elemLine={"木":"木（伸びる力）：ストレッチ・学び日和。","火":"火（広がる力）：発信の質を上げる。","土":"土（整える力）：片づけが金運のカギ。","金":"金（磨く力）：衣食住の“質”を1点更新。","水":"水（つなぐ力）：対話と散歩で巡り良し。"}[elem];
  return `季節：${season}\n方針：${guide}\n五行ヒント：${elemLine}`;
}

// ---------- 時刻／取得 ----------
const now=new Date();
const jst=new Date(now.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
const Y=jst.getFullYear(), M=jst.getMonth()+1, D=jst.getDate(), H=jst.getHours(), Wn=jst.getDay();
const W=["日","月","火","水","木","金","土"][Wn];
const {day:todayEtoStr}=etoOf(Y,M,D); const dayElem=elementFromStem(todayEtoStr[0]);
const moon=moonEmoji(new Date(`${Y}-${pad(M)}-${pad(D)}T00:00:00+09:00`));
const isNight=(H>=18||H<6);
const seasonColor=(M>=3&&M<=5)?"#b48ef7":(M>=6&&M<=8)?"#33a1ff":(M>=9&&M<=11)?"#cc7a42":"#6a8fbf";
const luckyColor=luckyColorByElement(dayElem,Wn);

async function getText(src,autoGen){
  if(src.type==="local"){ const t=readMaybe(src.ref).trim(); if(t) return t; }
  if(src.type==="url"){ try{ const t=await fetchText(src.ref); if(t.trim()) return t; }catch{} }
  return autoGen();
}
const esc=s=>s.replace(/</g,"&lt;").replace(/>/g,"&gt;");
const dailyMsg   = await getText(SRC_PREF.daily,   ()=>"（今日の灯は準備中です）");
const weatherMsg = await getText(SRC_PREF.weather, ()=>"（宙の天気は準備中です）");

let rankingBlock;
{
  const text = await getText(SRC_PREF.ranking, ()=>"");
  rankingBlock = text ? `<pre class="daily">${esc(text)}</pre>`
                      : `<div class="rank-grid">${autoRankingHTML(dayElem, Y*10000+M*100+D)}</div>`;
}
const weeklyMsg  = await getText(SRC_PREF.weekly,  ()=>autoWeekly(dayElem,moon));
const monthlyMsg = await getText(SRC_PREF.monthly, ()=>autoMonthly(M,dayElem));

// ---------- HTML ----------
const bodyClass=isNight?"night":"day";
const html=`<!DOCTYPE html><html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>心灯｜宙のリズム占い</title>
<meta name="description" content="毎日の“宙の天気”とメッセージ。週占い・月占い・今日の色・干支ランキング。生年月日入力のクイック占いも。">
<link rel="canonical" href="https://kokorobi.vercel.app/">
<meta property="og:type" content="website"><meta property="og:title" content="心灯｜宙のリズム占い">
<meta property="og:url" content="https://kokorobi.vercel.app/"><meta property="og:image" content="https://kokorobi.vercel.app/og.png">
<meta name="theme-color" content="${luckyColor}">
<style>
:root{--accent:${seasonColor};--lucky:${luckyColor};--card:#12121a;--ink:#eaeaf2;--ink-soft:#cfd3ff;--ink-day:#222;--card-day:#f9f9fb;--card-day-border:#ccc}
*{box-sizing:border-box}body{margin:0;background:#0a0a12;color:var(--ink);font-family:"Hiragino Sans","Yu Gothic",system-ui,-apple-system,sans-serif}
.sky{position:relative;text-align:center;padding:28px 14px 18px;overflow:hidden}
body.day .sky{background:linear-gradient(135deg,#f7f3ff,#eaf7ff)}
body.night .sky{background:radial-gradient(circle at 50% -10%,#23335a,#0b0f1a 60%)}
.moon{width:92px;height:92px;margin:10px auto 6px;border-radius:50%;animation:breathe 5.5s ease-in-out infinite}
body.day .moon{background:radial-gradient(circle at 35% 35%,#ffe066,#f2c14e 60%,#b3862f 100%);box-shadow:0 0 26px rgba(255,214,82,.45)}
body.night .moon{background:radial-gradient(circle at 35% 35%,#e6f0ff,#a8c2ff 60%,#6f86d6 100%);box-shadow:0 0 30px rgba(120,160,255,.40),0 0 60px rgba(120,160,255,.20)}
@keyframes breathe{0%,100%{transform:scale(.96)}50%{transform:scale(1.06)}}
.title{font-size:1.6rem;margin:.2em 0 .25em}
.btn-ghost{appearance:none;background:#1118;border:1px solid #333;color:#dfe3ff;padding:6px 10px;border-radius:999px;font-size:.9rem}
main{max-width:820px;margin:22px auto;padding:0 16px}
section{background:var(--card);border:1px solid #222;border-radius:12px;padding:16px;margin:16px 0;box-shadow:0 2px 10px rgba(0,0,0,.35)}
h2{margin:.2em 0 .6em;font-size:1.1rem;border-left:6px solid var(--accent);padding-left:.5em}
.daily{white-space:pre-wrap;line-height:1.85}
footer{text-align:center;color:#aaa;font-size:.85rem;margin:28px 0}

/* ランキング */
.rank-grid{display:grid;grid-template-columns:1fr;gap:10px}
.rank-card{background:#0f0f16;border:1px solid #23232f;border-radius:10px;padding:12px}
.rank-card .no{font-weight:700;margin-bottom:4px;color:var(--ink-soft)}
.rank-card p{margin:.35em 0 0;line-height:1.6}
.rank-card .meta{color:#9aa0bf;font-size:.92rem}

/* 今日の色（昼読みやすさ） */
.color-legend{list-style:none;padding:0;margin:10px 0 0}
.color-legend li{background:#0f0f16;border:1px solid #292939;border-radius:12px;padding:10px 14px;margin:10px 0;color:#dce0f8}
.color-legend .row{display:flex;align-items:center;gap:12px}
.color-legend .dots{display:flex;gap:8px}
.color-legend .sw{width:18px;height:18px;border-radius:50%;box-shadow:0 0 10px var(--lucky)}
body.day section{background:var(--card-day);color:var(--ink-day);border-color:var(--card-day-border)}
body.day .rank-card{background:#fff;border-color:#e6e6e6}
body.day .daily{color:#111}

/* 🧭 クイック占い（フォーム） */
#quick-fortune form{display:grid;grid-template-columns:1fr;gap:10px}
#quick-fortune label{display:flex;flex-direction:column;gap:6px;font-size:.95rem}
#quick-fortune input{appearance:none;border:1px solid #333;border-radius:8px;background:#0f0f16;color:#e8ebff;padding:10px}
#quick-fortune button{justify-self:start}
body.day #quick-fortune input{background:#fff;color:#222;border-color:#ddd}
#fOut{background:#0f0f16;border:1px solid #23232f;border-radius:10px;padding:12px}
body.day #fOut{background:#fff;border-color:#e6e6e6;color:#222}
</style></head>

<body class="${bodyClass}">
  <header>
    <div class="sky">
      <div class="moon" aria-hidden="true"></div>
      <h1 class="title">心灯｜宙のリズム占い</h1>
      <p>本日：${Y}年${M}月${D}日（${W}）／ 干支日：${todayEtoStr}（五行：${dayElem}）／ 今夜の月：${moon}</p>
      <button id="ambBtn" class="btn-ghost" type="button">宇宙の呼吸：OFF</button>
    </div>
  </header>

  <main>
    <section><h2>🌕 今日の灯</h2><div class="daily">${esc(dailyMsg)}</div></section>

    <section><h2>🎨 今日の色</h2>
      <div class="daily">カラー <code>${luckyColor}</code>（五行：${dayElem}）</div>
      <ul class="color-legend">
        <li><div class="row"><div class="dots">
          <span class="sw" style="background:#2ecc71"></span><span class="sw" style="background:#27ae60"></span><span class="sw" style="background:#1abc9c"></span>
        </div><div class="meta"><b>木</b> — 成長・発展・優しさ。</div></div></li>
        <li><div class="row"><div class="dots">
          <span class="sw" style="background:#e74c3c"></span><span class="sw" style="background:#ff7a59"></span><span class="sw" style="background:#e67e22"></span>
        </div><div class="meta"><b>火</b> — 行動・情熱・勇気。</div></div></li>
        <li><div class="row"><div class="dots">
          <span class="sw" style="background:#f1c40f"></span><span class="sw" style="background:#f39c12"></span><span class="sw" style="background:#d4a373"></span>
        </div><div class="meta"><b>土</b> — 安定・整える力。</div></div></li>
        <li><div class="row"><div class="dots">
          <span class="sw" style="background:#ecf0f1"></span><span class="sw" style="background:#d4af37"></span><span class="sw" style="background:#bdc3c7"></span>
        </div><div class="meta"><b>金</b> — 洗練・手放し・磨く。</div></div></li>
        <li><div class="row"><div class="dots">
          <span class="sw" style="background:#3498db"></span><span class="sw" style="background:#2980b9"></span><span class="sw" style="background:#34495e"></span>
        </div><div class="meta"><b>水</b> — つながり・巡り。</div></div></li>
      </ul>
    </section>

    <!-- 🧭 クイック占い -->
    <section id="quick-fortune">
      <h2>🧭 生年月日でクイック占い</h2>
      <form id="fForm">
        <label>生年月日：<input type="date" id="bday" required></label>
        <label>誕生時間（任意）：<input type="time" id="btime"></label>
        <label>お名前（任意）：<input type="text" id="uname" placeholder="ニックネームOK"></label>
        <button class="btn-ghost" type="submit">占う</button>
      </form>
      <div id="fOut" class="daily" style="margin-top:12px;"></div>
    </section>

    <section><h2>🪐 宙の天気（干支×五行）</h2><div class="daily">${esc(weatherMsg)}</div></section>
    <section><h2>📅 週間の宙便り</h2><div class="daily">${esc(weeklyMsg)}</div></section>
    <section><h2>🌗 今月のリズム</h2><div class="daily">${esc(monthlyMsg)}</div></section>
    <section><h2>🌠 干支ランキング</h2>${rankingBlock}</section>
  </main>

  <footer>© 心灯 – 宙のリズム占い</footer>

  <script>
  // 宇宙の呼吸
  (()=>{let ctx,gain,osc,lfo,lfoGain;const btn=document.getElementById('ambBtn');
    function ensure(){ if(ctx) return; const AC=window.AudioContext||window.webkitAudioContext; ctx=new AC();
      gain=ctx.createGain(); gain.gain.value=0.0001;
      osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.value=110;
      lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.08;
      lfoGain=ctx.createGain(); lfoGain.gain.value=0.15;
      lfo.connect(lfoGain).connect(gain.gain); osc.connect(gain).connect(ctx.destination); osc.start(); lfo.start();}
    btn.addEventListener('click', async ()=>{ ensure(); if(ctx.state==='suspended') await ctx.resume();
      const on=btn.dataset.playing==='1';
      if(on){ gain.gain.setTargetAtTime(0.0001,ctx.currentTime,0.8); btn.dataset.playing='0'; btn.textContent='宇宙の呼吸：OFF'; }
      else { gain.gain.setTargetAtTime(0.06,ctx.currentTime,1.2); btn.dataset.playing='1'; btn.textContent='宇宙の呼吸：ON'; }
    });
  })();

  // 🧭 クイック占い（軽量ロジック）
  (()=>{
    const order=["木","火","土","金","水"];
    const genNext=e=>order[(order.indexOf(e)+1)%5];
    const genPrev=e=>order[(order.indexOf(e)+4)%5];
    const branchEmoji={子:"🐭",丑:"🐮",寅:"🐯",卯:"🐰",辰:"🐲",巳:"🐍",午:"🐴",未:"🐑",申:"🐵",酉:"🐔",戌:"🐶",亥:"🐗"};

    function etoOfClient(y,m,d){
      const T=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"], Z=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
      const a=Math.floor((14-m)/12); y=y+4800-a; m=m+12*a-3;
      const j=d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
      return {year:T[(j+9)%10]+Z[(y-4800+a+8)%12], day:T[(j+9)%10]+Z[(j+1)%12]};
    }
    function elementFromStem(stem){
      if("甲乙".includes(stem)) return "木";
      if("丙丁".includes(stem)) return "火";
      if("戊己".includes(stem)) return "土";
      if("庚辛".includes(stem)) return "金";
      return "水";
    }
    function luckyColorByElement(elem, weekday){
      const colors={"木":["#2ecc71","#27ae60","#1abc9c"],"火":["#e74c3c","#ff7a59","#e67e22"],"土":["#f1c40f","#f39c12","#d4a373"],"金":["#ecf0f1","#d4af37","#bdc3c7"],"水":["#3498db","#2980b9","#34495e"]};
      const list=colors[elem]||colors["水"]; return list[weekday%list.length];
    }
    function moonEmoji(d){
      const syn=29.530588853, base=new Date(Date.UTC(2000,0,6,18,14));
      const diff=(d-base)/86400000, ph=((diff%syn)+syn)%syn;
      if(ph<1.5)return"🌑"; if(ph<6)return"🌒"; if(ph<8)return"🌓"; if(ph<14)return"🌔";
      if(ph<16)return"🌕"; if(ph<21)return"🌖"; if(ph<23)return"🌗"; return"🌘";
    }

    document.getElementById("fForm").addEventListener("submit", e=>{
      e.preventDefault();
      const val=document.getElementById("bday").value; if(!val) return;
      const nm=(document.getElementById("uname").value.trim()||"あなた");
      const dt=new Date(val+"T00:00:00");
      const y=dt.getFullYear(), m=dt.getMonth()+1, d=dt.getDate();
      const {year,day}=etoOfClient(y,m,d);
      const yearStem=year[0], yearBranch=year[1];
      const birthElem=elementFromStem(yearStem);
      const birthEmoji=branchEmoji[yearBranch];

      const t=new Date(); const tE=etoOfClient(t.getFullYear(),t.getMonth()+1,t.getDate()).day;
      const todayElem=elementFromStem(tE[0]);

      let compat="△";
      if(birthElem===todayElem) compat="◎";
      else if(genNext(birthElem)===todayElem || genPrev(birthElem)===todayElem) compat="○";

      const col=luckyColorByElement(birthElem, t.getDay());
      const moon=moonEmoji(new Date());

      const out=
`【基本】${nm}の年干支：${year}（${birthEmoji}）／五行：${birthElem}
【今日との相性】今日の五行：${todayElem} → 相性：${compat}
【今日の色】${col}
【月相】${moon} ひとこと：${
  /🌕/.test(moon)?"仕上げ＆発信に◎":/🌑/.test(moon)?"静かに始動。宣言吉。":/🌓|🌗/.test(moon)?"バランス調整。":"ゆるく巡りに乗る日。"
}

ヒント：
・${birthElem==="木"?"のびのび“1つだけ”増やす":"要らないものを1つ手放す"}
・連絡／整頓／深呼吸 の“3点セット”で運の通り道を作る`;
      document.getElementById("fOut").textContent=out;
    });
  })();
  </script>
</body></html>`;

writeFileSync("index.html", html, "utf8");
console.log("index.html generated ✅");
