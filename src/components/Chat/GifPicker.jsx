import { useState, useEffect } from "react";

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const LIMIT = 24;

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  // 預設載入 trending
  useEffect(() => {
    fetchGifs("");
  }, []);

  async function fetchGifs(searchQuery) {
    setLoading(true);
    try {
      const endpoint = searchQuery.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(searchQuery)}&limit=${LIMIT}&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${LIMIT}&rating=g`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (err) {
      console.error("Failed to fetch GIFs", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!query.trim()) {
      fetchGifs("");
      return;
    }
    const timer = setTimeout(() => fetchGifs(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#E8D5B7] overflow-hidden z-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-[#E8E0D0]">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89880]"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8D5B7] rounded-xl text-sm text-[#2C2825] placeholder-[#A89880] focus:outline-none focus:ring-2 focus:ring-[#C8956C]/30"
          />
        </div>
        <button onClick={onClose}
          className="text-[#A89880] hover:text-[#2C2825] transition-colors flex-shrink-0">✕</button>
      </div>

      {/* GIF Grid */}
      <div className="h-64 overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <svg className="w-6 h-6 animate-spin text-[#C8956C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        )}
        {!loading && gifs.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#A89880] text-sm">
            No GIFs found
          </div>
        )}
        {!loading && (
          <div className="grid grid-cols-3 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="aspect-square rounded-xl overflow-hidden hover:opacity-80 transition-opacity hover:ring-2 hover:ring-[#C8956C]"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Powered by GIPHY */}
      <div className="px-4 py-2 border-t border-[#E8E0D0] flex justify-end">
        <p className="text-xs text-[#A89880]">Powered by GIPHY</p>
      </div>
    </div>
  );
}