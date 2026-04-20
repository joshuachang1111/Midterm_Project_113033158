import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

export function useMessages(chatroomId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatroomId) return;
    setLoading(true);
    const q = query(
      collection(db, "chatrooms", chatroomId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, [chatroomId]);

  return { messages, loading };
}

export async function sendMessage(chatroomId, senderId, text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "chatrooms", chatroomId, "messages"), {
    senderId,
    text: trimmed,
    type: "text",
    timestamp: serverTimestamp(),
  });

  await updateDoc(doc(db, "chatrooms", chatroomId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });
}