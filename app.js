/* ==========================================================
       一、首頁「雪山漫步」動態場景（Canvas）
       ========================================================== */
    (function () {
      const cv = document.getElementById('scene');
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let W, H, DPR, ridges = [], flakes = [], frontRidge = [];
      let pTX = 0, pTY = 0, pX = 0, pY = 0;   /* 滑鼠視差（平滑跟隨） */
      addEventListener('pointermove', e => {
        pTX = e.clientX / innerWidth - 0.5;
        pTY = e.clientY / innerHeight - 0.5;
      });

      // 可重現的偽隨機（讓山形固定）
      function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

      function makeRidge(seed, baseY, amp, step) {
        const rnd = mulberry32(seed);
        const pts = []; let y = baseY + (rnd() - 0.5) * amp;
        for (let x = -40; x <= W + 40; x += step) {
          y += (rnd() - 0.5) * amp * 0.4;
          y = Math.min(Math.max(y, baseY - amp), baseY + amp * 0.6);
          pts.push({ x, y });
        }
        return pts;
      }

      function resize() {
        DPR = Math.min(devicePixelRatio || 1, 2);
        W = cv.clientWidth; H = cv.clientHeight;
        cv.width = W * DPR; cv.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        ridges = [
          { pts: makeRidge(11, H * 0.48, H * 0.16, 26), color: '#16222F', drift: 4 },
          { pts: makeRidge(23, H * 0.60, H * 0.14, 22), color: '#111B27', drift: 9 },
          { pts: makeRidge(37, H * 0.74, H * 0.11, 18), color: '#0C141F', drift: 16 },
        ];
        frontRidge = ridges[0].pts;   /* 登山者走在最上方的稜線，剪影襯著天空更明顯 */

        flakes = Array.from({ length: Math.min(180, W / 6) }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: 0.6 + Math.random() * 1.8, s: 0.35 + Math.random() * 0.9,
          p: Math.random() * Math.PI * 2
        }));
      }

      function ridgeY(x) {
        const pts = frontRidge;
        for (let i = 1; i < pts.length; i++) {
          if (x <= pts[i].x) {
            const a = pts[i - 1], b = pts[i], t = (x - a.x) / (b.x - a.x);
            return a.y + (b.y - a.y) * t;
          }
        }
        return pts[pts.length - 1].y;
      }

      // 行走的人影
      let hikerX = null;   /* 首次繪製時直接出現在畫面中 */
      function drawHiker(t) {
        if (hikerX === null) hikerX = W * 0.1;
        hikerX += 0.187;   /* 步速：原本 0.22 的 0.85 倍 */
        if (hikerX > W + 80) hikerX = -80;
        const gy = ridgeY(hikerX) - 1;
        const s = 1.3;                            // 比例（調大剪影更明顯）
        const bob = Math.sin(t * 0.006) * 0.8;        // 步伐起伏
        const leg = Math.sin(t * 0.006);            // 腿部擺動
        ctx.save();
        ctx.translate(hikerX, gy + bob);

        // 頭燈光暈（與地圖定位點同色的暖金黃，帶一點自然閃爍）
        const flick = 0.85 + Math.sin(t * 0.013) * 0.1 + Math.sin(t * 0.037) * 0.05;
        const hx = 3.4 * s, hy = -24 * s;                      // 燈的位置（額頭）
        const glow = ctx.createRadialGradient(hx + 4 * s, hy + 1.5 * s, 0, hx + 4 * s, hy + 1.5 * s, 20 * s);
        glow.addColorStop(0, 'rgba(246,228,178,' + (0.5 * flick).toFixed(3) + ')');
        glow.addColorStop(0.35, 'rgba(246,228,178,' + (0.16 * flick).toFixed(3) + ')');
        glow.addColorStop(1, 'rgba(246,228,178,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(hx + 4 * s, hy + 1.5 * s, 20 * s, 0, 7); ctx.fill();
        // 往前下方照的光束
        const beam = ctx.createLinearGradient(hx, hy, hx + 16 * s, hy + 7 * s);
        beam.addColorStop(0, 'rgba(246,228,178,' + (0.32 * flick).toFixed(3) + ')');
        beam.addColorStop(1, 'rgba(246,228,178,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 17 * s, hy + 2.5 * s);
        ctx.lineTo(hx + 14 * s, hy + 11 * s);
        ctx.closePath(); ctx.fill();

        ctx.strokeStyle = '#05090F';
        ctx.fillStyle = '#05090F';
        ctx.lineWidth = 2.4 * s; ctx.lineCap = 'round';
        // 腿
        ctx.beginPath();
        ctx.moveTo(0, -10 * s); ctx.lineTo(4 * leg * s, 0);
        ctx.moveTo(0, -10 * s); ctx.lineTo(-4 * leg * s, 0);
        ctx.stroke();
        // 身體（微前傾）
        ctx.beginPath(); ctx.moveTo(0, -10 * s); ctx.lineTo(1.6 * s, -21 * s); ctx.stroke();
        // 背包（大容量登山包＋頂袋）
        ctx.beginPath(); ctx.ellipse(-2.4 * s, -16.5 * s, 4.4 * s, 6.4 * s, 0.22, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-2.8 * s, -22.6 * s, 2.4 * s, 1.9 * s, 0.25, 0, 7); ctx.fill();
        // 頭
        ctx.beginPath(); ctx.arc(2.2 * s, -24 * s, 2.6 * s, 0, 7); ctx.fill();
        // 頭燈本體亮點
        ctx.beginPath(); ctx.arc(hx, hy, 1.2 * s, 0, 7);
        ctx.fillStyle = '#F6E4B2'; ctx.fill();
        ctx.fillStyle = '#05090F';
        // 登山杖
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath(); ctx.moveTo(2 * s, -14 * s); ctx.lineTo(8 * s + 3 * leg * s, 0); ctx.stroke();
        ctx.restore();
      }

      function drawRidgeLayer(r, i, t) {
        const dx = reduced ? 0 : Math.sin(t * 0.00005 * (i + 1)) * r.drift + pX * (3 + i * 6);
        const dy = reduced ? 0 : pY * (1.5 + i * 3);
        ctx.save(); ctx.translate(dx, dy);
        ctx.beginPath();
        ctx.moveTo(r.pts[0].x, r.pts[0].y);
        r.pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(W + 60, H); ctx.lineTo(-60, H); ctx.closePath();
        ctx.fillStyle = r.color; ctx.fill();
        // 稜線上的雪光
        ctx.beginPath();
        ctx.moveTo(r.pts[0].x, r.pts[0].y);
        r.pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = `rgba(190,214,229,${0.28 - i * 0.07})`;
        ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
      }

      function draw(t) {
        // 天空
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1B2A3C');
        sky.addColorStop(0.55, '#152130');
        sky.addColorStop(1, '#0C141F');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

        if (!reduced) { pX += (pTX - pX) * 0.05; pY += (pTY - pY) * 0.05; }

        // 月暈（遠景：與滑鼠反向微移，強化空間深度）
        ctx.save(); ctx.translate(-pX * 5, -pY * 3);
        const mg = ctx.createRadialGradient(W * 0.74, H * 0.2, 10, W * 0.74, H * 0.2, H * 0.4);
        mg.addColorStop(0, 'rgba(210,228,240,.5)');
        mg.addColorStop(0.12, 'rgba(180,205,222,.14)');
        mg.addColorStop(1, 'rgba(180,205,222,0)');
        ctx.fillStyle = mg; ctx.fillRect(-20, -20, W + 40, H + 40);
        ctx.beginPath(); ctx.arc(W * 0.74, H * 0.2, 14, 0, 7);
        ctx.fillStyle = 'rgba(238,243,246,.95)'; ctx.fill();
        ctx.restore();

        // 依遠近順序繪製：最遠稜線 → 行走的人影 → 較近的稜線
        // 這樣人被前面的稜線擋住時是自然的「走到山後面」，而不是浮在山的前面
        drawRidgeLayer(ridges[0], 0, t);
        const dx0 = reduced ? 0 : Math.sin(t * 0.00005) * ridges[0].drift + pX * 3;
        ctx.save(); ctx.translate(dx0, reduced ? 0 : pY * 1.5);
        drawHiker(reduced ? 0 : t);
        ctx.restore();
        drawRidgeLayer(ridges[1], 1, t);
        drawRidgeLayer(ridges[2], 2, t);

        // 霧帶
        const fx = reduced ? 0 : (t * 0.012) % (W * 2) - W;
        const fog = ctx.createRadialGradient(fx + W * 0.5, H * 0.62, 20, fx + W * 0.5, H * 0.62, W * 0.5);
        fog.addColorStop(0, 'rgba(150,175,195,.10)');
        fog.addColorStop(1, 'rgba(150,175,195,0)');
        ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H);

        // 雪
        ctx.fillStyle = 'rgba(238,243,246,.85)';
        flakes.forEach(f => {
          if (!reduced) {
            f.y += f.s; f.x += Math.sin(t * 0.001 + f.p) * 0.3;
            if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W }
          }
          ctx.globalAlpha = 0.25 + f.r * 0.28;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      /* 低效能裝置（CPU 核心數少）降到約 30fps，省電並維持流暢感 */
      const lowPerf = (navigator.hardwareConcurrency || 8) <= 4;
      let lastT = 0;
      function loop(t) {
        if (reduced) return;
        requestAnimationFrame(loop);
        if (document.documentElement.dataset.hidden) return;   // 背景分頁不繪製
        if (lowPerf && t - lastT < 33) return;                 // 低效能降幀
        lastT = t;
        draw(t);
      }
      addEventListener('resize', resize);
      resize(); draw(0); requestAnimationFrame(loop);
    })();

    /* ==========================================================
       網站圖示（favicon）：用 Canvas 即時繪製，不需要準備圖檔
       想改成固定檔案：在瀏覽器開發者工具把 dataURL 存成 favicon.png，
       再改用 <link rel="icon" href="favicon.png"> 即可
       ========================================================== */
    (function () {
      // 依尺寸畫出「雪山＋月亮」圖示，回傳 dataURL。round=true 畫圓角
      function drawIcon(S, round) {
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const g = c.getContext('2d'), k = S / 64;   // 以 64 為基準等比放大
        g.beginPath();
        if (round && g.roundRect) g.roundRect(0, 0, S, S, 14 * k); else g.rect(0, 0, S, S);
        const sky = g.createLinearGradient(0, 0, 0, S);
        sky.addColorStop(0, '#1B2A3C'); sky.addColorStop(1, '#0C141F');
        g.fillStyle = sky; g.fill();
        g.save(); g.clip();
        g.beginPath(); g.arc(46 * k, 17 * k, 6.5 * k, 0, 7);
        g.fillStyle = '#EEF3F6'; g.fill();
        g.beginPath();
        g.moveTo(-6 * k, 46 * k); g.lineTo(16 * k, 24 * k); g.lineTo(30 * k, 40 * k); g.lineTo(44 * k, 28 * k); g.lineTo(70 * k, 52 * k);
        g.lineTo(70 * k, 70 * k); g.lineTo(-6 * k, 70 * k); g.closePath();
        g.fillStyle = '#24364A'; g.fill();
        g.beginPath();
        g.moveTo(-6 * k, 58 * k); g.lineTo(22 * k, 36 * k); g.lineTo(40 * k, 52 * k); g.lineTo(54 * k, 42 * k); g.lineTo(70 * k, 58 * k);
        g.lineTo(70 * k, 70 * k); g.lineTo(-6 * k, 70 * k); g.closePath();
        g.fillStyle = '#131E2C'; g.fill();
        g.beginPath();
        g.moveTo(-6 * k, 58 * k); g.lineTo(22 * k, 36 * k); g.lineTo(40 * k, 52 * k); g.lineTo(54 * k, 42 * k); g.lineTo(70 * k, 58 * k);
        g.strokeStyle = 'rgba(190,214,229,.75)'; g.lineWidth = 2 * k; g.stroke();
        g.restore();
        return c.toDataURL('image/png');
      }

      // 瀏覽器分頁圖示（favicon）
      const fav = drawIcon(64, true);
      const link = document.createElement('link');
      link.rel = 'icon'; link.type = 'image/png'; link.href = fav;
      document.head.appendChild(link);

      // iOS 加入主畫面的圖示
      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon'; apple.href = drawIcon(180, false);
      document.head.appendChild(apple);

      /* ---------- PWA：動態產生 manifest，可「加入主畫面」變成類 App ---------- */
      try {
        const manifest = {
          name: '攝影書 — Chrono', short_name: 'Chrono',
          description: '收藏山與光影之間的片刻',
          start_url: './', display: 'standalone',
          background_color: '#0C141F', theme_color: '#0C141F',
          icons: [
            { src: drawIcon(192, false), sizes: '192x192', type: 'image/png' },
            { src: drawIcon(512, false), sizes: '512x512', type: 'image/png' },
            { src: drawIcon(512, false), sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        };
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
        const mlink = document.createElement('link');
        mlink.rel = 'manifest'; mlink.href = URL.createObjectURL(blob);
        document.head.appendChild(mlink);
      } catch (e) { /* 舊瀏覽器不支援就略過 */ }
    })();

    /* ==========================================================
       二、翻頁攝影書（主題／書本兩層・單雙面・拖曳翻頁・足跡地圖）
       ----------------------------------------------------------
       ◆ 結構：COLLECTIONS（主題，例如 Vol. I）→ 每個主題底下有多本 books
       ◆ 每本書的設定：
           title  : 書名
           folder : 圖片資料夾，例如 'books/vol1/snow-trek'
           count  : 「內頁」張數（不含封面封底）
           ratio  : 頁面比例＝高÷寬，每本書可以不同
                    （1＝正方形、1.414＝A4 直式、0.75＝4:3 橫式、1.25＝4:5 直式）
           places : 這本書的拍攝地點，會標在下方的足跡世界地圖上
                    [{name:'雪山主峰', lat:24.39, lng:121.23, page:3}, ...]
                    page 為選填：該地點對應的內頁編號，設定後點地圖光點會直接跳到那一頁
       ◆ 圖片命名（每頁一張 JPG）：
           cover.jpg（封面）、p01.jpg～pNN.jpg（內頁，兩位數）、back.jpg（封底）
           → folder + count 設定好就會自動載入
       ◆ 也可手動列出：pages:['xx/cover.jpg','xx/p01.jpg',...,'xx/back.jpg']
       ◆ 書裡可以放短影片：pages 中直接混入 .mp4 檔即可，會自動靜音循環播放，
         例如 pages:['xx/cover.jpg','xx/p01.jpg','xx/p02.mp4','xx/p03.jpg',...]
         （含影片的書請用手動 pages 列法；影片建議 5–10 秒、壓在 5MB 內）
       ◆ 新增主題或書：在 COLLECTIONS 照格式複製一筆即可，選單自動出現
       ◆ folder / pages 皆為空時顯示示範內頁；內頁建議偶數張，雙面跨頁才完整
       ◆ 每本書有獨立網址：#book1-1（第 1 個主題的第 1 本）、#book2-1…
       ========================================================== */
    /* 書籍資料 COLLECTIONS 已移至 books.js */

    /* 點陣世界地圖資料：240×107 網格（經度每 1.5°、緯度 75°N～85.5°S，含南極洲），
       由真實海岸線資料預先計算、壓成 base64，不需載入任何外部圖資 */
    const MAP_COLS = 240, MAP_ROWS = 107, MAP_LAT_TOP = 75, MAP_LAT_BOT = -85.5;
    const LAND_MASK = "AAAAAOAzAPYCAPz//wcAAAAAAPAAAP7/AwAAAAAAAAAAAPD/+/cfAPj//wEAAAAAADjAwf///z/gAQAAA4ABAOD/Y/P/Afj//wMAAAAHADzw/v///3//PwGAAPj/x//834/3B/j//wEAAPA/AADn//////////9+A/7///+fz9/jD/D/PwAAAPz/Z/7/////////////P/z///////+Df/D/AyAAAP7/7///////////////P//////////wP+A/AH8AgH9+/P//////////////YPD//////8+HH+AfAB4AwL////////////////9/AP7//////wP1DIAPAAAA+M//////////////////APz//////wHwAwAPAAAA+M////////////////wHAPAL+P///wHwMwAAAAAA+I//////////////7xwAAIAHgP///wPwfwAAAABwQFf///////////8/AB8AAGAAAP///z/gfwAAAAAwYMf///////////8PAB8AAAwAAP7////5/wMAAADsYPj///////////8HAA8AAAAAgPz////5/wcAAADs+P//////////////AAcAAAAAAPz//////wcAAAD2/f//////////////AAMAAAAAAPz//////wYAAABw/v////////////+/AAAAAAAAAPD/////Hx8AAADg////////////////AQAAAAAAAOD/////HxgAAADA///////////////fAAAAAAAAAOD//////wAAAACA///P/vn///////9PAAAAAAAAAOD/////NwAAAACA//1H/v7////////HAQAAAAAAAOD/////AQAAAAD8g/sH+Pz////////hAAAAAAAAAOD/////AQAAAAD8A+////H//////38gAAAAAAAAAOD///9/AAAAAAD8YOT+//n//////x5gAAAAAAAAAMD///8/AAAAAAD8AMf+//H/////fzggAAAAAAAAAMD///8/AAAAAAB8/sL8/////////3M4AAAAAAAAAID///8/AAAAAADwf4Bj/////////zA/AAAAAAAAAAD+//8PAAAAAAD8fwCA/////////4EHAAAAAAAAAAD8//8HAAAAAAD8/+OA/////////4EAAAAAAAAAAAD8//8DAAAAAAD+/////////////wEAAAAAAAAAAADo/xkDAAAAAAD+//////z//////wMAAAAAAAAAAADYfwAGAAAAAID///////3//////wEAAAAAAAAAAACgfwAeAAAAAMD///9///P//////wAAAAAAAAAAAAAgfwAAAAAAAMD//////jfw////fwEAAAAAAAAAAABAfgAHAAAAAOD//////P/A////PwEAAAAAAGAAAAAAfqAcAAAAAPD//////f/A/+//DwEAAAAAAAABAAAA/jhwAAAAAOD//////X8A/8N/AgAAAAAAAAAAAAAA/D3QDwAAAOD/////+X8A/8F/AwMAAAAAAAAAAAAA8B8AAAAAAOD/////8x8AfoD/AAMAAAAAAAAAAAAAgP4AAAAAAOD/////9wcAPoD+AQEAAAAAAAAAAAAAAPwBAAAAAPD//////wEAPgD+AQMAAAAAAAAAAAAAAOABAAAAAOD/////PwAAPAD+AQ0AAAAAAAAAAAAAAMDABwAAAOD/////nwMAHAD0gQ4AAAAAAAAAAAAAAIDhfwAAAMD//////wMAOABCAA4AAAAAAAAAAAAAAAD3/wEAAID//////wMAaAAGAA4AAAAAAAAAAAAAAADw/wMAAAD//////wEAYAAMAA4AAAAAAAAAAAAAAADw/x8AAAD++P///wEAAIAZ8AAAAAAAAAAAAAAAAADw/z8AAAAAwP///wAAAAAbeAAAAAAAAAAAAAAAAAD4/z8AAAAAwP//fwAAAAA+fAAAAAAAAAAAAAAAAAD8/38AAAAAwP//HwAAAAAc/ycAAAAAAAAAAAAAAAD8//8BAAAAwP//DwAAAAAY/qIDAAAAAAAAAAAAAAD8//8HAAAAwP//BwAAAAB4vgE7AAAAAAAAAAAAAAD8//9/AAAAgP//BwAAAABwsBP/IQAAAAAAAAAAAAD8////AQAAAP//AwAAAABggAL4MwAAAAAAAAAAAAD8////AQAAAP//AwAAAADABwDyhwEAAAAAAAAAAAD4////AQAAAP7/AwAAAAAAXhPwBgQAAAAAAAAAAADw////AAAAAP7/BwAAAAAAgAUADAwAAAAAAAAAAADw//9/AAAAAP7/BwAAAAAAAAABAAAAAAAAAAAAAADg//9/AAAAAP//BwEAAAAAAIDHAAAAAAAAAAAAAADg//8/AAAAAP//BwMAAAAAANDHAQAAAAAAAAAAAADA//8/AAAAAP//xwMAAAAAAPjPAYAAAAAAAAAAAAAA//8/AAAAAP//4wEAAAAAAP7fAwBAAAAAAAAAAAAA/v8/AAAAAP//4AEAAAAAAP7/AwAAAAAAAAAAAAAA/v8fAAAAAP5/4AEAAAAAgP//ByAAAAAAAAAAAAAA/v8fAAAAAP7/4AAAAAAA8P//D0AAAAAAAAAAAAAA/v8PAAAAAP7/4AAAAAAA8P//HwAAAAAAAAAAAAAA/v8BAAAAAPx/4AAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA+P//PwAAAAAAAAAAAAAA//8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/38AAAAAAPgfAAAAAAAA8P//PwAAAAAAAAAAAAAA/38AAAAAAPgPAAAAAAAA4P//PwAAAAAAAAAAAAAA/z8AAAAAAPAPAAAAAAAA4D//PwAAAAAAAAAAAAAA/x8AAAAAAPADAAAAAAAA8Af8HwAAAAAAAAAAAACA/wMAAAAAAAAAAAAAAAAAQAD4HwAIAAAAAAAAAACA/wMAAAAAAAAAAAAAAAAAAADgDwAQAAAAAAAAAACA/wMAAAAAAAAAAAAAAAAAAADABwBwAAAAAAAAAACAfwAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAAAAABwA8AAAAAAAAAADAPwAAAAAAAAAAAAAAAAAAAAAABgAMAAAAAAAAAADAHwAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAIADAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgDwAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAADgBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAgwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAH4AAAz4f/7/AQAAAAAAAAAAAAAAGAAAAAAAAABA8P8/8P//////DwAAAAAAAAAAAAAAPwAAAAAAADrw//9//v///////wcAAAAAAAAAAADAfwAAAAD6//////8///////////8DAAAAAAAA+BAA/QAAAMD///////////////////8DAAAA4P8/+P//fwAAAOD///////////////////8AAADA////////HwAAAP7//////////////////z8AAMD///////8/AAAA+P///////////////////z8AALj///////8PAMAH//////////////////////8AAADA////////8PAH8P///////////////////wcAAAD/////////f+D//////////////////////w8AAAD8//////////////////////////////////8B/w/g////////////////////////////////////";

    (function () {
      const bookEl = document.getElementById('bookEl');
      const stage = document.getElementById('bookStage');
      const bookMenu = document.getElementById('bookMenu');
      const menuTrigger = document.getElementById('menuTrigger');
      const menuPanel = document.getElementById('menuPanel');
      const indicator = document.getElementById('pageIndicator');
      const singleView = document.getElementById('singleView');
      const singleMedia = document.getElementById('singleMedia');
      const btnSingle = document.getElementById('modeSingle');
      const btnDouble = document.getElementById('modeDouble');
      const lightbox = document.getElementById('lightbox');
      const lbMedia = document.getElementById('lbMedia');
      const mapBlock = document.getElementById('mapBlock');
      const mapCv = document.getElementById('worldMap');
      const mctx = mapCv.getContext('2d');
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

      let activeCol = 0, activeIdx = 0, book = null, curSingleSrc = null;
      let pages = [], sheets = [], current = 0, sIdx = 0, mode = 'single';
      const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
      const ratio = () => (book && book.ratio) || 1;

      /* ---------- 尺寸（依每本書的 ratio 計算，盡量佔滿畫面） ---------- */
      function bookSize() {
        const rt = ratio();
        let pw = Math.min(innerWidth * 0.45, innerHeight * 0.74 / rt, 640);
        if (innerWidth < 560) pw = innerWidth * 0.46;
        bookEl.style.width = pw * 2 + 'px';
        bookEl.style.height = pw * rt + 'px';
        const side = Math.min(innerWidth * 0.92, innerHeight * 0.78 / rt, 900);
        singleMedia.style.width = side + 'px';
        singleMedia.style.aspectRatio = '1 / ' + rt;
      }

      const maxCurrent = () => pages.length % 2 === 0 ? sheets.length : sheets.length - 1;

      /* ---------- 示範內頁 ---------- */
      function placeholderPages(b) {
        const INNER = 6, N = INNER + 2, list = [], rt = b.ratio || 1;
        for (let i = 0; i < N; i++) {
          const c = document.createElement('canvas');
          c.width = 800; c.height = Math.round(800 * rt);
          const g = c.getContext('2d');
          const cover = i === 0, backCover = i === N - 1;
          const bg = g.createLinearGradient(0, 0, 0, c.height);
          if (cover || backCover) { bg.addColorStop(0, b.tint[0]); bg.addColorStop(1, b.tint[1]) }
          else { bg.addColorStop(0, '#F6F4EF'); bg.addColorStop(1, '#EAE6DD') }
          g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
          g.beginPath(); g.moveTo(0, c.height * 0.66);
          for (let x = 0; x <= c.width; x += 30) {
            g.lineTo(x, c.height * 0.66 + Math.sin(x * 0.012 + i * 2) * 42 - Math.sin(x * 0.03 + i) * 18);
          }
          g.lineTo(c.width, c.height); g.lineTo(0, c.height); g.closePath();
          g.fillStyle = (cover || backCover) ? b.tint[2] : 'rgba(20,32,45,.10)';
          g.fill();
          g.textAlign = 'center';
          if (cover) {
            g.fillStyle = '#EEF3F6';
            g.font = '300 84px "Noto Serif TC",serif';
            g.fillText(b.title, c.width / 2, c.height * 0.42);
            g.fillStyle = '#A9C7DA';
            g.font = '500 22px "Cormorant Garamond",serif';
            g.fillText('P H O T O  B O O K', c.width / 2, c.height * 0.5);
          } else if (backCover) {
            g.fillStyle = '#A9C7DA';
            g.font = '400 30px "Cormorant Garamond",serif';
            g.fillText('F I N', c.width / 2, c.height * 0.47);
            g.fillStyle = 'rgba(238,243,246,.55)';
            g.font = '300 20px "Noto Serif TC",serif';
            g.fillText(b.title, c.width / 2, c.height * 0.55);
          } else {
            g.fillStyle = 'rgba(20,32,45,.35)';
            g.font = '300 28px "Noto Serif TC",serif';
            g.fillText('《' + b.title + '》示範內頁', c.width / 2, c.height * 0.48);
            g.fillStyle = 'rgba(20,32,45,.5)';
            g.font = '400 22px "Cormorant Garamond",serif';
            g.fillText(String(i).padStart(2, '0'), c.width / 2, c.height * 0.9);
          }
          list.push(c.toDataURL('image/jpeg', 0.9));
        }
        return list;
      }

      /* ---------- 書冊選單（點擊展開） ---------- */
      function buildMenu() {
        const col = COLLECTIONS[activeCol];
        menuTrigger.innerHTML =
          '<span class="en">' + col.en + '</span><span>' + col.title + '</span>' +
          '<span class="sep">·</span><span class="bk">' + book.title + '</span>' +
          '<span class="caret">▾</span>';
        menuPanel.innerHTML = '';
        COLLECTIONS.forEach((c, ci) => {
          const box = document.createElement('div');
          box.className = 'menu-col';
          box.innerHTML = '<p class="menu-col-title"><span class="en">' + c.en + '</span>' + c.title + '</p>';
          const list = document.createElement('div');
          list.className = 'menu-books';
          c.books.forEach((b, bi) => {
            const btn = document.createElement('button');
            btn.textContent = b.title;
            if (ci === activeCol && bi === activeIdx) btn.classList.add('active');
            btn.addEventListener('click', () => { selectBook(ci, bi); closeMenu(); });
            list.appendChild(btn);
          });
          box.appendChild(list);
          menuPanel.appendChild(box);
        });
      }
      function openMenu() { bookMenu.classList.add('open'); menuTrigger.setAttribute('aria-expanded', 'true'); }
      function closeMenu() { bookMenu.classList.remove('open'); menuTrigger.setAttribute('aria-expanded', 'false'); }
      menuTrigger.addEventListener('click', e => {
        e.stopPropagation();
        bookMenu.classList.contains('open') ? closeMenu() : openMenu();
      });
      document.addEventListener('click', e => {
        if (!e.target.closest('.book-menu')) closeMenu();
      });

      function selectBook(ci, bi) {
        activeCol = clamp(ci, 0, COLLECTIONS.length - 1);
        activeIdx = clamp(bi, 0, COLLECTIONS[activeCol].books.length - 1);
        book = COLLECTIONS[activeCol].books[activeIdx];
        /* folder + count → 自動組出 cover / p01~pNN / back 的路徑
           clips 可指定某頁為影片，例如 {4:'mp4'} → p04.mp4 */
        if (!book.pages.length && book.folder && book.count) {
          const f = book.folder.replace(/\/$/, '');
          const clips = book.clips || {};
          book.pages = [
            f + '/cover.jpg',
            ...Array.from({ length: book.count }, (_, k) => f + '/p' + String(k + 1).padStart(2, '0') + '.' + (clips[k + 1] || 'jpg')),
            f + '/back.jpg'
          ];
        }
        /* 統一為 {src, caption} 格式，並套用 captions 設定 */
        const caps = book.captions || {};
        const raw = book.pages.length ? book.pages.slice() : placeholderPages(book);
        pages = raw.map((pg, i) => {
          const o = (typeof pg === 'string') ? { src: pg, caption: '' } : { src: pg.src, caption: pg.caption || '' };
          if (!o.caption) {
            if (i === 0 && caps.cover) o.caption = caps.cover;
            else if (i === raw.length - 1 && caps.back) o.caption = caps.back;
            else if (caps[i]) o.caption = caps[i];
          }
          return o;
        });
        sIdx = 0; curSingleSrc = null;
        bookSize(); build(); buildMenu(); updateMapPlaces();
        /* 更新網址（某些環境如直接開本機檔案可能不允許，失敗就略過） */
        try { history.replaceState(null, '', '#book' + (activeCol + 1) + '-' + (activeIdx + 1)); } catch (e) { }
      }

      /* ---------- 頁面媒體：圖片或短影片（.mp4 自動靜音循環播放） ----------
         eager=true 時立即載入（封面、當前頁）；否則交給瀏覽器延遲載入 */
      const isVideo = src => /\.(mp4|webm|mov)(\?|$)/i.test(src);
      function makeMedia(src, alt, eager) {
        let el;
        if (isVideo(src)) {
          el = document.createElement('video');
          el.src = src; el.muted = true; el.loop = true; el.autoplay = true;
          el.playsInline = true; el.setAttribute('playsinline', '');
          el.setAttribute('aria-label', alt);
          el.setAttribute('preload', eager ? 'auto' : 'metadata');
        } else {
          el = new Image(); el.alt = alt;
          el.setAttribute('loading', eager ? 'eager' : 'lazy');   /* 原生延遲載入：非當前頁到快看到時才下載 */
          el.setAttribute('decoding', 'async');                   /* 非同步解碼，不卡住主執行緒 */
          el.classList.add('media-load');           /* 載入完成前透明，完成後淡入 */
          el.addEventListener('load', () => el.classList.add('ready'), { once: true });
          el.src = src;
          if (el.complete) el.classList.add('ready');  /* 已在快取中則直接顯示 */
        }
        el.draggable = false;
        el.addEventListener('contextmenu', e => e.preventDefault());  /* 降低照片被直接下載的機會 */
        return el;
      }

      /* ---------- 建立書本（雙面模式用） ---------- */
      function build() {
        bookEl.innerHTML = '';
        sheets = []; current = 0;
        const n = Math.ceil(pages.length / 2);
        for (let i = 0; i < n; i++) {
          const s = document.createElement('div');
          s.className = 'sheet';
          const f = document.createElement('div'); f.className = 'face front';
          const b = document.createElement('div'); b.className = 'face back';
          f.appendChild(makeMedia(pages[i * 2].src, pageLabel(i * 2), i < 1));
          if (pages[i * 2 + 1]) {
            b.appendChild(makeMedia(pages[i * 2 + 1].src, pageLabel(i * 2 + 1), i < 1));
          }
          f.insertAdjacentHTML('beforeend', '<div class="shade"></div>');
          b.insertAdjacentHTML('beforeend', '<div class="shade"></div>');
          s.appendChild(f); s.appendChild(b);
          bookEl.appendChild(s);
          sheets.push(s);
        }
        zorder(); update();
      }

      function zorder() {
        sheets.forEach((s, i) => {
          s.style.zIndex = s.classList.contains('flipped') ? i + 1 : sheets.length - i;
        });
      }
      function raise(s) { s.style.zIndex = sheets.length + 5; }
      function pulse(s) { s.classList.add('flipping'); setTimeout(() => s.classList.remove('flipping'), 1150); }

      /* ---------- 頁碼：封面／封底不計入總頁數 ---------- */
      function pageLabel(idx) {
        if (idx === 0) return '封面';
        if (idx === pages.length - 1) return '封底';
        return '第 ' + idx + ' 頁';
      }
      function update() {
        const N = pages.length, M = N - 2;
        updateCaptions();
        if (mode === 'single') {
          if (curSingleSrc !== pages[sIdx].src) {
            singleMedia.innerHTML = '';
            singleMedia.appendChild(makeMedia(pages[sIdx].src, pageLabel(sIdx), true));
            curSingleSrc = pages[sIdx].src;
          }
          indicator.textContent = (sIdx === 0 || sIdx === N - 1)
            ? pageLabel(sIdx)
            : pageLabel(sIdx) + ' ／ 共 ' + M + ' 頁';
          return;
        }
        let vis = [];
        if (current === 0) vis = [0];
        else {
          const l = current * 2 - 1, r = current * 2;
          if (l < N) vis.push(l);
          if (r < N) vis.push(r);
        }
        const hasBack = vis.includes(N - 1);
        if (vis.length === 1 && vis[0] === 0) indicator.textContent = '封面';
        else if (vis.length === 1 && hasBack) indicator.textContent = '封底';
        else if (hasBack) indicator.textContent = '第 ' + vis[0] + ' 頁－封底';
        else indicator.textContent = '第 ' + vis[0] + '–' + vis[1] + ' 頁 ／ 共 ' + M + ' 頁';
      }

      function next() {
        if (mode === 'single') {
          if (sIdx < pages.length - 1) { sIdx++; update(); }
          return;
        }
        if (current >= maxCurrent()) return;
        const s = sheets[current]; raise(s); pulse(s);
        s.classList.add('flipped');
        current++; setTimeout(zorder, 1150); update();
      }
      function prev() {
        if (mode === 'single') {
          if (sIdx > 0) { sIdx--; update(); }
          return;
        }
        if (current <= 0) return;
        current--; const s = sheets[current]; raise(s); pulse(s);
        s.classList.remove('flipped');
        setTimeout(zorder, 1150); update();
      }

      /* ---------- 單／雙切換 ---------- */
      function setMode(m) {
        if (m !== mode) {
          if (m === 'single') {
            sIdx = current === 0 ? 0 : clamp(current * 2 - 1, 0, pages.length - 1);
          } else {
            current = clamp(Math.ceil(sIdx / 2), 0, maxCurrent());
            sheets.forEach((s, i) => {
              s.style.transition = 'none';
              s.classList.toggle('flipped', i < current);
            });
            zorder();
            requestAnimationFrame(() => sheets.forEach(s => s.style.transition = ''));
          }
        }
        mode = m;
        stage.classList.toggle('single', m === 'single');
        btnSingle.classList.toggle('active', m === 'single');
        btnDouble.classList.toggle('active', m === 'double');
        update();
      }
      btnSingle.addEventListener('click', () => setMode('single'));
      btnDouble.addEventListener('click', () => setMode('double'));

      /* ---------- 圖說開關 ---------- */
      let capsOn = false;
      const capBtn = document.getElementById('capBtn');
      const captionRow = document.getElementById('captionRow');
      const capL = document.getElementById('capL'), capR = document.getElementById('capR');
      capBtn.addEventListener('click', () => {
        capsOn = !capsOn;
        capBtn.classList.toggle('active', capsOn);
        capBtn.setAttribute('aria-pressed', capsOn);
        captionRow.classList.toggle('on', capsOn);
        updateCaptions();
      });
      function updateCaptions() {
        if (!capsOn) return;
        if (mode === 'single') {
          capL.textContent = pages[sIdx].caption || '';
          capR.textContent = '';
        } else if (current === 0) {
          capL.textContent = ''; capR.textContent = pages[0].caption || '';
        } else {
          const li = current * 2 - 1, ri = current * 2;
          capL.textContent = (pages[li] && pages[li].caption) || '';
          capR.textContent = (pages[ri] && pages[ri].caption) || '';
        }
      }

      /* 單面模式：單擊左右半翻頁；快速點兩下開啟光箱放大檢視 */
      let clickTimer = null;
      singleView.addEventListener('click', e => {
        if (clickTimer) {                       /* 第二下 → 光箱 */
          clearTimeout(clickTimer); clickTimer = null;
          openLightbox();
          return;
        }
        const x = e.clientX;
        clickTimer = setTimeout(() => {
          clickTimer = null;
          const r = singleMedia.getBoundingClientRect();
          (x < r.left + r.width / 2) ? prev() : next();
        }, 280);
      });

      /* ---------- 光箱：放大檢視照片細節 ---------- */
      function openLightbox() {
        lbMedia.innerHTML = '';
        const el = makeMedia(pages[sIdx].src, pageLabel(sIdx), true);
        lbMedia.appendChild(el);
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
      }
      function closeLightbox() {
        lightbox.hidden = true;
        lbMedia.innerHTML = '';
        document.body.style.overflow = '';
      }
      lbMedia.addEventListener('click', e => {
        e.stopPropagation();
        const el = lbMedia.firstChild;
        if (!el) return;
        if (el.classList.toggle('zoomed')) {    /* 以點擊位置為中心放大 */
          const r = el.getBoundingClientRect();
          el.style.transformOrigin =
            ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
        }
      });
      lightbox.addEventListener('click', closeLightbox);
      document.getElementById('lbClose').addEventListener('click', closeLightbox);

      /* 全站媒體的右鍵保護（無法百分之百防止，但能擋掉最直接的下載方式） */
      document.addEventListener('contextmenu', e => {
        if (e.target.closest('.single-media, .sheet, .lightbox')) e.preventDefault();
      });

      /* ---------- 拖曳翻頁（雙面模式） ---------- */
      let drag = null;
      function dragProgress(x) {
        const { rect, dir } = drag;
        return dir === 1 ? clamp((rect.right - x) / rect.width, 0, 1)
          : clamp((x - rect.left) / rect.width, 0, 1);
      }
      function setAngle(sheet, dir, p) {
        const ang = dir === 1 ? -180 * p : -180 * (1 - p);
        sheet.style.transform = 'rotateY(' + ang + 'deg)';
        const s = Math.sin(p * Math.PI) * 0.5;
        sheet.querySelectorAll('.shade').forEach(el => el.style.opacity = s);
      }
      bookEl.addEventListener('pointerdown', e => {
        if (mode !== 'double') return;
        const rect = bookEl.getBoundingClientRect();
        const fwd = e.clientX > rect.left + rect.width / 2;
        if (fwd && current < maxCurrent()) drag = { dir: 1, sheet: sheets[current], rect, sx: e.clientX, moved: false };
        else if (!fwd && current > 0) drag = { dir: -1, sheet: sheets[current - 1], rect, sx: e.clientX, moved: false };
        if (drag) {
          drag.sheet.style.transition = 'none';
          raise(drag.sheet);
          bookEl.setPointerCapture(e.pointerId);
        }
      });
      bookEl.addEventListener('pointermove', e => {
        if (!drag) return;
        if (Math.abs(e.clientX - drag.sx) > 6) drag.moved = true;
        if (drag.moved) setAngle(drag.sheet, drag.dir, dragProgress(e.clientX));
      });
      function endDrag(e) {
        if (!drag) return;
        const { sheet, dir, moved } = drag;
        const p = dragProgress(e.clientX);
        drag = null;
        sheet.style.transition = '';
        sheet.querySelectorAll('.shade').forEach(el => el.style.opacity = '');
        sheet.style.transform = '';
        if (!moved) { dir === 1 ? next() : prev(); return; }
        if (p > 0.38) {
          if (dir === 1) { sheet.classList.add('flipped'); current++; }
          else { sheet.classList.remove('flipped'); current--; }
          update();
        }
        setTimeout(zorder, 1150);
      }
      bookEl.addEventListener('pointerup', endDrag);
      bookEl.addEventListener('pointercancel', endDrag);

      /* ---------- 書本 3D 姿態：滑鼠靠近時微微偏轉（最大 ±2.5°） ---------- */
      if (!reducedMotion) {
        const bookWrap = bookEl.parentElement;
        let tTX = 0, tTY = 0, tX = 0, tY = 0;
        bookWrap.addEventListener('pointermove', e => {
          if (mode !== 'double') return;
          const r = bookEl.getBoundingClientRect();
          const nx = clamp((e.clientX - r.left) / r.width, 0, 1) - 0.5;
          const ny = clamp((e.clientY - r.top) / r.height, 0, 1) - 0.5;
          tTY = nx * 5; tTX = -ny * 5;   /* 最大 ±2.5 度 */
        });
        bookWrap.addEventListener('pointerleave', () => { tTX = 0; tTY = 0; });
        (function tiltLoop() {
          tX += (tTX - tX) * 0.06; tY += (tTY - tY) * 0.06;
          bookEl.style.transform = mode === 'double'
            ? 'rotateX(' + tX.toFixed(2) + 'deg) rotateY(' + tY.toFixed(2) + 'deg)'
            : '';
          requestAnimationFrame(tiltLoop);
        })();
      }

      /* ---------- 足跡世界地圖（Canvas 點陣） ---------- */
      let mapBase = null, mapW = 0, mapH = 0, mapPlaces = [], mapAnimating = false;
      const landBytes = Uint8Array.from(atob(LAND_MASK), ch => ch.charCodeAt(0));

      function layoutMap() {
        const w = mapCv.clientWidth;
        if (!w) return;
        mapW = w;
        mapH = Math.round(w * (MAP_ROWS / MAP_COLS));
        const dpr = Math.min(devicePixelRatio || 1, 2);
        mapCv.width = mapW * dpr; mapCv.height = mapH * dpr;
        mapCv.style.height = mapH + 'px';
        mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        /* 底圖只畫一次，之後每幀直接貼上 */
        mapBase = document.createElement('canvas');
        mapBase.width = mapW * dpr; mapBase.height = mapH * dpr;
        const g = mapBase.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cw = mapW / MAP_COLS, ch = mapH / MAP_ROWS, rr = Math.min(cw, ch) * 0.3;
        g.fillStyle = 'rgba(169,199,218,.28)';
        for (let r = 0; r < MAP_ROWS; r++) {
          for (let c = 0; c < MAP_COLS; c++) {
            const idx = r * MAP_COLS + c;
            if ((landBytes[idx >> 3] >> (idx & 7)) & 1) {
              g.beginPath();
              g.arc((c + 0.5) * cw, (r + 0.5) * ch, rr, 0, 7);
              g.fill();
            }
          }
        }
      }

      function project(lat, lng) {
        return {
          x: (lng + 180) / 360 * mapW,
          y: (MAP_LAT_TOP - lat) / (MAP_LAT_TOP - MAP_LAT_BOT) * mapH
        };
      }

      function drawMapFrame(t) {
        if (!mapBase) return;
        mctx.clearRect(0, 0, mapW, mapH);
        mctx.drawImage(mapBase, 0, 0, mapW, mapH);
        mapPlaces.forEach((p, i) => {
          const { x, y } = project(p.lat, p.lng);
          /* 呼吸光圈：淡金色，由內往外擴散淡出 */
          const cycle = reducedMotion ? 0.5 : ((t + i * 700) % 2200) / 2200;
          const pr = 6 + cycle * 18;
          mctx.beginPath(); mctx.arc(x, y, pr, 0, 7);
          mctx.strokeStyle = 'rgba(242,220,168,' + ((1 - cycle) * 0.6).toFixed(3) + ')';
          mctx.lineWidth = 1.2; mctx.stroke();
          /* 定位點：淡黃色微光 */
          const glow = mctx.createRadialGradient(x, y, 0, x, y, 9);
          glow.addColorStop(0, 'rgba(246,228,178,.9)');
          glow.addColorStop(1, 'rgba(246,228,178,0)');
          mctx.fillStyle = glow;
          mctx.beginPath(); mctx.arc(x, y, 9, 0, 7); mctx.fill();
          mctx.beginPath(); mctx.arc(x, y, 4.4, 0, 7);
          mctx.fillStyle = '#F6E4B2'; mctx.fill();
          /* 地名 */
          mctx.font = '300 14px "Noto Serif TC",serif';
          mctx.textAlign = 'center';
          mctx.fillStyle = 'rgba(246,235,210,.92)';
          const ty = y > 24 ? y - 14 : y + 26;
          mctx.fillText(p.name, clamp(x, 40, mapW - 40), ty);
        });
        if (!reducedMotion && mapAnimating) requestAnimationFrame(drawMapFrame);
      }

      function updateMapPlaces() {
        mapPlaces = (book && book.places) ? book.places : [];
        mapBlock.style.display = mapPlaces.length ? '' : 'none';
        if (!mapPlaces.length) { mapAnimating = false; return; }
        layoutMap();
        if (reducedMotion) { drawMapFrame(0); }
        else if (!mapAnimating) { mapAnimating = true; requestAnimationFrame(drawMapFrame); }
      }

      /* ---------- 控制列與鍵盤 ---------- */
      document.getElementById('nextBtn').addEventListener('click', next);
      document.getElementById('prevBtn').addEventListener('click', prev);
      addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeLightbox(); closeMenu(); return; }
        if (!lightbox.hidden) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      });
      addEventListener('resize', () => { bookSize(); if (mapPlaces.length) layoutMap(); });

      /* ---------- 初始化：讀取網址（#book主題-書本），預設單面 ---------- */
      function fromHash() {
        const m = location.hash.match(/^#book(\d+)(?:-(\d+))?$/);
        return m ? [parseInt(m[1], 10) - 1, m[2] ? parseInt(m[2], 10) - 1 : 0] : [0, 0];
      }
      const [ci, bi] = fromHash();
      selectBook(ci, bi);
      setMode('single');
      if (location.hash.match(/^#book/)) {
        setTimeout(() => document.getElementById('book').scrollIntoView(), 150);
      }
      addEventListener('hashchange', () => {
        const [c, b] = fromHash();
        if (c !== activeCol || b !== activeIdx) selectBook(c, b);
      });
    })();
