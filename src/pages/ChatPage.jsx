import { useState } from "react";
import IconBar from "../components/Sidebar/IconBar";
import ChatList from "../components/Sidebar/ChatList";
import ChatArea from "../components/Chat/ChatArea";
import ProfileModal from "../components/Profile/ProfileModal";
import NewChatModal from "../components/Chat/NewChatModal";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useChats } from "../hooks/useChats";
import { useNotifications } from "../hooks/useNotifications";

export default function ChatPage() {
  const { currentUser } = useAuth();
  const { profile, loading, refetch } = useUserProfile(currentUser?.uid);
  const { chats } = useChats(currentUser?.uid);
  useNotifications(chats, currentUser?.uid);
  const [activePanel, setActivePanel] = useState("chats");
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const forceProfile = !loading && !profile && !profileSaved;

  function handleIconClick(id) {
    if (id === "profile") { setShowProfile(true); return; }
    if (id === "new") { setShowNewChat(true); return; }
    setActivePanel(id);
  }

  async function handleProfileClose() {
    await refetch();
    setProfileSaved(true);
    setShowProfile(false);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAF7F2]">
        <p className="text-[#A89880]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#FAF7F2]">
      <IconBar activePanel={activePanel} setActivePanel={handleIconClick} />
      <ChatList
        chats={chats}
        onSelectChat={setSelectedChatId}
        selectedChatId={selectedChatId}
        profile={profile}
      />
      <ChatArea
        selectedChatId={selectedChatId}
        onChatLeft={() => setSelectedChatId(null)}
      />

      {(forceProfile || showProfile) && (
        <ProfileModal
          forceOpen={forceProfile}
          initialData={profile}
          onClose={handleProfileClose}
        />
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={(chatId) => {
            setSelectedChatId(chatId);
            setShowNewChat(false);
          }}
        />
      )}
    </div>
  );
}