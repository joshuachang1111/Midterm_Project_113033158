import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { createChat, findExistingChat } from "../../hooks/useChats";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

export default function NewChatModal({ onClose, onChatCreated }) {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState("direct");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [existingChatIds, setExistingChatIds] = useState({});
  const [loading, setLoading] = useState(false);

  // Group state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [groupError, setGroupError] = useState("");

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "users"));
      const keyword = search.trim().toLowerCase();
      const filtered = snap.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter(u =>
          u.uid !== currentUser.uid &&
          (
            u.username?.toLowerCase().includes(keyword) ||
            u.userId?.toLowerCase().includes(keyword) ||
            u.email?.toLowerCase().includes(keyword)
          )
        );

      if (tab === "direct") {
        const chatMap = {};
        for (const u of filtered) {
          const existing = await findExistingChat(currentUser.uid, u.uid);
          if (existing) chatMap[u.uid] = existing.id;
        }
        setExistingChatIds(chatMap);
      }

      setResults(filtered);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, currentUser.uid, tab]);

  async function handleSelectDirect(user) {
    const chat = await createChat(currentUser.uid, user.uid);
    onChatCreated(chat.id);
    onClose();
  }

  function handleToggleUser(user) {
    setSelectedUsers(prev =>
      prev.find(u => u.uid === user.uid)
        ? prev.filter(u => u.uid !== user.uid)
        : [...prev, user]
    );
  }

  function handleGroupPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setGroupPhoto(file);
    setGroupPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");
    return data.secure_url;
  }

  async function handleCreateGroup() {
    setGroupError("");
    if (selectedUsers.length < 2) {
      setGroupError("Please select at least 2 members to create a group.");
      return;
    }
    setCreating(true);
    try {
      const members = [currentUser.uid, ...selectedUsers.map(u => u.uid)];
      const defaultName = selectedUsers.map(u => u.username).join(", ");
      const finalName = groupName.trim() || defaultName;

      let photoURL = null;
      if (groupPhoto) {
        photoURL = await uploadToCloudinary(groupPhoto);
      }

      const unreadCount = {};
      members.forEach(uid => { unreadCount[uid] = 0; });

      const ref = await addDoc(collection(db, "chatrooms"), {
        members,
        type: "group",
        name: finalName,
        photoURL: photoURL || null,
        createdBy: currentUser.uid,
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCount,
      });

      onChatCreated(ref.id);
      onClose();
    } catch (err) {
      setGroupError("Failed to create group. Please try again.");
      console.error(err);
    }
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-md border border-[#E8D5B7] max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-[#2C2825]">New Chat</h2>
          <button onClick={onClose}
            className="text-[#A89880] hover:text-[#2C2825] transition-colors text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex bg-[#F5ECD7] rounded-2xl p-1">
            {["direct", "group"].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(""); setResults([]); setGroupError(""); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${tab === t ? "bg-[#2C2825] text-white shadow" : "text-[#A89880] hover:text-[#2C2825]"}`}
              >
                {t === "direct" ? "Direct Message" : "New Group"}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Message */}
        {tab === "direct" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89880]"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username, user ID, or email..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-[#E8D5B7] rounded-xl text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30"
                />
              </div>
            </div>
            <div className="px-3 pb-6 overflow-y-auto flex-1">
              {loading && <p className="text-center text-[#A89880] text-sm py-4">Searching...</p>}
              {!loading && search && results.length === 0 && <p className="text-center text-[#A89880] text-sm py-4">No users found</p>}
              {!loading && !search && <p className="text-center text-[#A89880] text-sm py-4">Type to search for users</p>}
              {results.map(user => {
                const alreadyChatting = !!existingChatIds[user.uid];
                return (
                  <button key={user.uid} onClick={() => handleSelectDirect(user)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#F5ECD7] transition-colors text-left">
                    <img src={user.photoURL || DEFAULT_AVATAR} alt={user.username}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-[#E8D5B7]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2C2825] truncate">{user.username}</p>
                      <p className="text-xs text-[#A89880] truncate">@{user.userId}</p>
                    </div>
                    {alreadyChatting && (
                      <span className="text-xs text-[#C8956C] font-medium bg-[#F5ECD7] px-2 py-1 rounded-lg flex-shrink-0">
                        Already chatting
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* New Group */}
        {tab === "group" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 overflow-y-auto flex-1 space-y-4 pb-4">

              {/* Group photo + name */}
              <div className="flex items-center gap-4">
                <label className="w-14 h-14 rounded-2xl border-2 border-dashed border-[#E8D5B7] flex items-center justify-center cursor-pointer hover:bg-[#F5ECD7] transition-colors flex-shrink-0 overflow-hidden">
                  {groupPhotoPreview ? (
                    <img src={groupPhotoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-[#A89880]" xmlns="http://www.w3.org/2000/svg"
                      fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleGroupPhotoChange} />
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={selectedUsers.length > 0 ? selectedUsers.map(u => u.username).join(", ") : "Group name..."}
                  className="flex-1 bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30"
                />
              </div>

              {/* Selected users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(u => (
                    <span key={u.uid}
                      className="flex items-center gap-1 bg-[#E8D5B7] text-[#2C2825] text-xs font-medium px-3 py-1.5 rounded-full">
                      <img src={u.photoURL || DEFAULT_AVATAR} alt="" className="w-4 h-4 rounded-full object-cover" />
                      {u.username}
                      <button onClick={() => handleToggleUser(u)} className="ml-1 text-[#A89880] hover:text-[#2C2825]">✕</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89880]"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members to add..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-[#E8D5B7] rounded-xl text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30"
                />
              </div>

              {/* Results */}
              <div>
                {loading && <p className="text-center text-[#A89880] text-sm py-2">Searching...</p>}
                {!loading && search && results.length === 0 && <p className="text-center text-[#A89880] text-sm py-2">No users found</p>}
                {results.map(user => {
                  const isSelected = !!selectedUsers.find(u => u.uid === user.uid);
                  return (
                    <button key={user.uid} onClick={() => handleToggleUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#F5ECD7] transition-colors text-left">
                      <img src={user.photoURL || DEFAULT_AVATAR} alt={user.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#E8D5B7]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C2825] truncate">{user.username}</p>
                        <p className="text-xs text-[#A89880] truncate">@{user.userId}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected ? "bg-[#C8956C] border-[#C8956C]" : "border-[#E8D5B7]"}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" xmlns="http://www.w3.org/2000/svg"
                          fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {groupError && (
                <p className="text-red-400 text-sm bg-red-50 rounded-xl px-4 py-2">{groupError}</p>
              )}
            </div>

            {/* Create button */}
            <div className="px-6 pb-6 pt-2 flex-shrink-0">
              <button
                onClick={handleCreateGroup}
                disabled={creating}
                className="w-full bg-[#2C2825] text-white font-bold py-3 rounded-xl hover:bg-[#3D3530] transition-all disabled:opacity-50"
              >
                {creating ? "Creating..." : `Create Group${selectedUsers.length > 0 ? ` (${selectedUsers.length + 1})` : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}