import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, increment
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
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [chatroomId]);

  return { messages, loading };
}

export async function sendMessage(chatroomId, senderId, text, members) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "chatrooms", chatroomId, "messages"), {
    senderId,
    text: trimmed,
    type: "text",
    timestamp: serverTimestamp(),
    edited: false,
    unsent: false,
  });

  const unreadUpdate = {};
  members.forEach(uid => {
    if (uid !== senderId) {
      unreadUpdate[`unreadCount.${uid}`] = increment(1);
    }
  });

  await updateDoc(doc(db, "chatrooms", chatroomId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    ...unreadUpdate,
  });
}

export async function sendImageMessage(chatroomId, senderId, imageURL, members) {
  await addDoc(collection(db, "chatrooms", chatroomId, "messages"), {
    senderId,
    type: "image",
    imageURL,
    text: "",
    timestamp: serverTimestamp(),
    unsent: false,
  });

  const unreadUpdate = {};
  members.forEach(uid => {
    if (uid !== senderId) {
      unreadUpdate[`unreadCount.${uid}`] = increment(1);
    }
  });

  await updateDoc(doc(db, "chatrooms", chatroomId), {
    lastMessage: "📷 Image",
    lastMessageAt: serverTimestamp(),
    ...unreadUpdate,
  });
}

export async function sendGifMessage(chatroomId, senderId, gifURL, members) {
  await addDoc(collection(db, "chatrooms", chatroomId, "messages"), {
    senderId,
    type: "gif",
    gifURL,
    text: "",
    timestamp: serverTimestamp(),
    unsent: false,
  });

  const unreadUpdate = {};
  members.forEach(uid => {
    if (uid !== senderId) {
      unreadUpdate[`unreadCount.${uid}`] = increment(1);
    }
  });

  await updateDoc(doc(db, "chatrooms", chatroomId), {
    lastMessage: "🎞️ GIF",
    lastMessageAt: serverTimestamp(),
    ...unreadUpdate,
  });
}

export async function unsendMessage(chatroomId, messageId) {
  await updateDoc(doc(db, "chatrooms", chatroomId, "messages", messageId), {
    unsent: true,
    text: "",
    imageURL: null,
  });
}

export async function editMessage(chatroomId, messageId, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return;
  await updateDoc(doc(db, "chatrooms", chatroomId, "messages", messageId), {
    text: trimmed,
    edited: true,
  });
}

export async function sendSystemMessage(chatroomId, text) {
  await addDoc(collection(db, "chatrooms", chatroomId, "messages"), {
    type: "system",
    text,
    timestamp: serverTimestamp(),
  });
  await updateDoc(doc(db, "chatrooms", chatroomId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
}