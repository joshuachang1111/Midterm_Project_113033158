import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../context/AuthContext";
import { sendSystemMessage } from "../../../hooks/useMessages";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

export default function AddMembersModal({ chatroomId, currentMembers, onClose }) {
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