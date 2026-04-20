import { useState, useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useMessages, sendMessage } from "../../hooks/useMessages";
import { markAsRead } from "../../hooks/useChats";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatArea({ selectedChatId }) {
  const { currentUser } = useAuth();
  const { messages, loading } = useMessages(selectedChatId);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();

  // 取得對方資料
  useEffect(() => {
    if (!selectedChatId) return;
    const fetchOther = async () => {
      const chatSnap = await getDoc(doc(db, "chatrooms", selectedChatId));
      if (!chatSnap.exists()) return;
      const members = chatSnap.data().members;
      const otherUid = members.find(m => m !== currentUser.uid);
      if (!otherUid) return;
      const userSnap = await getDoc(doc(db, "users", otherUid));
      if (userSnap.exists()) setOtherUser(userSnap.data());
    };
    fetchOther();
  }, [selectedChatId, currentUser.uid]);

  // 自動捲到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(selectedChatId, currentUser.uid, text);
    setText("");
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // 點進聊天室時標記已讀
  useEffect(() => {
    if (!selectedChatId || !currentUser?.uid) return;
    markAsRead(selectedChatId, currentUser.uid);
  }, [selectedChatId, currentUser?.uid]);

  if (!selectedChatId) {
    return (
      <div className="flex-1 bg-[#FAF7F2] flex flex-col items-center justify-center text-[#A89880]">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-semibold text-[#2C2825] mb-2">Select a chat</h2>
        <p className="text-sm">Choose a conversation or start a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] min-w-0">

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E8E0D0] flex items-center gap-3 bg-white/60 backdrop-blur-sm flex-shrink-0">
        {otherUser && (
          <>
            <img
              src={otherUser.photoURL}
              alt={otherUser.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#E8D5B7]"
            />
            <div>
              <p className="font-semibold text-[#2C2825]">{otherUser.username}</p>
              <p className="text-xs text-[#A89880]">@{otherUser.userId}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {loading && (
          <p className="text-center text-[#A89880] text-sm py-8">Loading messages...</p>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#A89880]">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Say hi to {otherUser?.username}!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.uid;
          const prevMsg = messages[index - 1];
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
          const nextMsg = messages[index + 1];
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

          return (
            <div key={msg.id}>
              {/* 對方訊息（左） */}
              {!isMe && (
                <div className={`flex items-end gap-2 ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                  {/* 頭像：只在群組最後一則顯示，其他空白佔位 */}
                  <div className="w-8 flex-shrink-0">
                    {isLastInGroup ? (
                      <img
                        src={otherUser?.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-[#E8D5B7]"
                      />
                    ) : null}
                  </div>
                  <div className="max-w-[60%]">
                    <div className={`bg-white text-[#2C2825] px-4 py-2.5 shadow-sm text-sm
                      ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                        isFirstInGroup ? "rounded-2xl rounded-bl-md" :
                        isLastInGroup ? "rounded-2xl rounded-tl-md" :
                        "rounded-2xl rounded-l-md"}`}>
                      {msg.text}
                    </div>
                    {isLastInGroup && (
                      <p className="text-xs text-[#A89880] mt-1 ml-1">
                        {formatTime(msg.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 自己的訊息（右） */}
              {isMe && (
                <div className={`flex items-end justify-end gap-2 ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                  <div className="max-w-[60%]">
                    <div className={`bg-[#C8956C] text-white px-4 py-2.5 text-sm
                      ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                        isFirstInGroup ? "rounded-2xl rounded-br-md" :
                        isLastInGroup ? "rounded-2xl rounded-tr-md" :
                        "rounded-2xl rounded-r-md"}`}>
                      {msg.text}
                    </div>
                    {isLastInGroup && (
                      <p className="text-xs text-[#A89880] mt-1 text-right mr-1">
                        {formatTime(msg.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#E8E0D0] bg-white/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-white border border-[#E8D5B7] rounded-2xl px-4 py-3 text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-11 h-11 bg-[#C8956C] rounded-2xl flex items-center justify-center text-white hover:bg-[#B8845C] transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#A89880] mt-2 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}