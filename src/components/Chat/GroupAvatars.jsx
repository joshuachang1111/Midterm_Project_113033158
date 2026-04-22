import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

// 用在 ChatHeader（接收已抓好的 memberProfiles）
export default function GroupAvatars({ memberProfiles, currentUid }) {
  const others = Object.entries(memberProfiles)
    .filter(([uid]) => uid !== currentUid)
    .slice(0, 3)
    .map(([, profile]) => profile);

  return (
    <div className="w-10 h-10 relative flex-shrink-0">
      {others.map((profile, i) => (
        <img key={i} src={profile?.photoURL || DEFAULT_AVATAR} alt=""
          className="absolute w-7 h-7 rounded-full object-cover border-2 border-[#FAF7F2]"
          style={{
            top: i === 0 ? 0 : i === 1 ? "auto" : 0,
            bottom: i === 1 ? 0 : "auto",
            left: i === 0 ? 0 : "auto",
            right: i === 1 ? 0 : i === 2 ? 0 : "auto",
            zIndex: 3 - i,
          }}
        />
      ))}
    </div>
  );
}

// 用在 ChatList（只有 members uid array，需要自己抓資料）
export function GroupAvatarsFromUids({ members, currentUid }) {
  const [avatars, setAvatars] = useState([]);

  useEffect(() => {
    const others = members.filter(uid => uid !== currentUid).slice(0, 3);
    Promise.all(others.map(uid =>
      getDoc(doc(db, "users", uid)).then(snap => snap.exists() ? snap.data().photoURL : DEFAULT_AVATAR)
    )).then(setAvatars);
  }, [members, currentUid]);

  return (
    <div className="w-11 h-11 relative flex-shrink-0">
      {avatars.slice(0, 3).map((url, i) => (
        <img key={i} src={url || DEFAULT_AVATAR} alt=""
          className="absolute w-7 h-7 rounded-full object-cover border-2 border-[#F5F0E8]"
          style={{
            top: i === 0 ? 0 : i === 1 ? "auto" : 0,
            bottom: i === 1 ? 0 : "auto",
            left: i === 0 ? 0 : "auto",
            right: i === 1 ? 0 : i === 2 ? 0 : "auto",
            zIndex: 3 - i,
          }}
        />
      ))}
    </div>
  );
}