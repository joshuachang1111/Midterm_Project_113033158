import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) setProfile(snap.data());
    else setProfile(null);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}

export async function checkUserIdAvailable(userId, currentUid) {
  const q = query(collection(db, "users"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return true;
  return snap.docs[0].id === currentUid;
}

export async function saveUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}