import { useState, useEffect } from "react";
import Auth from "./Auth";
import SpentWell from "./SpentWell";
import ParentApproval from "./ParentApproval";

export default function App() {
  const [user, setUser]           = useState(null);
  const [reviewData, setReviewData] = useState(null);

  // ── Check URL for parent approval review link ──────────
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const swReview = params.get("sw_review");
    if (swReview) {
      try { setReviewData(JSON.parse(atob(swReview))); }
      catch { /* bad param, ignore */ }
    }
  }, []);

  // ── Auto-login from localStorage session ───────────────
  useEffect(() => {
    if (reviewData) return;
    try {
      const session = localStorage.getItem("sw_session");
      if (session) {
        const userId = JSON.parse(session);
        const users  = JSON.parse(localStorage.getItem("sw_users") || "{}");
        if (users[userId]) setUser({ ...users[userId], userId });
      }
    } catch { /* ignore */ }
  }, [reviewData]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("sw_session", JSON.stringify(userData.userId));
  };

  const handleLogout = () => {
    localStorage.removeItem("sw_session");
    setUser(null);
  };

  // Parent approval page — no login needed
  if (reviewData) return <ParentApproval data={reviewData} />;

  if (!user) return <Auth onLogin={handleLogin} />;

  return <SpentWell user={user} onLogout={handleLogout} />;
}
