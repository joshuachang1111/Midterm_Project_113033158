import { useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export function useNotifications(chats, currentUid) {
  const prevTimestampsRef = useRef(null);

  // 請求通知權限
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!chats.length || !currentUid) return;

    if (prevTimestampsRef.current === null) {
      const map = {};
      chats.forEach(c => { map[c.id] = c.lastMessageAt?.toMillis?.() || 0; });
      prevTimestampsRef.current = map;
      return;
    }

    if (Notification.permission !== "granted") return;

    chats.forEach(async (chat) => {
      const prevTime = prevTimestampsRef.current[chat.id] || 0;
      const newTime = chat.lastMessageAt?.toMillis?.() || 0;

      const isNewMessage =
        newTime > prevTime &&
        chat.lastMessageSenderId &&
        chat.lastMessageSenderId !== currentUid &&
        chat.lastMessageSenderId !== "bot" &&
        chat.lastMessageSenderId !== "system";

      if (isNewMessage && document.visibilityState !== "visible") {
        let senderName = "Someone";
        try {
          const snap = await getDoc(doc(db, "users", chat.lastMessageSenderId));
          if (snap.exists()) senderName = snap.data().username || "Someone";
        } catch {}

        const isGroup = chat.type === "group";
        const title = isGroup
          ? `${senderName} — ${chat.name || "Group"}`
          : senderName;
        const body = chat.lastMessage || "New message";

        new Notification(title, {
          body,
          icon: "/favicon.svg",
          tag: chat.id,
        });
      }

      prevTimestampsRef.current[chat.id] = newTime;
    });
  }, [chats, currentUid]);
}
