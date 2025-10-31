// build.mjs — index.html を自動生成して保存
import { writeFileSync } from "node:fs";

// 干支・月齢
const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
function jdn(y,m,d){const a=Math.floor((14-m)/12);y=y+4800-a;m=m+12*a-3;return d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;}
function etoOf(y,m,d){const jd=jdn(y,m,d);return STEMS[(jd+9)%10]+BRANCHES[(jd+1)%12];}
function moonEmoji(date){
  const syn=29.530588853, base=new Date(Date.UTC(2000,0,6,18,14));
  const diff=(date-base)/86400000, ph=((diff%syn)+syn)%syn;
  if(ph<1.5)return"🌑"; if(ph<6)return"🌒"; if(ph<8)return"🌓"; if(ph<14)return"🌔";
  if(ph<16)return"🌕"; if(ph<21)return"🌖"; if(ph<23)return"🌗"; return"🌘";
}

// JST の今日
const now = new Date();
const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
const y = jst.getFullYear();
const m = jst.getMonth() + 1;
const d = jst.getDate();
const w = ["日","月","火","水","木","金","土"][jst.getDay()];
const eto = etoOf(y,m,d);
const moon = moonEmoji(new Date(`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00+09:00`));

// 季節色（自動）
const accent = (m>=3&&m<=5) ? "#b48ef7" : (m>=6&&m<=8) ? "#33a1ff" : (m>=9&&m<=11) ? "#cc7a42" : "#6a8fbf";

// Gist（Raw）
const GIST = {
  daily:"https://gist.githubusercontent.com/toybox917-cell/5cc5efcc825f7cc57f0e7b49ff9dc7c5/raw",
  weather:"https://gist.githubusercontent.com/toybox917-cell/95124527b68524c2b4d551c7cbb5a14b/raw",
  topics:"https://gist.githubusercontent.com/toybox917-cell/3499c5dfebf2462208ad234120be087a/raw",
  lucky:"https://gist.githubusercontent.com/toybox917-cell/ffbaf45b1edb1c11d2a3e814e76066fa/raw",
  ranking:"https://gist.githubusercontent.com/toybox917-cell/c344ff836842c63913079d0a3637f1fb/raw",
  blogs:[
    "https://gist.githubusercontent.com/toybox917-cell/77f34ebf969517f68d842b7be379b7fa/raw",
    "https://gist.githubusercontent.com/toybox917-cell/5fedbdbfd6464f26351946495e472eb6/raw",
    "https://gist.githubusercontent.com/toybox917-cell/435d9bc589b417dcdc4c4e83d0a4b2c2/raw"
  ]
};

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>心灯｜宙のリズム占い</title>
<meta name="description" content="理で導き、やさしさで包む——毎日の“宙の天気”とメッセージを配信。">
<link rel="canonical" href="https://kokorobi.vercel.app/">
<meta property="og:type" content="website">
<meta property="og:title" content="心灯｜宙のリズム占い">
<meta property="og:description" content="理で導き、やさしさで包む——毎日の“宙の天気”とメッセージを配信。">
<meta property="og:url" content="https://kokorobi.vercel.app/">
<meta property="og:image" content="https://kokorobi.vercel.app/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${accent}">
<style>
  :root{--accent:${accent}}
  body{font-family:"Hiragino Sans","Yu Gothic",sans-serif;margin:0;background:#0a0a12;color:#eaeaf2}
  header{text-align:center;padding:2em 1em;background:linear-gradient(135deg,#f5eefc,#e7f7ff);color:#222}
  header h1{margin:0} header p{margin:.35em 0 0;color:#333}
  main{max-width:820px;margin:24px auto;padding:0 16px}
  section{background:#12121a;border:1px solid #222;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.35);padding:16px;margin:16px 0}
  h2{margin:.2em 0 .6em;font-size:1.1rem;border-left:6px solid var(--accent);padding-left:.5em}
  .loading{color:#9aa} article h3{margin:.2em 0;color:#c7b6ff}
  footer{text-align:center;color:#aaa;font-size:.85em;margin:28px 0}
</style>
</head>
<body>
<header>
  <h1>心灯｜宙のリズム占い</h1>
  <p>本日：${y}年${m}月${d}日（${w}）</p>
  <p style="margin:.3em 0 0;color:#444">干支日：${eto}　今夜の月：${moon}</p>
</header>
<main>
  <section><h2>🌕 今日の灯</h2><div id="daily" class="loading">読み込み中...</div></section>
  <section><h2>🌤 宙の天気（干支×五行）</h2><div id="weather" class="loading">読み込み中...</div></section>
  <section><h2>🔮 三大運トピック</h2><div id="topics" class="loading">読み込み中...</div></section>
  <section><h2>🍀 クイック開運パネル</h2><div id="lucky" class="loading">読み込み中...</div></section>
  <section><h2>🐉 干支ランキング</h2><div id="ranking" class="loading">読み込み中...</div></section>
  <section><h2>💫 心の調律ノート</h2><div id="blogs" class="loading">読み込み中...</div></section>
</main>
<footer>© 心灯 – 宙のリズム占い</footer>
<script>
const GIST=${JSON.stringify(GIST,null,2)};
async function loadTo(id,url){
  const el=document.getElementById(id);
  try{const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw 0;
      el.innerHTML=await r.text(); el.classList.remove('loading');}
  catch{ el.textContent="⚠️ 読み込みできませんでした"; }
}
loadTo("daily",GIST.daily); loadTo("weather",GIST.weather);
loadTo("topics",GIST.topics); loadTo("lucky",GIST.lucky);
loadTo("ranking",GIST.ranking);
(async()=>{const host=document.getElementById("blogs"); let html="";
  for(const u of GIST.blogs){try{const r=await fetch(u,{cache:"no-store"});const t=await r.text();
    const [h,...b]=t.split("\\n"); html+=\`<article><h3>\${h||"無題"}</h3><p>\${b.join("<br>")}</p></article>\`;}catch{}}
  host.innerHTML=html||"（記事準備中）"; host.classList.remove('loading');})();
</script>
</body></html>`;

writeFileSync("index.html", html, "utf8");
console.log("index.html generated.");
