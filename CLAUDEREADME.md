# CLAUDE INTERNAL REFERENCE
> 這份文件是給 Claude 自己看的，不用提交。每次對話開始前先讀這份。

---

## 專案概述

**CS2410 期中作業** — React + Firebase 即時聊天應用  
**學號：** 113033158  
**截止：** 2026/05/07 23:59  
**技術棧：** React 19, Vite, Tailwind CSS v4, Firebase Auth + Firestore, Cloudinary, Giphy API, OpenAI gpt-4o-mini

---

## 關鍵規則

1. **改動前必須溝通**，等用戶說「好去做」才執行
2. **每次改動後必附 AI Reference**，格式：
   ```
   **AI Reference**
   使用者 prompt：...
   Claude 產出：
   - 修改 src/xxx.jsx：說明改了什麼、為什麼
   ```
3. **每次改動後告訴用戶怎麼測試**
4. **全程用中文溝通**
5. **不用 Gemini**，只用 OpenAI（`VITE_OPENAI_API_KEY`，model: `gpt-4o-mini`）
6. **不裝新套件**，除非用戶同意
7. **直接改主資料夾的檔案**（`/Midterm_Project_113033158/src/...`）

---

## 檔案地圖

```
src/
├── pages/
│   ├── AuthPage.jsx          登入/註冊頁，含 Email + Google OAuth，3D card 動畫
│   └── ChatPage.jsx          主頁，組裝 IconBar + ChatList + ChatArea + Modals
│
├── components/
│   ├── Sidebar/
│   │   ├── IconBar.jsx       最左邊 icon 列（profile、new chat 等）
│   │   └── ChatList.jsx      聊天列表；讀 useChats、useBlockStatus；ChatItem 子元件
│   │
│   ├── Chat/
│   │   ├── ChatArea.jsx      ★ 最複雜的檔案。state 全在這：
│   │   │                       chatData, otherUser, members, memberProfiles
│   │   │                       text, sending, botTyping
│   │   │                       showMenu, showAddMembers, showEditGroup
│   │   │                       hoveredMsgId, editingMessage, previewImage
│   │   │                       showSearch, searchQuery, searchResults, searchIndex
│   │   │                       uploadingImage, uploadingImagePreview, showGifPicker
│   │   │                     bot 回覆邏輯在 handleBotReply()，呼叫 OpenAI API
│   │   │                     傳給 MessageList 的 props 很多，新功能 state 也加在這
│   │   │
│   │   ├── ChatHeader.jsx    Header bar，含搜尋 icon、⋯ 選單
│   │   ├── ChatInput.jsx     輸入框；props: text, setText, onSend, cannotSend（block 時顯示警告）
│   │   ├── MessageList.jsx   訊息列表；接收 blockedUids prop 過濾訊息（目前 ChatArea 沒傳）
│   │   ├── GroupAvatars.jsx  群組頭像疊加效果
│   │   ├── GifPicker.jsx     Giphy API picker，floating panel
│   │   ├── EditGroupModal.jsx
│   │   ├── NewChatModal.jsx  含 Direct / Group / AI Chat 三個 tab
│   │   └── modals/
│   │       ├── EditMessageModal.jsx
│   │       ├── ImagePreviewModal.jsx
│   │       └── AddMembersModal.jsx
│   │
│   └── Profile/
│       └── ProfileModal.jsx  編輯 username、userId（唯一性檢查）、phone、address、頭像
│
├── context/
│   └── AuthContext.jsx       Firebase Auth onAuthStateChanged，提供 currentUser
│
├── hooks/
│   ├── useChats.js           useChats(uid)：監聽 chatrooms where members contains uid
│   │                         markAsRead、findExistingChat、createChat
│   ├── useMessages.js        useMessages(chatroomId)：監聽 messages subcollection
│   │                         sendMessage, sendImageMessage, sendGifMessage
│   │                         unsendMessage, editMessage
│   │                         sendSystemMessage, sendBotMessage
│   │                         toggleReaction(chatroomId, messageId, emoji, uid)
│   ├── useUserProfile.js     saveUserProfile, checkUserIdAvailable, useUserProfile hook
│   ├── useBlockUser.js       useBlockStatus(uid)：blockedUsers[], blockedByUsers[]
│   │                         blockUser(myUid, targetUid), unblockUser(myUid, targetUid)
│   └── useNotifications.js   useNotifications(chats, currentUid)
│                             Web Notifications API，監聽 chats 的 lastMessageAt 變化
│                             tab 非 visible 且收到新訊息時觸發 new Notification()
│
├── firebase/
│   └── config.js             initializeApp，export auth, db
│
└── utils/
    ├── cloudinary.js         uploadToCloudinary(file)：上傳圖片，回傳 URL
    └── escapeHtml.js         escapeHtml()：XSS 防護輔助（React 本身已防，這是備用）
```

---

## Firestore 資料結構

