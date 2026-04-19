import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";

function App() {
  const { currentUser } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-500 flex flex-col items-center justify-center gap-4">
                <p className="text-white text-2xl font-bold">✅ Logged in!</p>
                <p className="text-white/70">{currentUser.email}</p>
                <button
                  onClick={() => signOut(auth)}
                  className="bg-white text-purple-600 font-bold px-6 py-2 rounded-xl hover:bg-white/90"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <AuthPage />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;