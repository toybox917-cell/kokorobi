<script>
// --- 心灯サイト共通リンク設定（ここだけ直せば3サイトが連動）---
window.KOKOROBI_SITES = {
  project: "https://kokorobi-project.vercel.app",
  fortune: "https://kokorobi-fortune-web.vercel.app",
  books:   "https://kokorobi-books.vercel.app"
};


// 共通ナビを生成
function kokorobiNav(active) {
  const u = window.KOKOROBI_SITES;
  return `
  <nav class="kb-nav" aria-label="グローバル">
    <a href="${u.project}" ${active==='project'?'aria-current="page"':''}>心灯プロジェクト</a>
    <a href="${u.fortune}" ${active==='fortune'?'aria-current="page"':''}>心灯流占い</a>
    <a href="${u.books}"   ${active==='books'  ?'aria-current="page"':''}>心灯ブックス</a>
  </nav>`;
}

// シンプルな共通スタイル
(function addKBStyles(){
  const css = `
  .kb-nav{display:flex;gap:14px;flex-wrap:wrap;align-items:center;
    padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);
    background:linear-gradient(180deg,rgba(255,215,128,.06),transparent);
    font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif}
  .kb-nav a{color:#ffd780;text-decoration:none;padding:6px 10px;border-radius:8px;
    border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06)}
  .kb-nav a:hover{background:rgba(255,255,255,.12)}
  .kb-nav a[aria-current="page"]{outline:2px solid #ffd780}
  `;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
})();
</script>
