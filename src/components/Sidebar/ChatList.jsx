import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { useBlockStatus } from "../../hooks/useBlockUser";
import { useEffect, useState } from "react";
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

export default function ChatList({ chats = [], onSelectChat, selectedChatId, profile }) {
  const { currentUser } = useAuth();
  const { blockedUsers, blockedByUsers } = useBlockStatus(currentUser?.uid);
  const allBlockedUids = [...blockedUsers, ...blockedByUsers];
  const [otherUsers, setOtherUsers] = useState({});

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
    <div className="w-72 flex flex-col bg-[#F5ECD7]/50 border-r border-[#E8D5B7] h-full">
      <div className="px-4 py-5 border-b border-[#E8D5B7] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={profile?.photoURL || DEFAULT_AVATAR}
            alt={profile?.username}
            className="w-9 h-9 rounded-full object-cover border-2 border-[#E8D5B7]" />
          <div>
            <p className="text-sm font-semibold text-[#2C2825] truncate max-w-[120px]">
              {profile?.username || "You"}
            </p>
            <p className="text-xs text-[#A89880]">@{profile?.userId || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#A89880] hover:text-red-400 hover:bg-red-50 transition-colors"
          title="Sign Out">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
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