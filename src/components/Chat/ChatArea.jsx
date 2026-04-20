import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, deleteDoc, arrayRemove, arrayUnion, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useMessages, sendMessage, sendSystemMessage } from "../../hooks/useMessages";
import { markAsRead } from "../../hooks/useChats";
import EditGroupModal from "./EditGroupModal";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// 共用的群組疊加頭像元件（接收已抓好的 memberProfiles）
function GroupAvatars({ memberProfiles, currentUid }) {
  const others = Object.entries(memberProfiles)
    .filter(([uid]) => uid !== currentUid)
    .slice(0, 3)
    .map(([, profile]) => profile);

  return (
    <div className="w-10 h-10 relative flex-shrink-0">
      {others.map((profile, i) => (
        <img key={i} src={profile?.photoURL || DEFAULT_AVATAR} alt=""
          className="absolute w-7 h-7 rounded-full object-cover border-2 border-[#FAF7F2]"
          style={{
            top: i === 0 ? 0 : i === 1 ? "auto" : 0,
            bottom: i === 1 ? 0 : "auto",
            left: i === 0 ? 0 : "auto",
            right: i === 1 ? 0 : i === 2 ? 0 : "auto",
            zIndex: 3 - i,
          }}
        />
      ))}
    </div>
  );
}

function AddMembersModal({ chatroomId, currentMembers, onClose }) {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "users"));
      const keyword = search.trim().toLowerCase();
      const filtered = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u =>
          !currentMembers.includes(u.uid) &&
          u.uid !== currentUser.uid &&
          (u.username?.toLowerCase().includes(keyword) ||
           u.userId?.toLowerCase().includes(keyword) ||
           u.email?.toLowerCase().includes(keyword))
        );
      setResults(filtered);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, currentMembers, currentUser.uid]);

  async function handleAdd(user) {
    setAdding(true);
    await updateDoc(doc(db, "chatrooms", chatroomId), {
      members: arrayUnion(user.uid),
      [`unreadCount.${user.uid}`]: 0,
    });
    await sendSystemMessage(chatroomId, `${user.username} joined the group`);
    onClose();
    setAdding(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-sm border border-[#E8D5B7]">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2C2825]">Add Members</h2>
          <button onClick={onClose} className="text-[#A89880] hover:text-[#2C2825] text-xl">✕</button>
        </div>
        <div className="px-6 pb-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30" />
        </div>
        <div className="px-3 pb-6 max-h-64 overflow-y-auto">
          {loading && <p className="text-center text-[#A89880] text-sm py-4">Searching...</p>}
          {!loading && search && results.length === 0 && <p className="text-center text-[#A89880] text-sm py-4">No users found</p>}
          {results.map(user => (
            <button key={user.uid} onClick={() => handleAdd(user)} disabled={adding}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#F5ECD7] transition-colors text-left">
              <img src={user.photoURL || DEFAULT_AVATAR} alt={user.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#E8D5B7]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2C2825] truncate">{user.username}</p>
                <p className="text-xs text-[#A89880] truncate">@{user.userId}</p>
              </div>
              <span className="text-xs text-[#C8956C] font-medium">Add</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatArea({ selectedChatId, onChatLeft }) {
  const { currentUser } = useAuth();
  const { messages, loading } = useMessages(selectedChatId);
  const [chatData, setChatData] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    if (!selectedChatId) return;
    setOtherUser(null);
    setMembers([]);
    setChatData(null);
    setMemberProfiles({});

    const unsub = onSnapshot(doc(db, "chatrooms", selectedChatId), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setChatData(data);
      setMembers(data.members);

      if (data.type === "group") {
        const profiles = {};
        await Promise.all(data.members.map(async uid => {
          const s = await getDoc(doc(db, "users", uid));
          if (s.exists()) profiles[uid] = s.data();
        }));
        setMemberProfiles(profiles);
      } else {
        const otherUid = data.members.find(m => m !== currentUser.uid);
        if (!otherUid) return;
        const s = await getDoc(doc(db, "users", otherUid));
        if (s.exists()) setOtherUser(s.data());
      }
    });
    return unsub;
  }, [selectedChatId, currentUser.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedChatId || !currentUser?.uid) return;
    markAsRead(selectedChatId, currentUser.uid);
  }, [selectedChatId, currentUser?.uid]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(selectedChatId, currentUser.uid, text, members);
    setText("");
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleLeaveGroup() {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    const myProfile = memberProfiles[currentUser.uid];
    const myName = myProfile?.username || "Someone";
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

  const isGroup = chatData?.type === "group";

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
    <div className="flex-1 flex flex-col bg-[#FAF7F2] min-w-0">

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E8E0D0] flex items-center gap-3 bg-white/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {isGroup ? (
            chatData?.photoURL ? (
              <img src={chatData.photoURL} alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#E8D5B7]" />
            ) : (
              <GroupAvatars memberProfiles={memberProfiles} currentUid={currentUser.uid} />
            )
          ) : (
            otherUser && (
              <img src={otherUser.photoURL || DEFAULT_AVATAR} alt={otherUser.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#E8D5B7] flex-shrink-0" />
            )
          )}
          <div className="min-w-0">
            <p className="font-semibold text-[#2C2825] truncate">
              {isGroup ? chatData?.name : otherUser?.username}
            </p>
            <p className="text-xs text-[#A89880]">
              {isGroup ? `${members.length} members` : `@${otherUser?.userId || ""}`}
            </p>
          </div>
        </div>

        {isGroup && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#A89880] hover:text-[#2C2825] hover:bg-[#F5ECD7] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-[#E8D5B7] overflow-hidden z-10 w-44">
                <button onClick={() => { setShowEditGroup(true); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-[#2C2825] hover:bg-[#F5ECD7] transition-colors">
                  Edit Group
                </button>
                <button onClick={() => { setShowAddMembers(true); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-[#2C2825] hover:bg-[#F5ECD7] transition-colors">
                  Add Members
                </button>
                <button onClick={handleLeaveGroup}
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-50 transition-colors">
                  Leave Group
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1" onClick={() => setShowMenu(false)}>
        {loading && <p className="text-center text-[#A89880] text-sm py-8">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#A89880]">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">{isGroup ? "Start the conversation!" : `Say hi to ${otherUser?.username}!`}</p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.type === "system") {
            return (
              <div key={msg.id} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#E8E0D0]" />
                <p className="text-xs text-[#A89880] whitespace-nowrap px-2">{msg.text}</p>
                <div className="flex-1 h-px bg-[#E8E0D0]" />
              </div>
            );
          }

          const isMe = msg.senderId === currentUser.uid;
          const prevMsg = messages[index - 1];
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === "system";
          const nextMsg = messages[index + 1];
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || nextMsg.type === "system";
          const senderProfile = isGroup ? memberProfiles[msg.senderId] : otherUser;

          return (
            <div key={msg.id}>
              {!isMe && (
                <div className={`flex items-start gap-2 ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                  <div className="w-8 flex-shrink-0">
                    {isFirstInGroup ? (
                      <img src={senderProfile?.photoURL || DEFAULT_AVATAR} alt=""
                        className="w-8 h-8 rounded-full object-cover border border-[#E8D5B7]" />
                    ) : null}
                  </div>
                  <div className="max-w-[60%]">
                    {isGroup && isFirstInGroup && (
                      <p className="text-xs text-[#A89880] mb-1 ml-1">{senderProfile?.username}</p>
                    )}
                    <div className={`bg-white text-[#2C2825] px-4 py-2.5 shadow-sm text-sm
                      ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                        isFirstInGroup ? "rounded-2xl rounded-tl-md" :
                        isLastInGroup ? "rounded-2xl rounded-bl-md" :
                        "rounded-2xl rounded-l-md"}`}>
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                    </div>
                    {isLastInGroup && (
                      <p className="text-xs text-[#A89880] mt-1 ml-1">{formatTime(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              )}

              {isMe && (
                <div className={`flex items-end justify-end gap-2 ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                  <div className="max-w-[60%]">
                    <div className={`bg-[#C8956C] text-white px-4 py-2.5 text-sm
                      ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                        isFirstInGroup ? "rounded-2xl rounded-br-md" :
                        isLastInGroup ? "rounded-2xl rounded-tr-md" :
                        "rounded-2xl rounded-r-md"}`}>
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                    </div>
                    {isLastInGroup && (
                      <p className="text-xs text-[#A89880] mt-1 text-right mr-1">{formatTime(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#E8E0D0] bg-white/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-end gap-3">
          <textarea ref={textareaRef} value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "44px";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-white border border-[#E8D5B7] rounded-2xl px-4 py-3 text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="w-11 h-11 bg-[#C8956C] rounded-2xl flex items-center justify-center text-white hover:bg-[#B8845C] transition-colors disabled:opacity-40 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#A89880] mt-2 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>

      {showAddMembers && (
        <AddMembersModal chatroomId={selectedChatId} currentMembers={members}
          onClose={() => setShowAddMembers(false)} />
      )}

      {showEditGroup && (
        <EditGroupModal
          chatroomId={selectedChatId}
          currentName={chatData?.name}
          currentPhoto={chatData?.photoURL}
          onClose={() => setShowEditGroup(false)}
        />
      )}
    </div>
  );
}