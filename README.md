# Chatroom — CS2410 Software Studio 軟體設計實驗 期中作業

**學號：** 113033158  
**GitHub：** [joshuachang1111/Midterm_Project_113033158](https://github.com/joshuachang1111/Midterm_Project_113033158)  
**Firebase Hosting：** https://midterm-project-113033158.web.app

---

## 本地環境建置

### 前置需求
- Node.js v18 以上
- npm

### Step 1 — Clone 專案

```bash
git clone https://github.com/joshuachang1111/Midterm_Project_113033158.git
cd Midterm_Project_113033158
```

### Step 2 — 安裝套件

```bash
npm install
```

### Step 3 — 建立 `.env` 檔案

在專案根目錄（與 `package.json` 同層）建立 `.env` 檔案，貼上以下內容：

```
VITE_FIREBASE_API_KEY=AIzaSyCCpYMnW8NOYxxnIOeG0ARc2tWK9t0b-JY
VITE_FIREBASE_AUTH_DOMAIN=midterm-project-113033158.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=midterm-project-113033158
VITE_FIREBASE_STORAGE_BUCKET=midterm-project-113033158.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=955037897085
VITE_FIREBASE_APP_ID=1:955037897085:web:8ffe965bbb09b02278fc14
VITE_CLOUDINARY_CLOUD_NAME=dynzpaa0u
VITE_CLOUDINARY_UPLOAD_PRESET=chatroom_upload
VITE_GIPHY_API_KEY=1fGdERQoqpbpK6YKWeFqYdmaMXV531zw
VITE_OPENAI_API_KEY=請填入自己的 OpenAI API Key，或使用下方測試帳號登入網站測試
```

> **注意：** AI Chatbot 功能需要 OpenAI API Key。若無 Key，請直接使用下方測試帳號登入網站測試，無需在本地設定。

### Step 4 — 啟動開發伺服器

```bash
npm run dev
```

### Step 5 — 開啟網站

瀏覽器打開 http://localhost:5173

---

## 測試帳號

| Email | 密碼 | Username |
|-------|------|----------|
| test0@test.com | test123456 | joshua |
| test1@test.com | test123456 | sullyoon |
| test2@test.com | test123456 | haewon |

> 建議同時開兩個瀏覽器視窗，分別登入不同帳號，測試即時訊息功能。

---

## Basic 功能

### Email 註冊 / 登入 (5%)

**位置：** 開啟網站後的登入頁面

1. 點選上方 **Sign Up** 頁籤 → 輸入 Email 和密碼（至少 6 碼）→ 點 **Create Account**
2. 點選 **Sign In** 頁籤 → 輸入 Email 和密碼 → 點 **Sign In**
3. 密碼欄位右側有眼睛按鈕可顯示/隱藏密碼
4. 輸入錯誤時顯示對應錯誤訊息（密碼錯誤、帳號不存在、密碼太短等）

---

### Firebase Hosting (5%)

**網址：** https://midterm-project-113033158.web.app

以 `npm run build` 建置後，使用 Firebase CLI 部署至 Firebase Hosting，並確認網站可正常運作。

---

### Database 讀寫 (5%)

使用 Firebase Firestore 作為後端資料庫。所有讀寫操作皆在使用者完成 Firebase Auth 認證後執行，未登入時無法存取任何資料。

- `onSnapshot` 即時監聽訊息、聊天室列表、使用者資料
- 訊息發送、收回、編輯直接寫入 Firestore
- 使用者個人資料儲存於 `users/{uid}` 文件

---

### RWD (5%)

使用 Tailwind CSS 的響應式工具類別實作。主要佈局採用 `flex` + `overflow-hidden`，確保在不同尺寸裝置上所有元件皆可見。聊天室側邊欄固定寬度，主聊天區域 `flex-1` 填滿剩餘空間。

---

### Git 版本控制 (5%)

定期 commit，可在 GitHub 查看完整 commit 紀錄，每次 commit 皆有清楚說明。

---

### 聊天室 (25%)

#### 一對一私人聊天

**位置：** 左側列表上方的 **+** 按鈕

1. 點 **+** → 選擇 **Direct** 頁籤
2. 搜尋框輸入使用者名稱、userId 或 email
3. 點選使用者，自動建立聊天室（若已存在則開啟舊的）並進入
4. 在輸入框輸入訊息，按 Enter 或點送出按鈕發送
5. 歷史訊息自動從 Firestore 載入

#### 群組聊天 + 邀請成員

**建立群組：**
1. 點 **+** → 選擇 **Group** 頁籤
2. 可選擇上傳群組頭像（選填）
3. 輸入群組名稱（選填）
4. 搜尋並勾選至少 2 名成員
5. 點 **Create Group**

**邀請新成員：**
進入群組 → 右上角 **⋯** → **Add Members** → 搜尋並點 Add

**離開群組：**
右上角 **⋯** → **Leave Group**

---

## Advanced 功能

### React Framework (5%)

使用 React 19 + Vite 建立，完整元件化架構：

```
src/
├── components/
│   ├── Chat/
│   │   ├── ChatArea.jsx          主容器（state 管理、bot 回覆邏輯）
│   │   ├── ChatHeader.jsx        Header + 搜尋列
│   │   ├── ChatInput.jsx         輸入框 + 圖片 + GIF
│   │   ├── MessageList.jsx       訊息列表渲染
│   │   ├── GroupAvatars.jsx      群組多人頭像元件
│   │   ├── GifPicker.jsx         GIF 選擇面板（Giphy API）
│   │   ├── EditGroupModal.jsx    編輯群組名稱/頭像
│   │   ├── NewChatModal.jsx      新增聊天室 Modal
│   │   └── modals/
│   │       ├── EditMessageModal.jsx
│   │       ├── ImagePreviewModal.jsx
│   │       └── AddMembersModal.jsx
│   ├── Sidebar/
│   │   ├── ChatList.jsx          左側聊天列表
│   │   └── IconBar.jsx           左側 icon 導覽列
│   └── Profile/
│       └── ProfileModal.jsx      個人資料編輯 Modal
├── context/
│   └── AuthContext.jsx           Firebase Auth 狀態管理
├── hooks/
│   ├── useChats.js               聊天室列表、建立聊天室
│   ├── useMessages.js            訊息監聽、發送、收回、編輯
│   ├── useUserProfile.js         使用者資料讀寫
│   └── useBlockUser.js           封鎖/解封使用者
├── pages/
│   ├── AuthPage.jsx              登入/註冊頁
│   └── ChatPage.jsx              主聊天頁面
└── utils/
    ├── cloudinary.js             圖片上傳至 Cloudinary
    └── escapeHtml.js             HTML 特殊字元跳脫（XSS 防護參考用）
```

---

### Google 登入 (1%)

**位置：** 登入頁面最下方

1. 點選 **Continue with Google** 按鈕
2. 跳出 Google OAuth 視窗，選擇帳號
3. 登入成功後自動進入聊天室

---

### Chrome Notification (5%)

**前置步驟：** 開啟網站後，瀏覽器會詢問是否允許通知，請點「允許」。

**觸發條件：** 瀏覽器視窗不在前景（minimized 或切換到其他分頁）時，收到新訊息會發出 Chrome 通知。

1. 開啟兩個瀏覽器視窗，分別登入不同帳號
2. 將其中一個視窗最小化或切換到其他分頁
3. 在另一個視窗發送訊息
4. 最小化的視窗會收到 Chrome 通知（顯示發訊者和訊息內容）

> 使用 Web Notifications API，只有未讀訊息（視窗非 focus 時收到的）才觸發通知。

---

### User Profile (10%)

**位置：** 左側 IconBar → 最下方人頭 icon

1. 點人頭 icon，跳出 Profile Modal
2. 點圓形頭像可上傳大頭照（上傳至 Cloudinary CDN）
3. 可修改：
   - **Username**：顯示名稱（必填）
   - **User ID**：唯一的 @handle，即時檢查是否被使用（必填）
   - **Phone**：電話（選填）
   - **Address**：地址（選填）
   - **Email**：顯示用，不可修改
4. 點 **Save Profile** 儲存至 Firestore
5. 聊天室中顯示頭像和 username

---

### Message Operations (10%)

#### Unsend（收回訊息）

**位置：** 聊天室 → 自己的訊息

1. Hover 到自己的訊息（文字、圖片、GIF 皆可）
2. 左側出現紅色 **Unsend** 按鈕
3. 點擊確認後訊息變成灰色斜體「*This message was unsent*」（雙方皆可見）

#### Edit（編輯訊息）

**位置：** 聊天室 → 自己的文字訊息

1. Hover 到自己的文字訊息（圖片/GIF 無法編輯）
2. 左側出現 **Edit** 按鈕
3. 點擊後跳出編輯 Modal
4. 修改後 **Save** 或 Enter 儲存；**Cancel** 或 Esc 取消
5. 儲存後顯示 `(edited)` 標記

#### Search（搜尋訊息）

**位置：** 聊天室右上角放大鏡 icon

1. 點放大鏡 icon，搜尋列出現
2. 輸入關鍵字，符合的訊息高亮（橘色外框）
3. 顯示「第 N 個 / 共 N 個結果」
4. ▲ ▼ 按鈕可跳轉各結果，自動 scroll 到該訊息
5. ✕ 關閉搜尋

#### Send Image（傳送圖片）

**位置：** 輸入框左側圖片 icon

1. 點圖片 icon → 選擇本地圖片
2. 上傳中顯示半透明預覽 + 轉圈動畫
3. 上傳完成後圖片出現在聊天室
4. 點圖片可放大預覽
5. Hover 圖片訊息 → **Unsend** 可收回

---

### XSS 防護 (2%)

**測試方式：**
- 輸入 `<script>alert("example");</script>` 送出 → 顯示純文字，不執行 alert
- 輸入 `<h1>example</h1>` 送出 → 顯示純文字，不渲染成大標題

**實作方式：** 訊息文字透過 React JSX 的 `{msg.text}` 渲染，React 預設 escape 所有 HTML 字元，無法注入 HTML 或執行 JavaScript。

---

### CSS Animation (2%)

**登入頁面 3D 效果：**
1. 開啟登入頁 → 卡片以 3D 翻牌動畫進場（`perspective + rotateY`）
2. 動畫結束後移動滑鼠到卡片上
3. 卡片跟著滑鼠傾斜，邊緣出現動態 box-shadow 模擬 3D 厚度
4. 滑鼠移開後平滑回正

**訊息進場動畫：**
- 自己的訊息（右）：帶 3D rotateY 從右飛入（`animate-slide-in-right`）
- 對方的訊息（左）：帶 3D rotateY 從左飛入（`animate-slide-in-left`）

**ChatList 淡入：**
- 左側列表項目出現時有 fadeIn 淡入動畫（`animate-fade-in`）

---

## Bonus 功能

### Block User (2%)

**位置：** 一對一聊天室右上角 **⋯** → **Block User**

**封鎖邏輯：**
- User A 封鎖 User B 後，B 無法對 A 發送私訊（輸入框顯示警告）
- 若已有聊天紀錄，聊天 UI 顯示「You can no longer send messages in this conversation.」
- 同一群組中，被封鎖者的訊息對封鎖者隱藏（雙向）
- 右上角 **⋯** → **Unblock** 可解除封鎖

---

### Send GIF (3%)

**位置：** 輸入框旁的 **GIF** 按鈕

1. 點 **GIF** 按鈕，開啟 GIF 選擇面板
2. 預設顯示 Trending GIFs（最多 24 個，Giphy API）
3. 搜尋框輸入關鍵字搜尋（例如：happy、cat）
4. 點選 GIF 直接送出到聊天室
5. 點 GIF 可放大預覽
6. Hover GIF 訊息 → **Unsend** 可收回

---

### AI Chatbot (2%)

**位置：** 點 **+** → 選擇 **AI Chat** 頁籤

> 此功能需要 OpenAI API Key。本地測試請在 .env 填入 VITE_OPENAI_API_KEY；或直接使用測試帳號登入網站測試。

1. 點 **+** → **AI Chat** 頁籤 → 點 **Chat with AI**
2. 進入 AI Assistant 聊天室
3. 輸入任何訊息，AI 以幽默風趣方式回覆（繁體中文或英文）
4. 等待時顯示三點跳動動畫（typing indicator）

**使用模型：** OpenAI gpt-4o-mini

---

## 使用技術與服務

| 技術 / 服務 | 用途 |
|-------------|------|
| React 19 + Vite | 前端框架 |
| Tailwind CSS v4 | UI 樣式 |
| Firebase Auth | 使用者認證（Email + Google OAuth） |
| Firebase Firestore | 即時資料庫 |
| Firebase Hosting | 靜態網站部署 |
| Cloudinary | 圖片上傳（頭像、聊天圖片） |
| Giphy API | GIF 搜尋與顯示 |
| OpenAI API (gpt-4o-mini) | AI Chatbot |
