import { useState, useEffect, useRef } from "react";
import { editMessage } from "../../../hooks/useMessages";
import { unescapeHtml } from "../../../utils/escapeHtml";

export default function EditMessageModal({ message, chatroomId, onClose }) {
  const [text, setText] = useState(unescapeHtml(message.text || ""));
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 50);
  }, []);

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    await editMessage(chatroomId, message.id, text);
    onClose();
    setSaving(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-md border border-[#E8D5B7]">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2C2825]">Edit Message</h2>
          <button onClick={onClose} className="text-[#A89880] hover:text-[#2C2825] text-xl">✕</button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-sm text-[#2C2825] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-[#F5ECD7] text-[#2C2825] font-semibold py-3 rounded-xl hover:bg-[#E8D5B7] transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!text.trim() || saving}
              className="flex-1 bg-[#2C2825] text-white font-bold py-3 rounded-xl hover:bg-[#3D3530] transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}