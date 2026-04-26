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

使用 Tailwind CSS 響應式 breakpoint 實作，依螢幕寬度自動切換佈局：

| 尺寸 | 寬度 | 裝置 | 佈局 |
|------|------|------|------|
| 手機 | `< 768px` | 手機 | 單欄切換：聊天列表與聊天室擇一顯示；ChatList 右上角 ⚙️ 含 New Chat、Edit Profile、Sign Out |
| 平板 | `768px – 1024px` | 平板、小筆電 | 雙欄：ChatList（`w-56`）+ ChatArea；IconBar 隱藏 |
| 桌機 | `≥ 1024px` | 桌機 | 完整三欄：IconBar + ChatList（`w-64`）+ ChatArea |

手機版點選聊天室後自動切換到聊天畫面，ChatArea header 左側顯示 ← 返回按鈕可回到列表。

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
│   ├── useMessages.js            訊息監聽、發送、收回、編輯、Emoji Reaction
│   ├── useUserProfile.js         使用者資料讀寫
│   ├── useBlockUser.js           封鎖/解封使用者
│   └── useNotifications.js       Chrome Notification（Web Notifications API）
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

### Emoji Reaction (3%)

**位置：** 聊天室 → Hover 到任一訊息

1. Hover 到任意訊息，右側（對方訊息）或左側（自己的訊息）出現 😊 按鈕
2. 點 😊 按鈕，開啟 Reaction Picker（6 個 emoji：🔥 💀 🫡 🤌 🥹 💯）
3. 點選 emoji，該表情顯示在訊息下方，附帶數量
4. 每人對同一則訊息只能有一個 emoji；再選同一個 → 取消，選另一個 → 替換
5. 自己按過的 emoji 以橘色底色標示

---

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

## 完整測試流程（Test Cases）

> 建議準備：同時開兩個瀏覽器視窗，分別登入 `test0@test.com`（joshua）和 `test1@test.com`（sullyoon）

---

### TC-01｜Email 註冊 / 登入

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 開啟網站，點 **Sign Up**，輸入新 Email 和 6 碼以上密碼，點 **Create Account** | 成功建立帳號並進入聊天室 |
| 2 | 登出後點 **Sign In**，輸入剛才的 Email 和密碼 | 成功登入 |
| 3 | 輸入錯誤密碼點 Sign In | 顯示「Wrong password」錯誤訊息 |
| 4 | 輸入不存在的 Email | 顯示「No account found」錯誤訊息 |
| 5 | 密碼少於 6 碼 | 顯示「Password too short」錯誤訊息 |

---

### TC-02｜Firebase Hosting

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 瀏覽器打開 https://midterm-project-113033158.web.app | 正常顯示登入頁，功能與本地版一致 |

---

### TC-03｜Database 讀寫

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 登入後在聊天室發送一則訊息 | 訊息即時出現，另一個帳號也可見 |
| 2 | 重新整理頁面 | 歷史訊息仍然存在 |
| 3 | 未登入時直接進入網站 | 無法看到任何聊天資料，被導向登入頁 |

---

### TC-04｜RWD 響應式設計

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 桌機（≥ 1024px）：正常開啟網站 | 完整三欄：IconBar + ChatList + ChatArea |
| 2 | 平板（768–1024px）：拖曳縮小視窗 | 雙欄：ChatList + ChatArea，IconBar 隱藏 |
| 3 | 手機（< 768px）：繼續縮小視窗 | 只顯示 ChatList，點進聊天室才顯示 ChatArea |
| 4 | 手機模式下點進聊天室 | ChatArea 全螢幕，左上角有 ← 返回按鈕 |
| 5 | 手機模式按 ← 按鈕 | 回到 ChatList |
| 6 | 手機模式點右上角 ⚙️ | 下拉選單顯示 New Chat / Edit Profile / Sign Out |

---

