import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function EditGroupModal({ chatroomId, currentName, currentPhoto, onClose }) {
  const [name, setName] = useState(currentName || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(currentPhoto || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    if (!name.trim()) { setError("Group name is required."); return; }
    setSaving(true);
    try {
      let finalPhoto = currentPhoto;
      if (photoFile) {
        finalPhoto = await uploadToCloudinary(photoFile);
      }
      await updateDoc(doc(db, "chatrooms", chatroomId), {
        name: name.trim(),
        photoURL: finalPhoto || null,
      });
      onClose();
    } catch (err) {
      setError("Failed to save. Please try again.");
      console.error(err);
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-sm border border-[#E8D5B7]">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2C2825]">Edit Group</h2>
          <button onClick={onClose} className="text-[#A89880] hover:text-[#2C2825] text-xl">✕</button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Group photo */}
          <div className="flex flex-col items-center gap-2">
            <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#E8D5B7] flex items-center justify-center cursor-pointer hover:bg-[#F5ECD7] transition-colors overflow-hidden relative group">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Change</span>
                  </div>
                </>
              ) : (
                <svg className="w-8 h-8 text-[#A89880]" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            <p className="text-xs text-[#A89880]">Click to change photo</p>
          </div>

          {/* Group name */}
          <div>
            <label className="text-[#2C2825] text-sm font-semibold block mb-1">
              Group Name <span className="text-[#C8956C]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full bg-white border border-[#E8D5B7] rounded-xl px-4 py-3 text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#2C2825] text-white font-bold py-3 rounded-xl hover:bg-[#3D3530] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}