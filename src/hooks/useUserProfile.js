import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    };
    fetch();
  }, [uid]);

  return { profile, loading };
}

export async function checkUserIdAvailable(userId, currentUid) {
  const q = query(collection(db, "users"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return true;
  // 如果找到的是自己就算可用
  return snap.docs[0].id === currentUid;
}

export async function saveUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}