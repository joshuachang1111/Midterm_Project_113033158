import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { checkUserIdAvailable, saveUserProfile } from "../../hooks/useUserProfile";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dynzpaa0u/image/upload/v1776656443/default-avatar_vmy7o0.jpg";

export default function ProfileModal({ onClose, forceOpen = false, initialData = null }) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef();

  const [username, setUsername] = useState(initialData?.username || "");
  const [userId, setUserId] = useState(initialData?.userId || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [photoURL, setPhotoURL] = useState(initialData?.photoURL || DEFAULT_AVATAR);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialData?.photoURL || DEFAULT_AVATAR);

  const [userIdStatus, setUserIdStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username || "");
      setUserId(initialData.userId || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      setPhotoURL(initialData.photoURL || DEFAULT_AVATAR);
      setPhotoPreview(initialData.photoURL || DEFAULT_AVATAR);
    }
  }, [initialData]);

  useEffect(() => {
    if (!userId) { setUserIdStatus(null); return; }
    const valid = /^[a-zA-Z0-9_]+$/.test(userId);
    if (!valid) { setUserIdStatus("invalid"); return; }

    setUserIdStatus("checking");
    const timer = setTimeout(async () => {
      const available = await checkUserIdAvailable(userId, currentUser.uid);
      setUserIdStatus(available ? "available" : "taken");
    }, 600);
    return () => clearTimeout(timer);
  }, [userId, currentUser.uid]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");
    return data.secure_url;
  }

  async function handleSave() {
    setError("");
    if (!username.trim()) { setError("Username is required."); return; }
    if (!userId.trim()) { setError("User ID is required."); return; }
    if (userIdStatus === "taken") { setError("User ID is already taken."); return; }
    if (userIdStatus === "invalid") { setError("User ID can only contain letters, numbers, and underscores."); return; }
    if (userIdStatus === "checking") { setError("Please wait while we check your User ID."); return; }

    setSaving(true);
    try {
      let finalPhotoURL = photoURL || DEFAULT_AVATAR;
      if (photoFile) {
        try {
          finalPhotoURL = await uploadToCloudinary(photoFile);
        } catch (err) {
          console.error("Upload failed", err);
          finalPhotoURL = photoURL || DEFAULT_AVATAR;
        }
      }

      await saveUserProfile(currentUser.uid, {
        username: username.trim(),
        userId: userId.trim(),
        email: currentUser.email,
        phone: phone.trim(),
        address: address.trim(),
        photoURL: finalPhotoURL,
        createdAt: initialData?.createdAt || new Date().toISOString(),
      });

      onClose();
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      console.error(err);
    }
    setSaving(false);
  }

  const userIdIndicator = () => {
    if (!userId) return null;
    if (userIdStatus === "checking") return <span className="text-[#A89880] text-xs">Checking...</span>;
    if (userIdStatus === "available") return <span className="text-green-500 text-xs">✓ Available</span>;
    if (userIdStatus === "taken") return <span className="text-red-400 text-xs">✗ Already taken</span>;
    if (userIdStatus === "invalid") return <span className="text-red-400 text-xs">✗ Letters, numbers, underscores only</span>;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#E8D5B7]">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2C2825]">Edit Profile</h2>
          {!forceOpen && (
            <button onClick={onClose}
              className="text-[#A89880] hover:text-[#2C2825] transition-colors text-xl">✕</button>
          )}
        </div>

        <div className="px-8 pb-8 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#E8D5B7] cursor-pointer hover:opacity-80 transition-opacity relative group"
              onClick={() => fileInputRef.current.click()}
            >
              <img src={photoPreview} alt="avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <span className="text-white text-xs font-medium">Change</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*"
              className="hidden" onChange={handlePhotoChange} />
            <p className="text-xs text-[#A89880]">Click to upload photo</p>
          </div>

          {/* Username */}
          <div>
            <label className="text-[#2C2825] text-sm font-semibold block mb-1">
              Username <span className="text-[#C8956C]">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 text-sm"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="text-[#2C2825] text-sm font-semibold block mb-1">
              User ID <span className="text-[#C8956C]">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value.toLowerCase())}
              placeholder="e.g. joshua_123"
              className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 text-sm"
            />
            <div className="mt-1 h-4">{userIdIndicator()}</div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[#2C2825] text-sm font-semibold block mb-1">Email</label>
            <input
              type="text"
              value={currentUser?.email || ""}
              disabled
              className="w-full bg-[#F5F0E8] border border-[#E8D5B7] rounded-xl px-4 py-3 text-[#A89880] text-sm cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[#2C2825] text-sm font-semibold block mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 text-sm"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-[#2C2825] text-sm font-semibold block mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional"
              className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30 text-sm"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#2C2825] text-white font-bold py-3 rounded-xl hover:bg-[#3D3530] transition-all duration-200 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}