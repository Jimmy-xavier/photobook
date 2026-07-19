/* ============================================================
   books.js — 攝影書資料檔
   之後新增書、改圖說、改地點，只要編輯這個檔案，不用碰 index.html
   ------------------------------------------------------------
   ◆ 結構：COLLECTIONS（主題）→ 每個主題底下有多本 books
   ◆ 每本書的欄位：
       title    書名
       folder   圖片資料夾（例如 'vol3_xxx'）
       count    「內頁」張數（不含封面封底）
       ratio    頁面比例＝高÷寬（1=正方形、1.414=A4直式、0.75=4:3橫式）
       clips    哪幾頁是影片（可省略）。例如 { 4:'mp4', 5:'mov' }
                → 第 4 頁會讀 p04.mp4、第 5 頁讀 p05.mov，其餘讀 .jpg
       captions 圖說（可省略，想加哪頁就寫哪頁）：
                { cover:'封面的說明', 1:'第1頁的說明', 6:'第6頁的說明', back:'封底的說明' }
       places   足跡地圖的地點：[{ name:'地名', lat:緯度, lng:經度 }]
       pages    留空陣列 [] 即可，網站會依 folder/count/clips 自動組出檔名
   ◆ 檔名規則：cover.jpg、p01.jpg、p02.jpg…（兩位數）、back.jpg
   ◆ 新增一本書：複製一個 { ... } 區塊、改欄位就完成，選單自動出現
   ============================================================ */
const COLLECTIONS = [
  {
    en: 'Vol. I', title: '日本東北', books: [
      {
        title: '御釜', folder: 'vol1_okama', count: 14, ratio: 1, pages: [],
        clips: {},
        captions: {
          /* 範例（想用再取消註解）：
          cover: '藏王・御釜',
          1: '清晨的火口湖，霧還沒散',
          */
          cover: '藏王・御釜',
          1: '巴士纜車套票',
          2: '後面的還沒完成',
        },
        tint: ['#16222F', '#0C141F', 'rgba(169,199,218,.24)'],
        places: [
          { name: '御釜', lat: 38.14, lng: 140.44, page: 1 },
        ]
      },
    ]
  },
  {
    en: 'Vol. II', title: 'The Last Summer', books: [
      {
        title: '瑞士策馬特', folder: 'vol2_zermatt', count: 6, ratio: 1, pages: [],
        clips: { 4: 'mp4', 5: 'mp4' },   /* 第 4、5 頁是影片 */
        captions: {},
        tint: ['#1B2620', '#0E1512', 'rgba(168,196,178,.24)'],
        places: [
          { name: 'Zermatt', lat: 45.98, lng: 7.76 },
        ]
      },
    ]
  },
];
