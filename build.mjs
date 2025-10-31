// build.mjs — 昼/夜テーマ自動切替（JST）+ Moon Breath + 自動コンテンツ
import { writeFileSync } from "node:fs";

// ---- コンテンツ元 ----
const SOURCE = {
  daily:   "https://gist.githubusercontent.com/toybox917-cell/5cc5efcc825f7cc57f0e7b49ff9dc7c5/raw",
  weather: "https://gist.githubusercontent.com/toybox917-cell/95124527b68524c2b4d551c7cbb5a14b/raw",
  ranking: "https://raw.githubusercontent.com/toybox917-cell/kokorobi/main/kokorobi/eto-ranking.txt"
};

// ---- util ----
async function fetchText(url){ const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error(url+" "+r.status); return r.text(); }
const pad = n=>String(n).padStart(2,"0");
function etoOf(y,m,d){ const T=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"], Z=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]; const a=Math.floor((14-m)/12); y=y+4800-a; m=m+12*a-3; const j=d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045; return T[(j+9)%10]+Z[(j+1)%12]; }
function moonEmoji(date){ const syn=29.530588853, base=new Date(Date.UTC(2000,0,6,18,14)); const diff=(date-base)/86400000, ph=((diff%syn)+syn)%syn; if(ph<1.5)return"🌑"; if(ph<6)return"🌒"; if(ph<8)return"🌓"; if(ph<14)return"🌔"; if(ph<16)return"🌕"; if(ph<21)return"🌖"; if(ph<23)return"🌗"; return"🌘"; }

// ---- now (JST) ----
const now=new Date();
const jst=new Date(now.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
const Y=jst.getFullYear(), M=jst.getMonth()+1, D=jst.getDate(), H=jst.getHours();
const W=["日","月","火","水","木","金","土"][jst.getDay()];
const eto=etoOf(Y,M,D);
const moon=moonEmoji(new Date(`${Y}-${pad(M)}-${pad(D)}T00:00:00+09:00`));

// 昼夜判定（JST）— 6:00–17:59 = day / 18:00–5:59 = night
const isNight = (H >= 18 || H < 6);

// 季節色（アクセント）
const seasonColor = (M>=3&&M<=5)?"#b48ef7":(M>=6&&M<=8)?"#33a1ff":(M>=9&&M<=11)?"#cc7a42":"#6a8fbf";

// ---- fetch contents ----
let dailyMsg="", weatherMsg="", rankingMsg="";
try{ dailyMsg=await fetchText(SOURCE.daily);}catch{ dailyMsg="（今日の灯は準備中です）";}
try{ weatherMsg=await fetchText(SOURCE.weather);}catch{ weatherMsg="（宙の天気は準備中です）";}
try{ rankingMsg=await fetchText(SOURCE.ranking);}catch{ rankingMsg="（干支ランキングは準備中です）";}

// ---- html ----
const esc = s=>s.replace(/</g,"&lt;").replace(/>/g,"&gt;");
const bodyClass = isNight ? "night" : "day";

const html = `<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>心灯｜宙のリズム占い</title>
<meta name="description" content="理で導き、やさしさで包む——毎日の“宙の天気”とメッセージを配信。">
<link rel="canonical" href="https://kokorobi.vercel.app/">
<meta property="og:type" content="website"><meta property="og:title" content="心灯｜宙のリズム占い">
<meta property="og:description" content="理で導き、やさしさで包む——毎日の“宙の天気”とメッセージを配信。">
<meta property="og:url" content="https://kokorobi.vercel.app/"><meta property="og:image" content="https://kokorobi.vercel.app/og.png">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="${seasonColor}">
<style>
:root{--accent:${seasonColor}}
*{box-sizing:border-box}
body{margin:0;background:#0a0a12;color:#eaeaf2;font-family:"Hiragino Sans","Yu Gothic",sans-serif}

/* —— ヘッダー（昼夜で切替） —— */
header{padding:0}
.sky{position:relative;text-align:center;padding:28px 14px 18px}
body.day .sky{background:linear-gradient(135deg,#f7f3ff,#eaf7ff)}
body.night .sky{background:radial-gradient(circle at 50% -10%,#23335a,#0b0f1a 60%)}
.sky .title{font-size:1.6rem;margin:0 0 .25em}
.sky .date{margin:.2em 0 0}
.info{margin:6px 0 0}
.controls{display:flex;gap:10px;justify-content:center;margin-top:8px}
.btn-ghost{appearance:none;background:transparent;border:1px solid #333;color:#333;padding:6px 10px;border-radius:999px;font-size:.9rem}
body.night .btn-ghost{border-color:#556; color:#cfd6ff}

/* 呼吸する月：昼は暖、夜は冷色で光 */
.moon{width:92px;height:92px;margin:10px auto 6px;border-radius:50%;
  animation:breathe 5.5s ease-in-out infinite;will-change:transform,box-shadow}
body.day .moon{
  background:radial-gradient(circle at 35% 35%,#ffe066,#f2c14e 60%,#b3862f 100%);
  box-shadow:0 0 26px rgba(255,214,82,.45);
}
body.night .moon{
  background:radial-gradient(circle at 35% 35%,#e6f0ff,#a8c2ff 60%,#6f86d6 100%);
  box-shadow:0 0 30px rgba(120,160,255,.40), 0 0 60px rgba(120,160,255,.20);
}
@keyframes breathe{
  0%,100%{transform:scale(.96)}
  50%{transform:scale(1.06)}
}

/* 星の量も夜で増やす */
.stars{position:absolute;inset:0;pointer-events:none;opacity:.22}
body.day .stars{
  background:
    radial-gradient(1px 1px at 20% 30%,#fff,transparent 60%),
    radial-gradient(1px 1px at 80% 20%,#fff,transparent 60%);
  animation:twinkle 8s ease-in-out infinite;
}
body.night .stars{
  background:
    radial-gradient(1px 1px at 10% 25%,#fff,transparent 60%),
    radial-gradient(1px 1px at 22% 60%,#fff,transparent 60%),
    radial-gradient(1px 1px at 45% 35%,#fff,transparent 60%),
    radial-gradient(1px 1px at 70% 20%,#fff,transparent 60%),
    radial-gradient(1px 1px at 80% 70%,#fff,transparent 60%),
    radial-gradient(1px 1px at 60% 80%,#fff,transparent 60%);
  animation:twinkle 6s ease-in-out infinite;
}
@keyframes twinkle{0%,100%{opacity:.18}50%{opacity:.42}}

main{max-width:820px;margin:22px auto;padding:0 16px}
section{background:#12121a;border:1px solid #222;border-radius:12px;padding:16px;margin:16px 0;box-shadow:0 2px 10px rgba(0,0,0,.35)}
h2{margin:.2em 0 .6em;font-size:1.1rem;border-left:6px solid var(--accent);padding-left:.5em}
.daily{white-space:pre-wrap;line-height:1.9}
footer{text-align:center;color:#aaa;font-size:.85rem;margin:28px 0}

@media (prefers-reduced-motion: reduce){ .moon{animation:none} .stars{animation:none} }
</style></head>
<body class="${bodyClass}">
<header>
  <div class="sky">
    <div class="stars"></div>
    <div class="moon" aria-hidden="true"></div>
    <h1 class="title">心灯｜宙のリズム占い</h1>
    <p class="date">本日：${Y}年${M}月${D}日（${W}）</p>
    <p class="info">干支日：${eto}　今夜の月：${moon}</p>
    <div class="controls">
      <button id="ambBtn" class="btn-ghost" type="button">宇宙の呼吸：OFF</button>
    </div>
  </div>
</header>

<main>
  <section><h2>🌕 今日の灯</h2><div class="daily">${esc(dailyMsg)}</div></section>
  <section><h2>🪐 宙の天気（干支×五行）</h2><div class="daily">${esc(weatherMsg)}</div></section>
  <section><h2>🌠 干支ランキング</h2><div class="daily">${esc(rankingMsg)}</div></section>
</main>

<footer>© 心灯 – 宙のリズム占い</footer>

<script>
// WebAudio：宇宙の呼吸（低音ハミング + 緩やかなLFO）— タップでON/OFF
(() => {
  let ctx, gain, osc, lfo, lfoGain;
  const btn = document.getElementById('ambBtn');
  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    gain = ctx.createGain(); gain.gain.value = 0.0001;
    osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 110;
    lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08;
    lfoGain = ctx.createGain(); lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); lfo.start();
  }
  btn.addEventListener('click', async () => {
    ensure();
    if (ctx.state === 'suspended') await ctx.resume();
    const on = btn.dataset.playing === '1';
    if (on) {
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.8);
      btn.dataset.playing = '0'; btn.textContent = '宇宙の呼吸：OFF';
    } else {
      gain.gain.setTargetAtTime(0.06, ctx.currentTime, 1.2);
      btn.dataset.playing = '1'; btn.textContent = '宇宙の呼吸：ON';
    }
  });
})();
</script>

</body></html>`;

writeFileSync("index.html", html, "utf8");
console.log("index.html generated (day/night theme + moon breath).");
