import { useRef } from "react";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageList({
  messages, loading, isGroup,
  currentUid, memberProfiles, otherUser,
  searchResults, searchIndex,
  hoveredMsgId, setHoveredMsgId,
  uploadingImagePreview,
  onUnsend, onEdit, onPreviewImage,
  messageRefs, bottomRef,
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
      {loading && <p className="text-center text-[#A89880] text-sm py-8">Loading messages...</p>}
      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-[#A89880]">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">
            {isGroup ? "Start the conversation!" : `Say hi to ${otherUser?.username}!`}
          </p>
        </div>
      )}

      {messages.map((msg, index) => {
        if (msg.type === "system") {
          return (
            <div key={msg.id} className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#E8E0D0]" />
              <p className="text-xs text-[#A89880] whitespace-nowrap px-2">{msg.text}</p>
              <div className="flex-1 h-px bg-[#E8E0D0]" />
            </div>
          );
        }

        const isMe = msg.senderId === currentUid;
        const prevMsg = messages[index - 1];
        const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === "system";
        const nextMsg = messages[index + 1];
        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || nextMsg.type === "system";
        const senderProfile = isGroup ? memberProfiles[msg.senderId] : otherUser;
        const isHighlighted = searchResults[searchIndex] === msg.id;
        const isSearchMatch = searchResults.includes(msg.id);
        const mediaURL = msg.type === "gif" ? msg.gifURL : msg.imageURL;

        return (
          <div
            key={msg.id}
            ref={el => messageRefs.current[msg.id] = el}
            onMouseEnter={() => setHoveredMsgId(msg.id)}
            onMouseLeave={() => setHoveredMsgId(null)}
          >
            {!isMe && (
              <div className={`flex items-start gap-2 animate-slide-in-left ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                <div className="w-8 flex-shrink-0">
                  {isFirstInGroup ? (
                    <img src={senderProfile?.photoURL || DEFAULT_AVATAR} alt=""
                      className="w-8 h-8 rounded-full object-cover border border-[#E8D5B7]" />
                  ) : null}
                </div>
                <div className="max-w-[60%]">
                  {isGroup && isFirstInGroup && (
                    <p className="text-xs text-[#A89880] mb-1 ml-1">{senderProfile?.username}</p>
                  )}
                  {msg.unsent ? (
                    <p className="text-xs italic text-[#A89880] px-4 py-2.5">This message was unsent</p>
                  ) : msg.type === "image" || msg.type === "gif" ? (
                    <img
                      src={mediaURL} alt={msg.type === "gif" ? "GIF" : "sent image"}
                      className={`max-w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity
                        ${isHighlighted ? "ring-4 ring-[#C8956C]" : isSearchMatch ? "ring-2 ring-[#C8956C]/40" : ""}`}
                      onClick={() => onPreviewImage(mediaURL)}
                    />
                  ) : (
                    <div className={`bg-white text-[#2C2825] px-4 py-2.5 shadow-sm text-sm transition-colors
                      ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                        isFirstInGroup ? "rounded-2xl rounded-tl-md" :
                        isLastInGroup ? "rounded-2xl rounded-bl-md" :
                        "rounded-2xl rounded-l-md"}
                      ${isHighlighted ? "ring-4 ring-[#C8956C] bg-[#FFF5EE]" : isSearchMatch ? "ring-2 ring-[#C8956C]/40" : ""}`}>
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                      {msg.edited && <span className="text-xs text-[#A89880] ml-1">(edited)</span>}
                    </div>
                  )}
                  {isLastInGroup && !msg.unsent && (
                    <p className="text-xs text-[#A89880] mt-1 ml-1">{formatTime(msg.timestamp)}</p>
                  )}
                </div>
              </div>
            )}

            {isMe && (
              <div className={`flex items-end justify-end gap-2 animate-slide-in-right ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                {hoveredMsgId === msg.id && !msg.unsent && (
                  <div className="flex items-center gap-1 mb-1">
                    {msg.type === "text" && (
                      <button
                        onClick={() => onEdit(msg)}
                        className="text-xs bg-white text-[#2C2825] px-2 py-1 rounded-lg shadow border border-[#E8D5B7] hover:bg-[#F5ECD7] transition-colors">
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => onUnsend(msg.id)}
                      className="text-xs bg-white text-red-400 px-2 py-1 rounded-lg shadow border border-[#E8D5B7] hover:bg-red-50 transition-colors">
                      Unsend
                    </button>
                  </div>
                )}
                <div className="max-w-[60%]">
                  {msg.unsent ? (
                    <p className="text-xs italic text-[#A89880] px-4 py-2.5">This message was unsent</p>
                  ) : msg.type === "image" || msg.type === "gif" ? (
                    <img
                      src={mediaURL} alt={msg.type === "gif" ? "GIF" : "sent image"}
                      className={`max-w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity
                        ${isHighlighted ? "ring-4 ring-[#C8956C]" : isSearchMatch ? "ring-2 ring-[#C8956C]/40" : ""}`}
                      onClick={() => onPreviewImage(mediaURL)}
                    />
                  ) : (
                    <div className={`bg-[#C8956C] text-white px-4 py-2.5 text-sm transition-colors
                      ${isFirstInGroup && isLastInGroup ? "rounded-2xl" :
                        isFirstInGroup ? "rounded-2xl rounded-br-md" :
                        isLastInGroup ? "rounded-2xl rounded-tr-md" :
                        "rounded-2xl rounded-r-md"}
                      ${isHighlighted ? "ring-4 ring-[#2C2825]" : isSearchMatch ? "ring-2 ring-[#2C2825]/40" : ""}`}>
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                      {msg.edited && <span className="text-xs text-white/70 ml-1">(edited)</span>}
                    </div>
                  )}
                  {isLastInGroup && !msg.unsent && (
                    <p className="text-xs text-[#A89880] mt-1 text-right mr-1">{formatTime(msg.timestamp)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Uploading image preview */}
      {uploadingImagePreview && (
        <div className="flex items-end justify-end gap-2 mt-3">
          <div className="max-w-[60%] relative">
            <img src={uploadingImagePreview} alt="" className="max-w-full rounded-2xl opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
              <div className="bg-white/90 rounded-2xl px-4 py-2 flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-[#C8956C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-xs text-[#2C2825] font-medium">Uploading...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}