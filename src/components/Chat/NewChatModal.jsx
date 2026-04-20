import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { createChat, findExistingChat } from "../../hooks/useChats";

export default function NewChatModal({ onClose, onChatCreated }) {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [existingChatIds, setExistingChatIds] = useState({});
  const [loading, setLoading] = useState(false);

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

      // 檢查哪些已有聊天室
      const chatMap = {};
      for (const u of filtered) {
        const existing = await findExistingChat(currentUser.uid, u.uid);
        if (existing) chatMap[u.uid] = existing.id;
      }
      setExistingChatIds(chatMap);
      setResults(filtered);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, currentUser.uid]);

  async function handleSelect(user) {
    const chat = await createChat(currentUser.uid, user.uid);
    onChatCreated(chat.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-md border border-[#E8D5B7]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2C2825]">New Chat</h2>
          <button onClick={onClose}
            className="text-[#A89880] hover:text-[#2C2825] transition-colors text-xl">✕</button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89880]"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
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

        {/* Results */}
        <div className="px-3 pb-6 max-h-80 overflow-y-auto">
          {loading && (
            <p className="text-center text-[#A89880] text-sm py-4">Searching...</p>
          )}

          {!loading && search && results.length === 0 && (
            <p className="text-center text-[#A89880] text-sm py-4">No users found</p>
          )}

          {!loading && !search && (
            <p className="text-center text-[#A89880] text-sm py-4">
              Type to search for users
            </p>
          )}

          {results.map((user) => {
            const alreadyChatting = !!existingChatIds[user.uid];
            return (
              <button
                key={user.uid}
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#F5ECD7] transition-colors text-left"
              >
                <img
                  src={user.photoURL}
                  alt={user.username}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-[#E8D5B7]"
                />
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
    </div>
  );
}