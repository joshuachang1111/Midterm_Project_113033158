export default function ChatArea({ selectedChatId }) {
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
    <div className="flex-1 bg-[#FAF7F2] flex items-center justify-center text-[#A89880]">
      <p>Chat {selectedChatId} — coming soon</p>
    </div>
  );
}