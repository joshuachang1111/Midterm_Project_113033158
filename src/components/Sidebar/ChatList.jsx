import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";

export default function ChatList({ onSelectChat, selectedChatId }) {
  const { currentUser } = useAuth();

  return (
    <div className="w-72 bg-[#F5F0E8] flex flex-col flex-shrink-0 border-r border-[#E8E0D0]">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#2C2825]">Messages</h1>
          <button
            onClick={() => signOut(auth)}
            className="text-xs text-[#C8956C] hover:text-[#2C2825] transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
        {/* Search bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89880]"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm text-[#2C2825] placeholder-[#A89880] border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30"
          />
        </div>
      </div>

      {/* Chat list - empty for now */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex flex-col items-center justify-center h-48 text-[#A89880]">
          <svg className="w-10 h-10 mb-2 opacity-40" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <p className="text-sm">No chats yet</p>
          <p className="text-xs mt-1">Press + to start a new chat</p>
        </div>
      </div>

      {/* Current user info */}
      <div className="px-4 py-3 border-t border-[#E8E0D0] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#C8956C] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {currentUser?.email?.[0]?.toUpperCase()}
        </div>
        <p className="text-xs text-[#A89880] truncate">{currentUser?.email}</p>
      </div>
    </div>
  );
}