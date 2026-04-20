import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, getDocs, serverTimestamp,
  doc, updateDoc, setDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

export function useChats(uid) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "chatrooms"),
      where("members", "array-contains", uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const chatData = d.data();
        return {
          id: d.id,
          ...chatData,
          unread: chatData.unreadCount?.[uid] || 0,
        };
      });

      setChats(prev => {
        // 把新資料用 lastMessageAt 排序
        const sorted = [...data].sort((a, b) => {
          const aTime = a.lastMessageAt?.toMillis?.() || 0;
          const bTime = b.lastMessageAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        // 如果排序結果跟之前一樣，就直接回傳舊的 array，不觸發 re-render
        const prevIds = prev.map(c => c.id).join(",");
        const newIds = sorted.map(c => c.id).join(",");
        if (prevIds === newIds) {
          // 順序沒變，只更新每個 chat 的內容（unread、lastMessage 等）
          return prev.map(p => sorted.find(s => s.id === p.id) || p);
        }

        return sorted;
      });

      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { chats, loading };
}

export async function markAsRead(chatroomId, uid) {
  await setDoc(doc(db, "chatrooms", chatroomId), {
    unreadCount: { [uid]: 0 }
  }, { merge: true });
}

export async function findExistingChat(uid1, uid2) {
  const q = query(
    collection(db, "chatrooms"),
    where("members", "array-contains", uid1),
    where("type", "==", "direct")
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => d.data().members.includes(uid2));
  return existing ? { id: existing.id, ...existing.data() } : null;
}

export async function createChat(uid1, uid2) {
  const existing = await findExistingChat(uid1, uid2);
  if (existing) return existing;

  const ref = await addDoc(collection(db, "chatrooms"), {
    members: [uid1, uid2],
    type: "direct",
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    unreadCount: { [uid1]: 0, [uid2]: 0 },
  });
  return { id: ref.id };
}