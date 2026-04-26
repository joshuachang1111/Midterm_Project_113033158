import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, increment, getDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import { escapeHtml } from "../utils/escapeHtml";

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
    text: escapeHtml(trimmed),
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
    lastMessageSenderId: senderId,   // ← 新增
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
    lastMessageSenderId: senderId,   // ← 新增
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
    lastMessageSenderId: senderId,   // ← 新增
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
    text: escapeHtml(trimmed),
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
    lastMessageSenderId: "system",   // ← 新增
    lastMessageAt: serverTimestamp(),
  });
}

export async function toggleReaction(chatroomId, messageId, emoji, uid) {
  const msgRef = doc(db, "chatrooms", chatroomId, "messages", messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;

  const reactions = snap.data().reactions || {};

  // 找出這個 user 目前選的 emoji
  let prevEmoji = null;
  for (const [e, uids] of Object.entries(reactions)) {
    if (uids.includes(uid)) { prevEmoji = e; break; }
  }

  const updated = { ...reactions };

  // 從舊的 emoji 移除
  if (prevEmoji) {
    const filtered = updated[prevEmoji].filter(u => u !== uid);
    if (filtered.length === 0) delete updated[prevEmoji];
    else updated[prevEmoji] = filtered;
  }

  // 加到新的 emoji（如果跟舊的一樣就是取消，不加回去）
  if (emoji !== prevEmoji) {
    updated[emoji] = [...(updated[emoji] || []), uid];
  }

  await updateDoc(msgRef, { reactions: updated });
}

export async function sendBotMessage(chatroomId, text) {
  await addDoc(collection(db, "chatrooms", chatroomId, "messages"), {
    senderId: "bot",
    type: "text",
    text,
    timestamp: serverTimestamp(),
    edited: false,
    unsent: false,
  });
  await updateDoc(doc(db, "chatrooms", chatroomId), {
    lastMessage: text,
    lastMessageSenderId: "bot",      // ← 新增
    lastMessageAt: serverTimestamp(),
  });
}