### TC-05｜Git 版本控制

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 開啟 https://github.com/joshuachang1111/Midterm_Project_113033158 | 可看到多次 commit 紀錄，時間分散在不同日期 |

---

### TC-06｜聊天室（一對一）

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 點左側 **+** → **Direct** → 搜尋 `sullyoon` → 點選 | 建立並進入與 sullyoon 的私人聊天室 |
| 2 | 輸入訊息按 Enter | 訊息出現在右側（自己），sullyoon 視窗即時收到 |
| 3 | 重新整理頁面 | 歷史訊息全部保留 |
| 4 | 再次點 **+** → 搜尋同一位使用者 | 開啟同一個已存在的聊天室（不重複建立） |

---

### TC-07｜聊天室（群組）

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 點 **+** → **Group** → 選 2 人以上 → 點 **Create Group** | 建立群組，進入群組聊天室 |
| 2 | 在群組發送訊息 | 所有成員即時收到，訊息顯示發訊者名稱 |
| 3 | 右上角 **⋯** → **Add Members** → 搜尋並點 Add | 新成員加入，系統訊息顯示「XXX joined the group」 |
| 4 | 右上角 **⋯** → **Leave Group** | 離開群組，系統訊息顯示「XXX left the group」 |
| 5 | 右上角 **⋯** → **Edit Group** → 修改名稱或上傳頭像 | 群組名稱 / 頭像即時更新 |

---

### TC-08｜Google 第三方登入

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 登入頁點 **Continue with Google** | 跳出 Google OAuth 視窗 |
| 2 | 選擇 Google 帳號 | 登入成功，進入聊天室 |

---

### TC-09｜Chrome Notification（需在 Chrome 上測試）

**前置：** 系統設定 → 通知 → Google Chrome Helper (Alerts) → 允許通知

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 開啟網站，瀏覽器詢問通知權限，點「允許」 | 權限設定成功 |
| 2 | 開兩個視窗，其中一個切到其他分頁（非 focus） | — |
| 3 | 另一個視窗發送訊息 | 非 focus 的視窗收到桌面通知，顯示發訊者名稱與訊息內容 |
| 4 | 在 focus 的視窗發訊息給自己 | 不觸發通知（只提醒未讀訊息）|
| 5 | 群組收訊息時 | 通知顯示「發訊者 — 群組名稱」 |

---

### TC-10｜CSS 動畫

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 開啟登入頁（或重新整理） | 卡片有 3D 翻牌進場動畫 |
| 2 | 移動滑鼠到登入卡片上 | 卡片跟著滑鼠傾斜，邊緣有動態 box-shadow |
| 3 | 進入聊天室，發送一則訊息 | 自己的訊息從右側帶 3D 動畫飛入 |
| 4 | 另一帳號傳訊息來 | 對方訊息從左側帶 3D 動畫飛入 |

---

### TC-11｜XSS 防護

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 在聊天室輸入 `<script>alert("example");</script>` 並送出 | 顯示純文字，不執行 alert |
| 2 | 輸入 `<h1>example</h1>` 並送出 | 顯示純文字 `<h1>example</h1>`，不渲染成大標題 |
| 3 | 輸入 `<img src=x onerror=alert(1)>` 並送出 | 顯示純文字，不執行任何腳本 |

---

### TC-12｜User Profile

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 桌機：點左側 IconBar 人頭 icon；手機：點 ⚙️ → Edit Profile | Profile Modal 跳出 |
| 2 | 點圓形頭像 → 選擇本地圖片 | 頭像上傳並顯示預覽 |
| 3 | 修改 Username，點 **Save Profile** | 儲存成功，ChatList 左上角頭像和名稱更新 |
| 4 | 修改 User ID 為已使用的 ID | 即時顯示「This ID is taken」紅色提示 |
| 5 | Email 欄位 | 顯示但無法修改（唯讀）|
| 6 | 填入電話和地址，儲存 | 資料存入 Firestore |
| 7 | 進入聊天室 | 對方看到更新後的頭像和 username |

