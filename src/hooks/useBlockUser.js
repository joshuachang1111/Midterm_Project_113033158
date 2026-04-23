import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/config";

export function useBlockStatus(uid) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedByUsers, setBlockedByUsers] = useState([]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        setBlockedUsers(snap.data().blockedUsers || []);
        setBlockedByUsers(snap.data().blockedByUsers || []);
      }
    });
    return unsub;
  }, [uid]);

  return { blockedUsers, blockedByUsers };
}

export async function blockUser(myUid, targetUid) {
  await Promise.all([
    updateDoc(doc(db, "users", myUid), {
      blockedUsers: arrayUnion(targetUid),
    }),
    updateDoc(doc(db, "users", targetUid), {
      blockedByUsers: arrayUnion(myUid),
    }),
  ]);
}

export async function unblockUser(myUid, targetUid) {
  await Promise.all([
    updateDoc(doc(db, "users", myUid), {
      blockedUsers: arrayRemove(targetUid),
    }),
    updateDoc(doc(db, "users", targetUid), {
      blockedByUsers: arrayRemove(myUid),
    }),
  ]);
}