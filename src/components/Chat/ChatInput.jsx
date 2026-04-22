import { useRef } from "react";
import GifPicker from "./GifPicker";

export default function ChatInput({
  text, setText,
  sending, onSend,
  uploadingImage, onImageSelect,
  showGifPicker, setShowGifPicker, onGifSelect,
}) {
  const textareaRef = useRef();
  const imageInputRef = useRef();

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="px-6 py-4 border-t border-[#E8E0D0] bg-white/60 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-end gap-3">

        {/* Image upload button */}
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage}
          className="w-11 h-11 bg-[#F5ECD7] rounded-2xl flex items-center justify-center text-[#A89880] hover:text-[#2C2825] hover:bg-[#E8D5B7] transition-colors flex-shrink-0 disabled:opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
          onChange={onImageSelect} />

        {/* GIF button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-colors
              ${showGifPicker ? "bg-[#C8956C] text-white" : "bg-[#F5ECD7] text-[#A89880] hover:text-[#2C2825] hover:bg-[#E8D5B7]"}`}>
            GIF
          </button>
          {showGifPicker && (
            <GifPicker
              onSelect={onGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          )}
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "44px";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-white border border-[#E8D5B7] rounded-2xl px-4 py-3 text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 resize-none max-h-32 overflow-y-auto"
          style={{ minHeight: "44px" }}
        />

        {/* Send button */}
        <button onClick={onSend} disabled={!text.trim() || sending}
          className="w-11 h-11 bg-[#C8956C] rounded-2xl flex items-center justify-center text-white hover:bg-[#B8845C] transition-colors disabled:opacity-40 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-[#A89880] mt-2 ml-1">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}