---

### TC-13｜Message Operations

#### Unsend（收回）

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | Hover 自己的文字訊息 | 左側出現 **Unsend** 按鈕 |
| 2 | 點 Unsend → 確認 | 訊息變成灰色斜體「This message was unsent」，雙方皆可見 |
| 3 | Hover 自己的圖片訊息 | 出現 Unsend 按鈕，可收回圖片 |
| 4 | Hover 對方的訊息 | 不出現 Unsend 按鈕 |

#### Edit（編輯）

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | Hover 自己的文字訊息 | 左側出現 **Edit** 按鈕 |
| 2 | 點 Edit → 修改文字 → Save | 訊息更新，顯示 `(edited)` 標記 |
| 3 | 點 Edit → 按 Esc 或 Cancel | 取消編輯，訊息不變 |
| 4 | Hover 自己的圖片訊息 | 沒有 Edit 按鈕（只能 Unsend）|

#### Search（搜尋）

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 點右上角放大鏡 icon | 搜尋列展開 |
| 2 | 輸入關鍵字 | 符合的訊息以橘色外框高亮，顯示「1 / N」 |
| 3 | 點 ▼ 或 ▲ | 跳到下一個 / 上一個結果，自動 scroll |
| 4 | 點 ✕ | 搜尋列收起，高亮消失 |
| 5 | 搜尋不存在的關鍵字 | 顯示「No results」 |

#### Send Image（傳圖）

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 點輸入框左側圖片 icon，選一張圖 | 半透明預覽 + 轉圈動畫出現 |
| 2 | 上傳完成 | 圖片訊息出現在聊天室 |
| 3 | 點圖片 | 放大預覽 Modal 出現，點外部關閉 |
| 4 | Hover 圖片訊息 → Unsend | 圖片訊息被收回 |

---

### TC-14｜AI Chatbot

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 點 **+** → **AI Chat** → **Chat with AI** | 進入 AI Assistant 聊天室 |
| 2 | 輸入任意訊息，按 Enter | 出現三點跳動動畫（typing indicator）|
| 3 | 等待約 2–5 秒 | AI 以幽默風趣方式回覆 |
| 4 | 用中文問問題 | AI 以中文回答；用英文問則英文回 |

---

### TC-15｜Block User

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 進入與 sullyoon 的私人聊天，點右上角 **⋯** → **Block User** | 輸入框顯示警告，無法發訊息 |
| 2 | sullyoon 帳號嘗試在此聊天室發訊息 | sullyoon 的輸入框也顯示警告 |
| 3 | 在共同群組中 | 雙方訊息互相隱藏 |
| 4 | 點 **⋯** → **Unblock User** | 解除封鎖，雙方恢復正常發訊 |

---

### TC-16｜Send GIF

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | 點輸入框旁 **GIF** 按鈕 | GIF 選擇面板開啟，顯示 Trending GIFs |
| 2 | 在搜尋框輸入關鍵字（如 `cat`）| 顯示相關 GIF |
| 3 | 點選一個 GIF | GIF 直接送出到聊天室，面板關閉 |
| 4 | 點聊天室中的 GIF | 放大預覽 |
| 5 | Hover GIF → Unsend | GIF 訊息被收回 |

---

### TC-17｜Emoji Reaction

| # | 步驟 | 預期結果 |
|---|------|---------|
| 1 | Hover 任意訊息 | 旁邊出現 😊 按鈕 |
| 2 | 點 😊 → 選擇 🔥 | 🔥 出現在訊息下方，顯示「🔥 1」，橘底表示自己選的 |
| 3 | 同一訊息再點 😊 → 選同一個 🔥 | Reaction 取消，消失 |
| 4 | 選 🔥 後再選 💀 | 替換為 💀（每人只能一個）|
| 5 | 另一帳號對同一訊息也點 🔥 | 顯示「🔥 2」 |

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
