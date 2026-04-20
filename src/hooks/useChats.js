import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, getDocs, serverTimestamp
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
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // client-side 排序
        data.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        return bTime - aTime;
        });
        setChats(data);
        setLoading(false);
    });
    return unsub;
    }, [uid]);

  return { chats, loading };
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
  });
  return { id: ref.id };
}