```
users/{uid}
  username: string
  userId: string          （唯一 @handle，存 lowercase）
  email: string
  phone: string
  address: string
  photoURL: string        （Cloudinary URL）
  blockedUsers: string[]  （被我封鎖的 uid list）
  blockedByUsers: string[] （封鎖我的 uid list）
  createdAt: string

chatrooms/{chatroomId}
  type: "direct" | "group" | "bot"
  members: string[]       （uid array）
  name: string            （群組名稱，group 才有）
  photoURL: string        （群組頭像，group 才有，選填）
  lastMessage: string
  lastMessageSenderId: string
  lastMessageAt: timestamp
  unreadCount: { [uid]: number }
  createdAt: timestamp

chatrooms/{chatroomId}/messages/{messageId}
  senderId: string        （uid 或 "bot"）
  type: "text" | "image" | "gif" | "system"
  text: string
  imageURL: string        （type=image 才有）
  gifURL: string          （type=gif 才有）
  timestamp: timestamp
  edited: boolean
  unsent: boolean
  reactions: { [emoji]: string[] }   （emoji -> uid array，已實作）
  replyTo: {             （待實作）
    messageId: string
    text: string
    senderId: string
  }
```

---

## 功能完成狀態

### Basic（50%）
- [x] Email Sign Up / Sign In
- [ ] Firebase Hosting (5%) ← **待部署**
- [x] Firestore 讀寫（authenticated）
- [x] RWD (5%) ← 完成，見下方 RWD 實作細節
- [x] Git
- [x] Chatroom（一對一、群組、歷史訊息、邀請成員）

### Advanced（最多 45%）
- [x] React framework (5%)
- [x] Google Sign In (1%)
- [x] Chrome Notification (5%) ← 程式完成，macOS 系統通知需開啟 Chrome Helper (Alerts)
- [x] CSS Animation (2%)
- [x] XSS 防護 (2%)
- [x] User Profile (10%)
- [x] Unsend message
- [x] Edit message       ← 合計 Message Operations (10%)
- [x] Search message
- [x] Send image (含 unsend)

### Bonus（最多 10%）
- [x] Chatbot OpenAI (2%)
- [x] Block User UI (2%)
- [x] Send GIF Giphy (3%)
- [x] Emoji Reaction (3%) ← 每人每則訊息限一個 emoji，選同 emoji 取消，選不同替換
- [ ] Reply to Message (6%) ← **待實作**
- [ ] Custom Sticker (10%) ← **待實作**

---

## RWD 實作細節

| 尺寸 | 寬度 | 佈局 |
|------|------|------|
| 手機 | < 768px (md) | 單欄切換：有選聊天室顯示 ChatArea，否則顯示 ChatList |
| 平板 | 768px–1024px (md–lg) | 雙欄：ChatList(w-56) + ChatArea；IconBar 隱藏 |
| 桌機 | ≥ 1024px (lg) | 三欄：IconBar + ChatList(w-64) + ChatArea |

**關鍵 CSS 技巧：**
- 顯示/隱藏用 `max-md:hidden`（只在手機隱藏），避免 `hidden md:flex` 的 cascade 衝突
- ChatList / ChatArea 透過 `className` prop 接收顯示條件（不加 wrapper div）
- 捲動要正常運作必須加 `min-h-0` 到 ChatArea 和 MessageList（flexbox 預設 `min-height: auto` 會撐破高度限制）
- IconBar：`hidden lg:flex`
- 手機版 ChatList header 右上角：Settings 齒輪（`lg:hidden`），含 New Chat / Edit Profile / Sign Out
- ChatHeader 左側返回按鈕：`md:hidden`（只在手機顯示）

---

## 已知問題 / 注意事項

1. **Chrome Notification 需確認 macOS 系統設定**
   - 程式碼邏輯完整，tab 切走後收到訊息可觸發
   - 需在「系統設定 → 通知 → Google Chrome Helper (Alerts)」確認允許通知已開啟
   - 群組通知 title 格式：`發訊者 — 群組名稱`

2. **OpenAI key 暴露在前端**
   - `VITE_OPENAI_API_KEY` 是 client-side env var，打 build 後 key 會暴露
   - 學生作業可接受，不需要改

3. **Gemini package 已移除**
   - `@google/generative-ai` 已從 package.json 刪除

---

## 開發慣例

- **顏色系統：** `#2C2825`（深棕主色）、`#FAF7F2`（米白背景）、`#C8956C`（橘色 accent）、`#A89880`（灰棕副色）、`#E8D5B7`（邊框/淺色）
- **圓角：** 統一用 `rounded-2xl`（16px）或 `rounded-xl`（12px）
- **動畫 class：** `animate-slide-in-left`、`animate-slide-in-right`、`animate-fade-in` 定義在 `src/index.css`
- **訊息 state 中心：** 所有 ChatArea 的 state 都在 `ChatArea.jsx`，子元件只接 props，不自己管 state
- **Modal 模式：** 所有 modal 用 `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm`

---

## 下次對話開始時

1. 讀這份文件
2. 確認用戶要做什麼功能
3. 說明方案（動到哪些檔案、大致做法）
4. 等用戶同意
5. 執行，附 AI Reference
