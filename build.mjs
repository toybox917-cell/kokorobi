<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>心灯｜宙のリズム占い</title>
<meta name="description" content="毎日の“宙の天気”とメッセージ。週占い・月占い・今日の色・干支ランキング（自動更新）。">
<link rel="canonical" href="https://kokorobi.vercel.app/">
<meta property="og:type" content="website"><meta property="og:title" content="心灯｜宙のリズム占い">
<meta property="og:url" content="https://kokorobi.vercel.app/"><meta property="og:image" content="https://kokorobi.vercel.app/og.png">
<style>
:root{ --accent:#7fa7ff; --lucky:#2fa36b; --card:#12121a; --ink:#eaeaf2; --ink-soft:#cfd3ff; --ink-day:#222; --card-day:#f9f9fb; --card-day-border:#ccc; }
*{box-sizing:border-box} body{margin:0;background:#0a0a12;color:var(--ink);font-family:"Hiragino Sans","Yu Gothic",system-ui,-apple-system,sans-serif}
.sky{position:relative;text-align:center;padding:28px 14px 18px;overflow:hidden;background:radial-gradient(circle at 50% -10%,#23335a,#0b0f1a 60%)}
.moon{width:92px;height:92px;margin:10px auto 6px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#e6f0ff,#a8c2ff 60%,#6f86d6 100%);box-shadow:0 0 30px rgba(120,160,255,.40),0 0 60px rgba(120,160,255,.20);animation:breathe 5.5s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:scale(.96)}50%{transform:scale(1.06)}}
.title{font-size:1.6rem;margin:.2em 0 .25em}
.date,.info{margin:.2em 0 0}
.btn-ghost{appearance:none;background:#1118;border:1px solid #333;color:#dfe3ff;padding:6px 10px;border-radius:999px;font-size:.9rem}
main{max-width:820px;margin:22px auto;padding:0 16px}
section{background:var(--card);border:1px solid #222;border-radius:12px;padding:16px;margin:16px 0;box-shadow:0 2px 10px rgba(0,0,0,.35)}
h2{margin:.2em 0 .6em;font-size:1.1rem;border-left:6px solid var(--accent);padding-left:.5em}
.daily{white-space:pre-wrap;line-height:1.85}
footer{text-align:center;color:#aaa;font-size:.85rem;margin:28px 0}

/* ランキング（カード風） */
.rank-grid{display:grid;grid-template-columns:1fr;gap:10px}
.rank-card{background:#0f0f16;border:1px solid #23232f;border-radius:10px;padding:12px}
.rank-card .no{font-weight:700;margin-bottom:4px;color:var(--ink-soft)}
.rank-card p{margin:.35em 0 0;line-height:1.6}
.rank-card .meta{color:#9aa0bf;font-size:.92rem}

/* 今日の色 */
.color-card{background:#0f0f16;border:1px solid #292939;border-radius:12px;padding:12px 14px;margin:8px 0 12px}
.color-card .row{display:flex;align-items:center;gap:12px}
.color-card .dots{display:flex;gap:8px}
.color-card code{background:rgba(255,255,255,.08);padding:2px 6px;border-radius:6px}
.color-legend{list-style:none;padding:0;margin:10px 0 0}
.color-legend .row{display:flex;align-items:center;gap:12px}
.color-legend .dots{display:flex;gap:8px}
.color-explain{line-height:1.9}
.color-legend li{background:#0f0f16;border:1px solid #292939;border-radius:12px;padding:10px 14px;margin:10px 0;color:#dce0f8;box-shadow:0 0 6px rgba(0,0,0,.35)}
.color-legend .meta b{color:#fff;font-weight:600}
.color-legend .meta{color:#cbd1ee;font-size:.94rem;line-height:1.6}
.color-legend .sw{width:18px;height:18px;border-radius:50%;box-shadow:0 0 10px var(--lucky)}

/* フォーム */
#quick-fortune form{display:grid;gap:10px;grid-template-columns:1fr}
#quick-fortune label{display:flex;flex-direction:column;gap:6px;font-size:.98rem}
#quick-fortune input{appearance:none;border:1px solid #2a2a38;background:#0f0f16;color:#eaeaf2;border-radius:10px;padding:10px 12px}
#quick-fortune button{justify-self:start}
#fOut{background:#0f0f16;border:1px solid #23232f;border-radius:10px;padding:12px}
</style></head>
<body>
<header class="sky">
  <div class="moon"></div>
  <h1 class="title">心灯｜宙のリズム占い</h1>
  <p class="date" id="today"></p>
  <p class="info" id="info"></p>
  <button id="ambBtn" class="btn-ghost" type="button">宇宙の呼吸：OFF</button>
</header>

<main>
  <section><h2>🌕 今日の灯</h2><div class="daily" id="daily">（今日の灯は準備中です）</div></section>

  <section><h2>🎨 今日の色</h2>
    <div class="color-card"><div class="row">
      <div class="dots">
        <span class="sw" id="c1" style="background:#2fa36b"></span>
        <span class="sw" id="c2" style="background:#2fa36b90"></span>
        <span class="sw" id="c3" style="background:#2fa36b55"></span>
      </div>
      <div class="meta"><b>カラー</b><code id="cCode">#2fa36b</code>（五行：<span id="elem">木</span>）</div>
    </div></div>
    <div class="daily color-explain">
      五行に基づいて、その日の「巡り」を整える色です。色は飾りではなく、心と環境の“調律キー”。必要なら身につける／画面に映す／ノートに一筆でOK。
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

  <!-- 🧭 生年月日クイック占い -->
  <section id="quick-fortune">
    <h2>🧭 生年月日でクイック占い</h2>
    <form id="fForm" autocomplete="on">
      <label>生年月日：<input type="date" id="bday" required></label>
      <label>誕生時間（任意）：<input type="time" id="btime"></label>
      <label>お名前（任意）：<input type="text" id="uname" placeholder="ニックネームOK"></label>
      <button class="btn-ghost" type="submit">占う</button>
    </form>
    <div id="fOut" class="daily" style="margin-top:12px;"></div>
  </section>

  <section><h2>🪐 宙の天気（干支×五行）</h2><div class="daily" id="weather">（宙の天気は準備中です）</div></section>
  <section><h2>📅 週間の宙便り</h2><div class="daily" id="weekly"></div></section>
  <section><h2>🌗 今月のリズム</h2><div class="daily" id="monthly"></div></section>
  <section><h2>🌠 干支ランキング</h2><div class="rank-grid" id="rank"></div></section>
</main>

<footer>© 心灯 – 宙のリズム占い</footer>

<script>
// ---- 小さなユーティリティ ----
const pad = n => String(n).padStart(2,"0");
function etoOf(y,m,d){const T=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"],Z=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];const a=Math.floor((14-m)/12);y=y+4800-a;m=m+12*a-3;const j=d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;return T[(j+9)%10]+Z[(j+1)%12]}
function elementFromStem(stem){if("甲乙".includes(stem))return"木";if("丙丁".includes(stem))return"火";if("戊己".includes(stem))return"土";if("庚辛".includes(stem))return"金";return"水"}
const branchElem={子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水"};
const branchEmoji={子:"🐭",丑:"🐮",寅:"🐯",卯:"🐰",辰:"🐲",巳:"🐍",午:"🐴",未:"🐑",申:"🐵",酉:"🐔",戌:"🐶",亥:"🐗"};
const branches=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const order=["木","火","土","金","水"];const genNext=e=>order[(order.indexOf(e)+1)%5];const genPrev=e=>order[(order.indexOf(e)+4)%5];
function seededRand(seed){let x=Math.sin(seed)*10000;return x-Math.floor(x)};function daySeed(Y,M,D,extra=0){return Y*10000+M*100+D+extra}
function moonEmoji(date){const syn=29.530588853, base=new Date(Date.UTC(2000,0,6,18,14));const diff=(date-base)/86400000, ph=((diff%syn)+syn)%syn;if(ph<1.5)return"🌑"; if(ph<6)return"🌒"; if(ph<8)return"🌓"; if(ph<14)return"🌔"; if(ph<16)return"🌕"; if(ph<21)return"🌖"; if(ph<23)return"🌗"; return"🌘"}
function luckyColorByElement(elem,weekday){const colors={"木":["#2ecc71","#27ae60","#1abc9c"],"火":["#e74c3c","#ff7a59","#e67e22"],"土":["#f1c40f","#f39c12","#d4a373"],"金":["#ecf0f1","#d4af37","#bdc3c7"],"水":["#3498db","#2980b9","#34495e"]};const list=colors[elem]||colors["水"];return list[weekday%list.length]}

// ---- ページ初期化（今日の情報 / ランキング簡易生成） ----
(function init(){
  const now = new Date(); const Y=now.getFullYear(), M=now.getMonth()+1, D=now.getDate();
  const Wn=now.getDay(), W="日月火水木金土"[Wn];
  const eto = etoOf(Y,M,D); const elem=elementFromStem(eto[0]); const col=luckyColorByElement(elem,Wn);
  document.getElementById("today").textContent = `本日：${Y}年${M}月${D}日（${W}）`;
  document.getElementById("info").textContent  = `干支日：${eto}（五行：${elem}）　今夜の月：${moonEmoji(new Date(`${Y}-${pad(M)}-${pad(D)}T00:00:00+09:00`))}`;
  document.getElementById("c1").style.background=col; document.getElementById("c2").style.background=col+"90"; document.getElementById("c3").style.background=col+"55";
  document.getElementById("cCode").textContent=col; document.getElementById("elem").textContent=elem;

  // ランキング（簡易）
  const seed=daySeed(Y,M,D); const grid=document.getElementById("rank"); grid.innerHTML="";
  const picks=branches.map((b,i)=>{const be=branchElem[b]; let s=70+Math.floor(seededRand(seed+i)*21)-10; if(be===elem)s+=8; if(genNext(be)===elem)s+=5; if(genNext(elem)===be)s+=3; s=Math.max(55,Math.min(99,s)); return {b,emoji:branchEmoji[b],elem:be,score:s}})
                      .sort((a,b)=>b.score-a.score);
  picks.forEach((o,idx)=>{const el=document.createElement("article"); el.className="rank-card"; el.innerHTML=`<div class="no">#${idx+1} ${o.b}（${o.emoji}）</div><p>運勢：${o.score}/100</p><p class="meta">ラッキー：${o.elem}の気を入れる／小物１点</p>`; grid.appendChild(el);});
})();

// ---- クイック占い（フォーム） ----
document.getElementById("fForm").addEventListener("submit", e=>{
  e.preventDefault();
  const d=document.getElementById("bday").value; if(!d) return;
  const nm=(document.getElementById("uname").value||"あなた").trim();
  const dt=new Date(d+"T00:00:00"); const y=dt.getFullYear(), m=dt.getMonth()+1, day=dt.getDate();
  const yearDay=etoOf(y,m,day); const yearStem=yearDay[0]; const birthElem=elementFromStem(yearStem);
  const today=new Date(); const todayElem=elementFromStem(etoOf(today.getFullYear(),today.getMonth()+1,today.getDate())[0]);
  let compat="△"; if(birthElem===todayElem) compat="◎"; else if(genNext(birthElem)===todayElem||genPrev(birthElem)===todayElem) compat="○";
  const col=luckyColorByElement(birthElem,today.getDay()); const moon=moonEmoji(new Date());
  const hint=/🌕/.test(moon)?"仕上げ＆発信に◎":(/🌑/.test(moon)?"静かに始動。宣言吉。":(/🌓|🌗/.test(moon)?"バランス調整。":"ゆるく巡りに乗る日。"));
  const out=`【基本】${nm}の年干支：${yearDay}／五行：${birthElem}
【今日との相性】今日の五行：${todayElem} → 相性：${compat}
【今日の色】${col}
【月相】${moon} ひとこと：${hint}

ヒント：
・${birthElem==="木"?"のびのび“1つだけ”増やす":"要らないものを1つ手放す"}
・連絡／整頓／深呼吸 の“3点セット”で運の通り道を作る`;
  document.getElementById("fOut").textContent=out;
});

// （おまけ）アンビエントON/OFF
(()=>{let ctx,gain,osc,lfo,lfoGain;const btn=document.getElementById('ambBtn');
function ensure(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();
gain=ctx.createGain();gain.gain.value=0.0001;osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=110;
lfo=ctx.createOscillator();lfo.type='sine';lfo.frequency.value=0.08;lfoGain=ctx.createGain();lfoGain.gain.value=0.15;
lfo.connect(lfoGain).connect(gain.gain);osc.connect(gain).connect(ctx.destination);osc.start();lfo.start();}
btn.addEventListener('click',async()=>{ensure();if(ctx.state==='suspended')await ctx.resume();
const on=btn.dataset.playing==='1';if(on){gain.gain.setTargetAtTime(0.0001,ctx.currentTime,0.8);btn.dataset.playing='0';btn.textContent='宇宙の呼吸：OFF';}
else{gain.gain.setTargetAtTime(0.06,ctx.currentTime,1.2);btn.dataset.playing='1';btn.textContent='宇宙の呼吸：ON';}});})();
</script>
</body></html>
