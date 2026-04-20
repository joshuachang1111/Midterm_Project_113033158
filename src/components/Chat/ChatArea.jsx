import { useState, useEffect, useRef } from "react";
import {
  doc, getDoc, updateDoc, deleteDoc,
  arrayRemove, arrayUnion, collection, getDocs, onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import {
  useMessages, sendMessage, sendImageMessage,
  unsendMessage, editMessage, sendSystemMessage
} from "../../hooks/useMessages";
import { markAsRead } from "../../hooks/useChats";
import { uploadToCloudinary } from "../../utils/cloudinary";
import EditGroupModal from "./EditGroupModal";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

function EditMessageModal({ message, chatroomId, onClose }) {
  const [text, setText] = useState(message.text);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 50);
  }, []);

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    await editMessage(chatroomId, message.id, text);
    onClose();
    setSaving(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-md border border-[#E8D5B7]">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2C2825]">Edit Message</h2>
          <button onClick={onClose} className="text-[#A89880] hover:text-[#2C2825] text-xl">✕</button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-sm text-[#2C2825] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-[#F5ECD7] text-[#2C2825] font-semibold py-3 rounded-xl hover:bg-[#E8D5B7] transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!text.trim() || saving}
              className="flex-1 bg-[#2C2825] text-white font-bold py-3 rounded-xl hover:bg-[#3D3530] transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({ imageURL, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}>
      <img src={imageURL} alt=""
        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
        ✕
      </button>
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

  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImagePreview, setUploadingImagePreview] = useState(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const bottomRef = useRef();
  const textareaRef = useRef();
  const imageInputRef = useRef();
  const messageRefs = useRef({});

  useEffect(() => {
    if (!selectedChatId) return;
    setOtherUser(null);
    setMembers([]);
    setChatData(null);
    setMemberProfiles({});
    setShowSearch(false);
    setSearchQuery("");

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
  }, [messages, uploadingImagePreview]);

  useEffect(() => {
    if (!selectedChatId || !currentUser?.uid) return;
    markAsRead(selectedChatId, currentUser.uid);
  }, [selectedChatId, currentUser?.uid]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchIndex(0);
      return;
    }
    const keyword = searchQuery.toLowerCase();
    const results = messages
      .filter(m => m.type === "text" && !m.unsent && m.text?.toLowerCase().includes(keyword))
      .map(m => m.id);
    setSearchResults(results);
    setSearchIndex(0);
  }, [searchQuery, messages]);

  useEffect(() => {
    if (searchResults.length === 0) return;
    const targetId = searchResults[searchIndex];
    const el = messageRefs.current[targetId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchIndex, searchResults]);

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

  async function handleUnsend(msgId) {
    if (!window.confirm("Unsend this message?")) return;
    await unsendMessage(selectedChatId, msgId);
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

        {/* Search icon */}
        <button
          onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
            ${showSearch ? "bg-[#E8D5B7] text-[#2C2825]" : "text-[#A89880] hover:text-[#2C2825] hover:bg-[#F5ECD7]"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>

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

      {/* Search bar */}
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
          const isHighlighted = searchResults[searchIndex] === msg.id;
          const isSearchMatch = searchResults.includes(msg.id);

          return (
            <div
              key={msg.id}
              ref={el => messageRefs.current[msg.id] = el}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
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
                    {msg.unsent ? (
                      <p className="text-xs italic text-[#A89880] px-4 py-2.5">This message was unsent</p>
                    ) : msg.type === "image" ? (
                      <img
                        src={msg.imageURL} alt="sent image"
                        className={`max-w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity
                          ${isHighlighted ? "ring-4 ring-[#C8956C]" : isSearchMatch ? "ring-2 ring-[#C8956C]/40" : ""}`}
                        onClick={() => setPreviewImage(msg.imageURL)}
                      />
                    ) : (
                      <div className={`bg-white text-[#2C2825] px-4 py-2.5 shadow-sm text-sm transition-colors
                        ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                          isFirstInGroup ? "rounded-2xl rounded-tl-md" :
                          isLastInGroup ? "rounded-2xl rounded-bl-md" :
                          "rounded-2xl rounded-l-md"}
                        ${isHighlighted ? "ring-4 ring-[#C8956C] bg-[#FFF5EE]" : isSearchMatch ? "ring-2 ring-[#C8956C]/40" : ""}`}>
                        <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                        {msg.edited && <span className="text-xs text-[#A89880] ml-1">(edited)</span>}
                      </div>
                    )}
                    {isLastInGroup && !msg.unsent && (
                      <p className="text-xs text-[#A89880] mt-1 ml-1">{formatTime(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              )}

              {isMe && (
                <div className={`flex items-end justify-end gap-2 ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                  {hoveredMsgId === msg.id && !msg.unsent && (
                    <div className="flex items-center gap-1 mb-1">
                      {msg.type === "text" && (
                        <button
                          onClick={() => setEditingMessage(msg)}
                          className="text-xs bg-white text-[#2C2825] px-2 py-1 rounded-lg shadow border border-[#E8D5B7] hover:bg-[#F5ECD7] transition-colors">
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleUnsend(msg.id)}
                        className="text-xs bg-white text-red-400 px-2 py-1 rounded-lg shadow border border-[#E8D5B7] hover:bg-red-50 transition-colors">
                        Unsend
                      </button>
                    </div>
                  )}
                  <div className="max-w-[60%]">
                    {msg.unsent ? (
                      <p className="text-xs italic text-[#A89880] px-4 py-2.5">This message was unsent</p>
                    ) : msg.type === "image" ? (
                      <img
                        src={msg.imageURL} alt="sent image"
                        className={`max-w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity
                          ${isHighlighted ? "ring-4 ring-[#C8956C]" : isSearchMatch ? "ring-2 ring-[#C8956C]/40" : ""}`}
                        onClick={() => setPreviewImage(msg.imageURL)}
                      />
                    ) : (
                      <div className={`bg-[#C8956C] text-white px-4 py-2.5 text-sm transition-colors
                        ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                          isFirstInGroup ? "rounded-2xl rounded-br-md" :
                          isLastInGroup ? "rounded-2xl rounded-tr-md" :
                          "rounded-2xl rounded-r-md"}
                        ${isHighlighted ? "ring-4 ring-[#2C2825]" : isSearchMatch ? "ring-2 ring-[#2C2825]/40" : ""}`}>
                        <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                        {msg.edited && <span className="text-xs text-white/70 ml-1">(edited)</span>}
                      </div>
                    )}
                    {isLastInGroup && !msg.unsent && (
                      <p className="text-xs text-[#A89880] mt-1 text-right mr-1">{formatTime(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Uploading image preview */}
        {uploadingImagePreview && (
          <div className="flex items-end justify-end gap-2 mt-3">
            <div className="max-w-[60%] relative">
              <img
                src={uploadingImagePreview} alt=""
                className="max-w-full rounded-2xl opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                <div className="bg-white/90 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-[#C8956C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="text-xs text-[#2C2825] font-medium">Uploading...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#E8E0D0] bg-white/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-end gap-3">
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-11 h-11 bg-[#F5ECD7] rounded-2xl flex items-center justify-center text-[#A89880] hover:text-[#2C2825] hover:bg-[#E8D5B7] transition-colors flex-shrink-0 disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

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

      {editingMessage && (
        <EditMessageModal
          message={editingMessage}
          chatroomId={selectedChatId}
          onClose={() => setEditingMessage(null)}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          imageURL={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}