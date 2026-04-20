import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, getDocs, serverTimestamp, doc, updateDoc, getDoc
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
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // 計算每個聊天室的未讀數
      const chatsWithUnread = await Promise.all(data.map(async (chat) => {
        const lastRead = chat.lastReadAt?.[uid]?.toMillis?.() || 0;
        const messagesSnap = await getDocs(
          collection(db, "chatrooms", chat.id, "messages")
        );
        const unread = messagesSnap.docs.filter(doc => {
          const ts = doc.data().timestamp?.toMillis?.() || 0;
          const senderId = doc.data().senderId;
          return ts > lastRead && senderId !== uid;
        }).length;
        return { ...chat, unread };
      }));

      setChats(chatsWithUnread);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { chats, loading };
}

export async function markAsRead(chatroomId, uid) {
  await updateDoc(doc(db, "chatrooms", chatroomId), {
    [`lastReadAt.${uid}`]: serverTimestamp(),
  });
}

export async function findExistingChat(uid1, uid2) {
  const q = query(
    collection(db, "chatrooms"),
    where("members", "array-contains", uid1),
    where("type", "==", "direct")
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(doc => {
    const members = doc.data().members;
    return members.includes(uid2);
  });
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
    lastReadAt: {},
  });
  return { id: ref.id };
}