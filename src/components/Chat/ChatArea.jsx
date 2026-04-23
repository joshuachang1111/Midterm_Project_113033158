import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, deleteDoc, arrayRemove, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import {
  useMessages, sendMessage, sendImageMessage, sendGifMessage,
  unsendMessage, sendSystemMessage, sendBotMessage
} from "../../hooks/useMessages";
import { markAsRead } from "../../hooks/useChats";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { useBlockStatus, blockUser, unblockUser } from "../../hooks/useBlockUser";

import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import EditGroupModal from "./EditGroupModal";
import EditMessageModal from "./modals/EditMessageModal";
import ImagePreviewModal from "./modals/ImagePreviewModal";
import AddMembersModal from "./modals/AddMembersModal";

const BOT_PROFILE = {
  username: "AI Assistant",
  photoURL: null,
  userId: "ai_assistant",
};

export default function ChatArea({ selectedChatId, onChatLeft }) {
  const { currentUser } = useAuth();
  const { messages, loading } = useMessages(selectedChatId);
  const [chatData, setChatData] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [otherUid, setOtherUid] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);

  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImagePreview, setUploadingImagePreview] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const { blockedUsers, blockedByUsers } = useBlockStatus(currentUser?.uid);
  const isBlockedByMe = otherUid ? blockedUsers.includes(otherUid) : false;
  const isBlockedByThem = otherUid ? blockedByUsers.includes(otherUid) : false;
  const cannotSend = isBlockedByMe || isBlockedByThem;
  const allBlockedUids = [...blockedUsers, ...blockedByUsers];

  const bottomRef = useRef();
  const messageRefs = useRef({});

  useEffect(() => {
    if (!selectedChatId) return;
    messageRefs.current = {};
    setOtherUser(null);
    setOtherUid(null);
    setMembers([]);
    setChatData(null);
    setMemberProfiles({});
    setShowSearch(false);
    setSearchQuery("");
    setShowGifPicker(false);
    setShowMenu(false);

    const unsub = onSnapshot(doc(db, "chatrooms", selectedChatId), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setChatData(data);
      setMembers(data.members);

      if (data.type === "bot") {
        setOtherUser(BOT_PROFILE);
      } else if (data.type === "group") {
        const profiles = {};
        await Promise.all(data.members.map(async uid => {
          const s = await getDoc(doc(db, "users", uid));
          if (s.exists()) profiles[uid] = s.data();
        }));
        setMemberProfiles(profiles);
      } else {
        const uid = data.members.find(m => m !== currentUser.uid);
        if (!uid) return;
        setOtherUid(uid);
        const s = await getDoc(doc(db, "users", uid));
        if (s.exists()) setOtherUser(s.data());
      }
    });
    return unsub;
  }, [selectedChatId, currentUser.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, uploadingImagePreview, botTyping]);

  useEffect(() => {
    if (!selectedChatId || !currentUser?.uid) return;
    markAsRead(selectedChatId, currentUser.uid);
  }, [selectedChatId, currentUser?.uid]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchIndex(0); return; }
    const keyword = searchQuery.toLowerCase();
    const results = messages
      .filter(m => m.type === "text" && !m.unsent && m.text?.toLowerCase().includes(keyword))
      .map(m => m.id);
    setSearchResults(results);
    setSearchIndex(0);
  }, [searchQuery, messages]);

  useEffect(() => {
    if (searchResults.length === 0) return;
    const el = messageRefs.current[searchResults[searchIndex]];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchIndex, searchResults]);

  async function handleBotReply(userText) {
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    setBotTyping(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `你是一個超級幽默風趣的 AI 助手，名字叫 AI Assistant。你說話很有趣，喜歡說笑話和用幽默的方式回答問題。你可以用繁體中文或英文回答，根據用戶說的語言來決定。回答要簡短有力，不要太長。\n\n用戶說：${userText}`
              }]
            }]
          }),
        }
      );
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "哎呀我腦袋當機了 🤖";
      await sendBotMessage(selectedChatId, reply);
    } catch (err) {
      console.error("Gemini API error", err);
      await sendBotMessage(selectedChatId, "抱歉，我剛才去廁所了 🚽 再說一次？");
    }
    setBotTyping(false);
  }

  async function handleSend() {
    if (!text.trim() || sending || cannotSend) return;
    setSending(true);
    const sentText = text;
    await sendMessage(selectedChatId, currentUser.uid, sentText, members);
    setText("");
    setSending(false);
    if (chatData?.type === "bot") {
      await handleBotReply(sentText);
    }
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setUploadingImagePreview(localPreview);
    setUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file);
      await sendImageMessage(selectedChatId, currentUser.uid, url, members);
    } catch (err) {
      console.error("Image upload failed", err);
    }
    URL.revokeObjectURL(localPreview);
    setUploadingImagePreview(null);
    setUploadingImage(false);
    e.target.value = "";
  }

  async function handleGifSelect(gifURL) {
    setShowGifPicker(false);
    await sendGifMessage(selectedChatId, currentUser.uid, gifURL, members);
  }

  async function handleUnsend(msgId) {
    if (!window.confirm("Unsend this message?")) return;
    await unsendMessage(selectedChatId, msgId);
  }

  async function handleLeaveGroup() {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    const myName = memberProfiles[currentUser.uid]?.username || "Someone";
    const newMembers = members.filter(uid => uid !== currentUser.uid);
    if (newMembers.length === 0) {
      await deleteDoc(doc(db, "chatrooms", selectedChatId));
    } else {
      await updateDoc(doc(db, "chatrooms", selectedChatId), {
        members: arrayRemove(currentUser.uid),
      });
      await sendSystemMessage(selectedChatId, `${myName} left the group`);
    }
    setShowMenu(false);
    if (onChatLeft) onChatLeft();
  }

  async function handleBlockUser() {
    if (!otherUid) return;
    if (isBlockedByMe) {
      if (!window.confirm("Unblock this user?")) return;
      await unblockUser(currentUser.uid, otherUid);
    } else {
      if (!window.confirm("Block this user?")) return;
      await blockUser(currentUser.uid, otherUid);
    }
    setShowMenu(false);
  }

  const isGroup = chatData?.type === "group";
  const isBot = chatData?.type === "bot";

  if (!selectedChatId) {
    return (
      <div className="flex-1 bg-[#FAF7F2] flex flex-col items-center justify-center text-[#A89880]">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-semibold text-[#2C2825] mb-2">Select a chat</h2>
        <p className="text-sm">Choose a conversation or start a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] min-w-0"
      onClick={() => { setShowMenu(false); setShowGifPicker(false); }}>

      <ChatHeader
        chatData={chatData}
        otherUser={otherUser}
        isGroup={isGroup}
        isBot={isBot}
        members={members}
        memberProfiles={memberProfiles}
        currentUid={currentUser.uid}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        setSearchQuery={setSearchQuery}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        onEditGroup={() => { setShowEditGroup(true); setShowMenu(false); }}
        onAddMembers={() => { setShowAddMembers(true); setShowMenu(false); }}
        onLeaveGroup={handleLeaveGroup}
        onBlockUser={handleBlockUser}
        isBlockedByMe={isBlockedByMe}
        isBlockedByThem={isBlockedByThem}
      />

      {showSearch && (
        <div className="px-6 py-3 border-b border-[#E8E0D0] bg-white/60 flex items-center gap-3 flex-shrink-0">
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-white border border-[#E8D5B7] rounded-xl px-4 py-2 text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30"
          />
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[#A89880]">{searchIndex + 1}/{searchResults.length}</span>
              <button onClick={() => setSearchIndex(i => (i - 1 + searchResults.length) % searchResults.length)}
                className="w-7 h-7 rounded-lg bg-[#F5ECD7] flex items-center justify-center text-[#2C2825] hover:bg-[#E8D5B7]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button onClick={() => setSearchIndex(i => (i + 1) % searchResults.length)}
                className="w-7 h-7 rounded-lg bg-[#F5ECD7] flex items-center justify-center text-[#2C2825] hover:bg-[#E8D5B7]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <span className="text-xs text-[#A89880] flex-shrink-0">No results</span>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            className="text-[#A89880] hover:text-[#2C2825] flex-shrink-0">✕</button>
        </div>
      )}

      <MessageList
        messages={messages}
        loading={loading}
        isGroup={isGroup}
        isBot={isBot}
        currentUid={currentUser.uid}
        memberProfiles={memberProfiles}
        otherUser={otherUser}
        blockedUids={allBlockedUids}
        searchResults={searchResults}
        searchIndex={searchIndex}
        hoveredMsgId={hoveredMsgId}
        setHoveredMsgId={setHoveredMsgId}
        uploadingImagePreview={uploadingImagePreview}
        botTyping={botTyping}
        onUnsend={handleUnsend}
        onEdit={setEditingMessage}
        onPreviewImage={setPreviewImage}
        messageRefs={messageRefs}
        bottomRef={bottomRef}
      />

      <ChatInput
        text={text}
        setText={setText}
        sending={sending || botTyping}
        cannotSend={cannotSend}
        onSend={handleSend}
        uploadingImage={uploadingImage}
        onImageSelect={handleImageSelect}
        showGifPicker={showGifPicker}
        setShowGifPicker={setShowGifPicker}
        onGifSelect={handleGifSelect}
      />

      {showAddMembers && (
        <AddMembersModal chatroomId={selectedChatId} currentMembers={members} onClose={() => setShowAddMembers(false)} />
      )}
      {showEditGroup && (
        <EditGroupModal chatroomId={selectedChatId} currentName={chatData?.name} currentPhoto={chatData?.photoURL} onClose={() => setShowEditGroup(false)} />
      )}
      {editingMessage && (
        <EditMessageModal message={editingMessage} chatroomId={selectedChatId} onClose={() => setEditingMessage(null)} />
      )}
      {previewImage && (
        <ImagePreviewModal imageURL={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}