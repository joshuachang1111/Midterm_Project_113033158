import GroupAvatars from "./GroupAvatars";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

export default function ChatHeader({
  chatData, otherUser, isGroup, members, memberProfiles, currentUid,
  showSearch, setShowSearch, setSearchQuery,
  showMenu, setShowMenu,
  onEditGroup, onAddMembers, onLeaveGroup,
}) {
  return (
    <div className="px-6 py-4 border-b border-[#E8E0D0] flex items-center gap-3 bg-white/60 backdrop-blur-sm flex-shrink-0">
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {isGroup ? (
          chatData?.photoURL ? (
            <img src={chatData.photoURL} alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#E8D5B7]" />
          ) : (
            <GroupAvatars memberProfiles={memberProfiles} currentUid={currentUid} />
          )
        ) : (
          otherUser && (
            <img src={otherUser.photoURL || DEFAULT_AVATAR} alt={otherUser.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#E8D5B7] flex-shrink-0" />
          )
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[#2C2825] truncate">
            {isGroup ? chatData?.name : otherUser?.username}
          </p>
          <p className="text-xs text-[#A89880]">
            {isGroup ? `${members.length} members` : `@${otherUser?.userId || ""}`}
          </p>
        </div>
      </div>

      {/* Search icon */}
      <button
        onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
          ${showSearch ? "bg-[#E8D5B7] text-[#2C2825]" : "text-[#A89880] hover:text-[#2C2825] hover:bg-[#F5ECD7]"}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </button>

      {isGroup && (
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#A89880] hover:text-[#2C2825] hover:bg-[#F5ECD7] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-[#E8D5B7] overflow-hidden z-10 w-44">
              <button onClick={onEditGroup}
                className="w-full px-4 py-3 text-left text-sm text-[#2C2825] hover:bg-[#F5ECD7] transition-colors">
                Edit Group
              </button>
              <button onClick={onAddMembers}
                className="w-full px-4 py-3 text-left text-sm text-[#2C2825] hover:bg-[#F5ECD7] transition-colors">
                Add Members
              </button>
              <button onClick={onLeaveGroup}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-50 transition-colors">
                Leave Group
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}