import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { useBlockStatus } from "../../hooks/useBlockUser";
import { useEffect, useRef, useState } from "react";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { GroupAvatarsFromUids } from "../Chat/GroupAvatars";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

function ChatItem({ chat, currentUid, isSelected, onClick, otherUser, allBlockedUids }) {
  const [displayLastMessage, setDisplayLastMessage] = useState(chat.lastMessage || "");

  useEffect(() => {
    async function resolveLastMessage() {
      const senderId = chat.lastMessageSenderId;
      if (senderId && allBlockedUids.includes(senderId)) {
        try {
          const q = query(
            collection(db, "chatrooms", chat.id, "messages"),
            orderBy("timestamp", "desc")
          );
          const snap = await getDocs(q);
          const fallback = snap.docs.find(d => {
            const data = d.data();
            return !allBlockedUids.includes(data.senderId) && data.type !== "system" && !data.unsent;
          });
          if (fallback) {
            const data = fallback.data();
            if (data.type === "image") setDisplayLastMessage("📷 Image");
            else if (data.type === "gif") setDisplayLastMessage("🎞️ GIF");
            else setDisplayLastMessage(data.text || "");
          } else {
            setDisplayLastMessage("");
          }
        } catch {
          setDisplayLastMessage("");
        }
      } else {
        setDisplayLastMessage(chat.lastMessage || "");
      }
    }
    resolveLastMessage();
  }, [chat.lastMessage, chat.lastMessageSenderId, allBlockedUids, chat.id]);

  if (chat.type !== "group" && chat.type !== "bot" && !otherUser) return null;

  const displayName = chat.type === "group"
    ? chat.name
    : chat.type === "bot"
    ? "AI Assistant"
    : otherUser?.username;

  const displayPhoto = chat.type === "group" || chat.type === "bot"
    ? null
    : otherUser?.photoURL;

  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors text-left animate-fade-in
        ${isSelected ? "bg-[#E8D5B7]" : "hover:bg-[#EDE5D8]"}`}>

      {chat.type === "bot" ? (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C8956C] to-[#A89880] flex items-center justify-center text-xl flex-shrink-0">
          🤖
        </div>
      ) : chat.type === "group" ? (
        chat.photoURL ? (
          <img src={chat.photoURL} alt={chat.name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-[#E8D5B7]" />
        ) : (
          <GroupAvatarsFromUids members={chat.members} currentUid={currentUid} />
        )
      ) : (
        <img src={displayPhoto || DEFAULT_AVATAR} alt={displayName}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-[#E8D5B7]" />
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${chat.unread > 0 ? "font-bold text-[#2C2825]" : "font-semibold text-[#2C2825]"}`}>
          {displayName}
        </p>
        <p className={`text-xs truncate ${chat.unread > 0 ? "text-[#2C2825] font-medium" : "text-[#A89880]"}`}>
          {displayLastMessage || "No messages yet"}
        </p>
      </div>
      {chat.unread > 0 && (
        <span className="w-5 h-5 bg-[#C8956C] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {chat.unread > 99 ? "99+" : chat.unread}
        </span>
      )}
    </button>
  );
}

export default function ChatList({ chats = [], onSelectChat, selectedChatId, profile, onIconClick, className = "" }) {
  const { currentUser } = useAuth();
  const { blockedUsers, blockedByUsers } = useBlockStatus(currentUser?.uid);
  const allBlockedUids = [...blockedUsers, ...blockedByUsers];
  const [otherUsers, setOtherUsers] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!showSettings) return;
    function handleClick(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showSettings]);

  useEffect(() => {
    const directChats = chats.filter(c => c.type === "direct");
    directChats.forEach(async (chat) => {
      const otherUid = chat.members.find(m => m !== currentUser.uid);
      if (!otherUid || otherUsers[chat.id]) return;
      const snap = await getDoc(doc(db, "users", otherUid));
      if (snap.exists()) {
        setOtherUsers(prev => ({ ...prev, [chat.id]: snap.data() }));
      }
    });
  }, [chats]);

  async function handleLogout() {
    await signOut(auth);
  }

  return (
    <div className={`flex flex-col flex-shrink-0 w-full md:w-56 lg:w-64 min-h-0 bg-[#F5ECD7]/50 border-r border-[#E8D5B7] ${className}`}>
      <div className="px-4 py-5 border-b border-[#E8D5B7] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={profile?.photoURL || DEFAULT_AVATAR}
            alt={profile?.username}
            className="w-9 h-9 rounded-full object-cover border-2 border-[#E8D5B7] flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2C2825] truncate max-w-[120px]">
              {profile?.username || "You"}
            </p>
            <p className="text-xs text-[#A89880] truncate">@{profile?.userId || ""}</p>
          </div>
        </div>

        {/* 桌機：只顯示登出按鈕 */}
        <button
          onClick={handleLogout}
          className="hidden lg:flex w-8 h-8 rounded-xl items-center justify-center text-[#A89880] hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
          title="Sign Out">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>

        {/* 手機/平板：Settings 下拉選單 */}
        <div ref={settingsRef} className="lg:hidden relative flex-shrink-0">
          <button
            onClick={() => setShowSettings(v => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#A89880] hover:text-[#2C2825] hover:bg-[#EDE5D8] transition-colors"
            title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          {showSettings && (
            <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl border border-[#E8D5B7] overflow-hidden z-50 w-44">
              <button onClick={() => { onIconClick?.("new"); setShowSettings(false); }}
                className="w-full px-4 py-3 text-left text-sm text-[#2C2825] hover:bg-[#F5ECD7] transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Chat
              </button>
              <button onClick={() => { onIconClick?.("profile"); setShowSettings(false); }}
                className="w-full px-4 py-3 text-left text-sm text-[#2C2825] hover:bg-[#F5ECD7] transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Edit Profile
              </button>
              <div className="border-t border-[#E8D5B7]" />
              <button onClick={() => { handleLogout(); setShowSettings(false); }}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-50 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {chats.map(chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            currentUid={currentUser.uid}
            isSelected={chat.id === selectedChatId}
            onClick={() => onSelectChat(chat.id)}
            otherUser={otherUsers[chat.id]}
            allBlockedUids={allBlockedUids}
          />
        ))}
      </div>
    </div>
  );
}