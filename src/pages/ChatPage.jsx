import { useState } from "react";
import IconBar from "../components/Sidebar/IconBar";
import ChatList from "../components/Sidebar/ChatList";
import ChatArea from "../components/Chat/ChatArea";

export default function ChatPage() {
  const [activePanel, setActivePanel] = useState("chats");
  const [selectedChatId, setSelectedChatId] = useState(null);

  return (
    <div className="h-screen flex overflow-hidden bg-[#FAF7F2]">
      <IconBar activePanel={activePanel} setActivePanel={setActivePanel} />
      <ChatList onSelectChat={setSelectedChatId} selectedChatId={selectedChatId} />
      <ChatArea selectedChatId={selectedChatId} />
    </div>
  );
}