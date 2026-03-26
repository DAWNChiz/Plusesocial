import { useState, useEffect, useRef, useCallback } from "react";

// ── Storage helpers ──────────────────────────────────────────────────────────
const S = {
  async get(k, shared = false) {
    try { const r = await window.storage.get(k, shared); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async set(k, v, shared = false) {
    try { await window.storage.set(k, JSON.stringify(v), shared); return true; }
    catch { return false; }
  },
  async list(prefix, shared = false) {
    try { const r = await window.storage.list(prefix, shared); return r?.keys || []; }
    catch { return []; }
  },
};

const COLORS = ["#FF6B6B","#4ECDC4","#FFE66D","#A8E6CF","#FF8B94","#F0ABFC","#93C5FD","#FCA5A5","#6EE7B7","#FDBA74"];
const EMOJIS = ["😀","😂","😍","🔥","👍","❤️","🎉","😊","🙌","💯","👀","✨","😭","🥳","🤔","💪","🫡","🤝","🌟","🥰","😎","🙏","💥","🎶","🍕"];

// ── Tiny components ──────────────────────────────────────────────────────────
const Avatar = ({ user, size = 42, ring = false, showStatus = false }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${user.color}cc, ${user.color})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Mono', monospace", fontWeight: 700,
      fontSize: Math.max(10, size * 0.31), color: "#fff",
      boxShadow: ring ? `0 0 0 2px #0D0D12, 0 0 0 3.5px ${user.color}` : "none",
      letterSpacing: "-0.5px", flexShrink: 0, userSelect: "none",
    }}>
      {(user.name || "?").slice(0, 2).toUpperCase()}
    </div>
    {showStatus && (
      <span style={{
        position: "absolute", bottom: 1, right: 1,
        width: Math.max(8, size * 0.24), height: Math.max(8, size * 0.24),
        borderRadius: "50%",
        background: user.online ? "#4ADE80" : "#4B5563",
        border: "2px solid #0D0D12",
      }} />
    )}
  </div>
);

const TypingBubble = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px",
    background: "#1E1E2A", borderRadius: "18px 18px 18px 4px", width: "fit-content" }}>
    {[0,1,2].map(i => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: "50%", background: "#6B7280",
        display: "inline-block",
        animation: `typingBounce 1.2s ${i * 0.2}s infinite ease-in-out`,
      }} />
    ))}
  </div>
);

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash"); // splash | login | signup | home
  const [me, setMe] = useState(null);
  const [view, setView] = useState("chats"); // chats | friends | profile
  const [friends, setFriends] = useState([]);        // full user objects I'm friends with
  const [requests, setRequests] = useState([]);      // incoming friend requests
  const [sentReqs, setSentReqs] = useState([]);      // usernames I've requested
  const [activeChat, setActiveChat] = useState(null);// user object
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [toast, setToast] = useState(null);
  const [authForm, setAuthForm] = useState({ username: "", password: "", name: "", color: COLORS[0] });
  const [authErr, setAuthErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});

  const fileRef = useRef();
  const chatEndRef = useRef();
  const typingTimerRef = useRef();
  const pollRef = useRef();
  const typingPollRef = useRef();
  const onlinePollRef = useRef();

  // ── Helpers ──────────────────────────────────────────────────────────────
  const notify = (msg, color = "#A78BFA") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  const chatKey = (a, b) => {
    const ids = [a, b].sort();
    return `chat:${ids[0]}_${ids[1]}`;
  };

  // ── Auth ─────────────────────────────────────────────────────────────────
  const doSignup = async () => {
    const { username, password, name, color } = authForm;
    if (!username.trim() || !password || !name.trim()) { setAuthErr("All fields required."); return; }
    if (username.length < 3) { setAuthErr("Username must be 3+ chars."); return; }
    if (password.length < 4) { setAuthErr("Password must be 4+ chars."); return; }
    setLoading(true);
    const existing = await S.get(`user:${username.toLowerCase()}`, true);
    if (existing) { setAuthErr("Username taken. Try another."); setLoading(false); return; }
    const user = {
      username: username.toLowerCase().trim(), name: name.trim(),
      password, color, bio: "Hey, I'm on Pulse! 👋",
      createdAt: Date.now(), online: true, lastSeen: Date.now(),
    };
    await S.set(`user:${user.username}`, user, true);
    await S.set(`user:${user.username}`, user, false); // private copy (own session)
    setMe(user);
    setScreen("home");
    setLoading(false);
    notify("Welcome to Pulse! 🎉");
    startHeartbeat(user.username);
  };

  const doLogin = async () => {
    const { username, password } = authForm;
    if (!username || !password) { setAuthErr("Fill in all fields."); return; }
    setLoading(true);
    const user = await S.get(`user:${username.toLowerCase()}`, true);
    if (!user) { setAuthErr("User not found."); setLoading(false); return; }
    if (user.password !== password) { setAuthErr("Wrong password."); setLoading(false); return; }
    const updated = { ...user, online: true, lastSeen: Date.now() };
    await S.set(`user:${user.username}`, updated, true);
    setMe(updated);
    setScreen("home");
    setLoading(false);
    notify(`Welcome back, ${user.name}! 👋`);
    startHeartbeat(user.username);
  };

  const doLogout = async () => {
    if (me) {
      const u = { ...me, online: false, lastSeen: Date.now() };
      await S.set(`user:${me.username}`, u, true);
    }
    clearInterval(pollRef.current);
    clearInterval(typingPollRef.current);
    clearInterval(onlinePollRef.current);
    setMe(null); setFriends([]); setRequests([]); setSentReqs([]);
    setMessages([]); setActiveChat(null); setScreen("login");
    setAuthForm({ username: "", password: "", name: "", color: COLORS[0] });
  };

  // ── Heartbeat / online presence ──────────────────────────────────────────
  const startHeartbeat = (username) => {
    const beat = async () => {
      const u = await S.get(`user:${username}`, true);
      if (u) await S.set(`user:${username}`, { ...u, online: true, lastSeen: Date.now() }, true);
    };
    beat();
    const id = setInterval(beat, 8000);
    return () => clearInterval(id);
  };

  // ── Load friends & requests ───────────────────────────────────────────────
  const loadSocial = useCallback(async () => {
    if (!me) return;
    // friends
    const fKeys = await S.list(`friends:${me.username}:`, false);
    const fList = [];
    for (const k of fKeys) {
      const uname = k.replace(`friends:${me.username}:`, "");
      const u = await S.get(`user:${uname}`, true);
      if (u) fList.push(u);
    }
    setFriends(fList);

    // incoming requests
    const rKeys = await S.list(`friendreq:${me.username}:`, true);
    const rList = [];
    for (const k of rKeys) {
      const from = k.replace(`friendreq:${me.username}:`, "");
      const u = await S.get(`user:${from}`, true);
      if (u) rList.push(u);
    }
    setRequests(rList);

    // sent requests
    const sKeys = await S.list(`myreq:${me.username}:`, false);
    setSentReqs(sKeys.map(k => k.replace(`myreq:${me.username}:`, "")));

    // online status for friends
    const onl = {};
    for (const f of fList) {
      onl[f.username] = f.online && (Date.now() - f.lastSeen < 15000);
    }
    setOnlineUsers(onl);
  }, [me]);

  // ── Load messages for active chat ────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!me || !activeChat) return;
    const key = chatKey(me.username, activeChat.username);
    const data = await S.get(key, true);
    const msgs = data?.messages || [];
    setMessages(msgs);
    // mark seen
    const updated = msgs.map(m => m.from !== me.username && !m.seen ? { ...m, seen: true } : m);
    if (updated.some((m, i) => m.seen !== msgs[i]?.seen)) {
      await S.set(key, { messages: updated }, true);
      setMessages(updated);
    }
  }, [me, activeChat]);

  // ── Poll for new messages & typing ───────────────────────────────────────
  useEffect(() => {
    if (!me || !activeChat) return;
    loadMessages();
    pollRef.current = setInterval(loadMessages, 2000);
    typingPollRef.current = setInterval(async () => {
      const t = await S.get(`typing:${activeChat.username}:${me.username}`, true);
      setPeerTyping(t && Date.now() - t.at < 3000);
    }, 1000);
    return () => { clearInterval(pollRef.current); clearInterval(typingPollRef.current); };
  }, [me, activeChat, loadMessages]);

  // ── Poll social (friends/requests/online) ────────────────────────────────
  useEffect(() => {
    if (!me) return;
    loadSocial();
    onlinePollRef.current = setInterval(loadSocial, 10000);
    return () => clearInterval(onlinePollRef.current);
  }, [me, loadSocial]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  // ── Send typing signal ────────────────────────────────────────────────────
  const signalTyping = async () => {
    if (!me || !activeChat) return;
    await S.set(`typing:${me.username}:${activeChat.username}`, { at: Date.now() }, true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(async () => {
      await S.set(`typing:${me.username}:${activeChat.username}`, { at: 0 }, true);
    }, 2500);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text, type = "text", extra = {}) => {
    if ((!text.trim() && type === "text") || !activeChat) return;
    const key = chatKey(me.username, activeChat.username);
    const data = await S.get(key, true);
    const msgs = data?.messages || [];
    const msg = { id: Date.now(), from: me.username, text: type === "text" ? text.trim() : text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type, seen: false, ...extra };
    const updated = [...msgs, msg];
    await S.set(key, { messages: updated }, true);
    setMessages(updated);
    setInput("");
    setShowEmoji(false);
    await S.set(`typing:${me.username}:${activeChat.username}`, { at: 0 }, true);
  };

  // ── File send ─────────────────────────────────────────────────────────────
  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await sendMessage(file.name, isImage ? "image" : "file",
        { dataUrl: ev.target.result, fileSize: (file.size / 1024).toFixed(1) + " KB" });
      notify(isImage ? "Photo sent 📷" : "File sent 📎");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Friend actions ────────────────────────────────────────────────────────
  const sendFriendReq = async (user) => {
    await S.set(`friendreq:${user.username}:${me.username}`, true, true);
    await S.set(`myreq:${me.username}:${user.username}`, true, false);
    setSentReqs(p => [...p, user.username]);
    notify(`Friend request sent to ${user.name}!`);
  };

  const acceptReq = async (user) => {
    await S.set(`friends:${me.username}:${user.username}`, true, false);
    await S.set(`friends:${user.username}:${me.username}`, true, false);
    // remove request
    try { await window.storage.delete(`friendreq:${me.username}:${user.username}`, true); } catch {}
    setRequests(p => p.filter(u => u.username !== user.username));
    setFriends(p => [...p, { ...user, online: false }]);
    notify(`${user.name} is now your friend! 🎉`);
  };

  const declineReq = async (user) => {
    try { await window.storage.delete(`friendreq:${me.username}:${user.username}`, true); } catch {}
    setRequests(p => p.filter(u => u.username !== user.username));
    notify("Request declined.");
  };

  // ── User search ────────────────────────────────────────────────────────────
  const doSearch = async () => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    setSearching(true);
    // We search known user keys. Since we can't list all shared keys by prefix efficiently,
    // we try exact match + common usernames by trying the typed name directly.
    const q = searchQ.toLowerCase().trim();
    const found = [];
    const u = await S.get(`user:${q}`, true);
    if (u && u.username !== me.username) found.push(u);
    setSearchResults(found);
    setSearching(false);
    if (!found.length) notify("No user found. Try exact username.", "#F97316");
  };

  // ── Profile update ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    const updated = { ...me, ...profileDraft };
    await S.set(`user:${me.username}`, updated, true);
    setMe(updated);
    setEditingProfile(false);
    setProfileDraft({});
    notify("Profile updated! ✨");
  };

  // ── Last message preview ──────────────────────────────────────────────────
  const [lastMsgs, setLastMsgs] = useState({});
  useEffect(() => {
    if (!me || !friends.length) return;
    const load = async () => {
      const lm = {};
      for (const f of friends) {
        const key = chatKey(me.username, f.username);
        const data = await S.get(key, true);
        const msgs = data?.messages || [];
        lm[f.username] = msgs[msgs.length - 1] || null;
      }
      setLastMsgs(lm);
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [me, friends]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#0D0D12", minHeight: "100vh", color: "#E2E8F0",
      maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800&family=DM+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#2A2A38;border-radius:10px}
        input,textarea{outline:none;border:none;background:none;font-family:inherit;color:inherit}
        button{cursor:pointer;border:none;font-family:inherit}
        .ripple{transition:all .15s ease}
        .ripple:active{transform:scale(.97)}
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes popIn{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .msg-in{animation:popIn .2s ease}
        .screen-enter{animation:fadeUp .3s ease}
        .skeleton{background:linear-gradient(90deg,#1E1E2A 25%,#252535 50%,#1E1E2A 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
        .tab-btn:hover{background:#1A1A26!important}
        .chat-row:hover{background:#151520!important}
        input::placeholder{color:#4B5563}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: toast.color, color: "#fff", padding: "10px 22px",
          borderRadius: 28, zIndex: 9999, fontWeight: 700, fontSize: 13,
          boxShadow: `0 4px 24px ${toast.color}66`, animation: "popIn .2s ease",
          whiteSpace: "nowrap",
        }}>{toast.msg}</div>
      )}

      {/* ── SPLASH ── */}
      {screen === "splash" && (
        <div className="screen-enter" style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", minHeight: "100vh",
          padding: 32, gap: 0,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: "linear-gradient(135deg, #A78BFA, #6366F1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38, marginBottom: 24,
            boxShadow: "0 0 60px #A78BFA55",
          }}>⚡</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 36, letterSpacing: "-2px",
            background: "linear-gradient(135deg, #A78BFA, #6366F1, #EC4899)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>pulse</div>
          <div style={{ color: "#4B5563", fontSize: 14, marginTop: 8, marginBottom: 48 }}>
            Real connections. Live.
          </div>
          <button className="ripple" onClick={() => setScreen("signup")} style={{
            width: "100%", padding: "15px", borderRadius: 18,
            background: "linear-gradient(135deg, #A78BFA, #6366F1)",
            color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 12,
          }}>Create Account</button>
          <button className="ripple" onClick={() => setScreen("login")} style={{
            width: "100%", padding: "15px", borderRadius: 18,
            background: "#1A1A26", color: "#A78BFA",
            fontWeight: 700, fontSize: 16, border: "1px solid #2A2A38",
          }}>Sign In</button>
        </div>
      )}

      {/* ── SIGNUP ── */}
      {screen === "signup" && (
        <div className="screen-enter" style={{
          flex: 1, padding: "48px 28px 32px", display: "flex",
          flexDirection: "column", minHeight: "100vh", overflowY: "auto",
        }}>
          <button onClick={() => setScreen("splash")} style={{ background: "none", color: "#6B7280", fontSize: 22, marginBottom: 24, alignSelf: "flex-start" }}>←</button>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 28, letterSpacing: "-1px",
            background: "linear-gradient(135deg, #A78BFA, #6366F1)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6,
          }}>Join Pulse</div>
          <div style={{ color: "#4B5563", fontSize: 14, marginBottom: 32 }}>Create your account to get started.</div>

          {["name","username","password"].map(field => (
            <div key={field} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                {field === "name" ? "Display Name" : field.charAt(0).toUpperCase() + field.slice(1)}
              </div>
              <input
                type={field === "password" ? "password" : "text"}
                value={authForm[field]}
                onChange={e => setAuthForm(p => ({ ...p, [field]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && doSignup()}
                placeholder={field === "name" ? "Your name" : field === "username" ? "unique_handle" : "••••••••"}
                style={{
                  width: "100%", background: "#1A1A26", borderRadius: 14,
                  padding: "13px 16px", fontSize: 15,
                  border: "1px solid #2A2A38",
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Avatar Color</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setAuthForm(p => ({ ...p, color: c }))} style={{
                  width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer",
                  border: authForm.color === c ? "3px solid #fff" : "3px solid transparent",
                  boxShadow: authForm.color === c ? `0 0 12px ${c}` : "none",
                  transition: "all .15s",
                }} />
              ))}
            </div>
          </div>

          {authErr && <div style={{ color: "#F87171", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>⚠ {authErr}</div>}

          <button className="ripple" onClick={doSignup} disabled={loading} style={{
            width: "100%", padding: 15, borderRadius: 18,
            background: loading ? "#2A2A38" : "linear-gradient(135deg, #A78BFA, #6366F1)",
            color: "#fff", fontWeight: 800, fontSize: 15,
          }}>
            {loading ? "Creating..." : "Create Account →"}
          </button>
          <div style={{ textAlign: "center", marginTop: 20, color: "#4B5563", fontSize: 13 }}>
            Already have an account?{" "}
            <span onClick={() => { setScreen("login"); setAuthErr(""); }} style={{ color: "#A78BFA", fontWeight: 700, cursor: "pointer" }}>
              Sign In
            </span>
          </div>
        </div>
      )}

      {/* ── LOGIN ── */}
      {screen === "login" && (
        <div className="screen-enter" style={{
          flex: 1, padding: "48px 28px 32px", display: "flex",
          flexDirection: "column", minHeight: "100vh",
        }}>
          <button onClick={() => setScreen("splash")} style={{ background: "none", color: "#6B7280", fontSize: 22, marginBottom: 24, alignSelf: "flex-start" }}>←</button>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 28, letterSpacing: "-1px",
            background: "linear-gradient(135deg, #A78BFA, #6366F1)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6,
          }}>Welcome back</div>
          <div style={{ color: "#4B5563", fontSize: 14, marginBottom: 32 }}>Sign in to continue.</div>

          {["username","password"].map(field => (
            <div key={field} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </div>
              <input
                type={field === "password" ? "password" : "text"}
                value={authForm[field]}
                onChange={e => setAuthForm(p => ({ ...p, [field]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && doLogin()}
                placeholder={field === "username" ? "your_username" : "••••••••"}
                style={{
                  width: "100%", background: "#1A1A26", borderRadius: 14,
                  padding: "13px 16px", fontSize: 15, border: "1px solid #2A2A38",
                }}
              />
            </div>
          ))}

          {authErr && <div style={{ color: "#F87171", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>⚠ {authErr}</div>}

          <button className="ripple" onClick={doLogin} disabled={loading} style={{
            width: "100%", padding: 15, borderRadius: 18,
            background: loading ? "#2A2A38" : "linear-gradient(135deg, #A78BFA, #6366F1)",
            color: "#fff", fontWeight: 800, fontSize: 15, marginTop: 8,
          }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
          <div style={{ textAlign: "center", marginTop: 20, color: "#4B5563", fontSize: 13 }}>
            New here?{" "}
            <span onClick={() => { setScreen("signup"); setAuthErr(""); }} style={{ color: "#A78BFA", fontWeight: 700, cursor: "pointer" }}>
              Create account
            </span>
          </div>
        </div>
      )}

      {/* ── HOME ── */}
      {screen === "home" && me && (
        <>
          {/* Top Bar */}
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #1A1A26",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0D0D12", position: "sticky", top: 0, zIndex: 20,
          }}>
            {activeChat && view === "chats" ? (
              <button onClick={() => { setActiveChat(null); setMessages([]); setShowEmoji(false); }}
                style={{ background: "#1A1A26", color: "#A78BFA", padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                ← Back
              </button>
            ) : (
              <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 22, letterSpacing: "-1px",
                background: "linear-gradient(135deg, #A78BFA, #6366F1)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>pulse</div>
            )}
            {activeChat && view === "chats" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar user={activeChat} size={36} showStatus ring />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{activeChat.name}</div>
                  <div style={{ fontSize: 11, color: onlineUsers[activeChat.username] ? "#4ADE80" : "#6B7280" }}>
                    {onlineUsers[activeChat.username] ? "● Active now" : "● Offline"}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {requests.length > 0 && (
                  <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>
                    {requests.length} req
                  </span>
                )}
                <Avatar user={me} size={32} />
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: activeChat ? 0 : 72 }}>

            {/* ── CHATS LIST ── */}
            {view === "chats" && !activeChat && (
              <div>
                <div style={{ padding: "16px 20px 6px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Messages</div>
                  {friends.length === 0 && (
                    <div style={{ textAlign: "center", color: "#4B5563", padding: "40px 0", fontSize: 14 }}>
                      <div style={{ fontSize: 42, marginBottom: 12 }}>💬</div>
                      Add friends to start chatting!
                    </div>
                  )}
                  {friends.map(user => {
                    const lm = lastMsgs[user.username];
                    const isOnline = onlineUsers[user.username];
                    const unread = lm && !lm.seen && lm.from !== me.username;
                    return (
                      <div key={user.username} className="chat-row" onClick={() => setActiveChat({ ...user, online: isOnline })} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 0", borderBottom: "1px solid #151520",
                        cursor: "pointer", transition: "background .15s", borderRadius: 12,
                      }}>
                        <Avatar user={{ ...user, online: isOnline }} size={50} showStatus />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontWeight: unread ? 800 : 600, fontSize: 14 }}>{user.name}</div>
                            <div style={{ fontSize: 11, color: "#4B5563" }}>{lm?.time || ""}</div>
                          </div>
                          <div style={{ fontSize: 13, color: unread ? "#A78BFA" : "#6B7280", marginTop: 3,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: unread ? 600 : 400 }}>
                            {lm ? (lm.type === "image" ? "📷 Photo" : lm.type === "file" ? `📎 ${lm.text}` : (lm.from === me.username ? `You: ${lm.text}` : lm.text)) : "Say hello! 👋"}
                          </div>
                        </div>
                        {unread && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#A78BFA", flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CHAT WINDOW ── */}
            {view === "chats" && activeChat && (
              <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#4B5563", marginTop: 60, fontSize: 14 }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>👋</div>
                      Say hello to {activeChat.name}!
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMe = msg.from === me.username;
                    const isLast = i === messages.length - 1;
                    return (
                      <div key={msg.id} className="msg-in" style={{
                        display: "flex", flexDirection: isMe ? "row-reverse" : "row",
                        alignItems: "flex-end", gap: 8,
                      }}>
                        {!isMe && <Avatar user={activeChat} size={28} />}
                        <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                          <div style={{
                            background: isMe ? "linear-gradient(135deg, #A78BFA, #6366F1)" : "#1E1E2A",
                            color: "#fff",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            padding: msg.type === "image" ? 4 : "10px 14px",
                            fontSize: 14, lineHeight: 1.55,
                          }}>
                            {msg.type === "image" && (
                              <img src={msg.dataUrl} alt="" style={{ maxWidth: 220, maxHeight: 240, borderRadius: 14, display: "block" }} />
                            )}
                            {msg.type === "file" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 24 }}>📎</span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{msg.text}</div>
                                  <div style={{ fontSize: 11, opacity: .65 }}>{msg.fileSize}</div>
                                </div>
                              </div>
                            )}
                            {msg.type === "text" && msg.text}
                          </div>
                          <div style={{ fontSize: 10, color: "#4B5563", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            {msg.time}
                            {isMe && isLast && (
                              <span style={{ color: msg.seen ? "#A78BFA" : "#4B5563", fontWeight: 700 }}>
                                {msg.seen ? " ✓✓" : " ✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {peerTyping && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      <Avatar user={activeChat} size={28} />
                      <TypingBubble />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Emoji Picker */}
                {showEmoji && (
                  <div style={{
                    background: "#141420", borderTop: "1px solid #1E1E2A",
                    padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 10,
                  }}>
                    {EMOJIS.map(e => (
                      <span key={e} onClick={() => setInput(p => p + e)} style={{
                        fontSize: 22, cursor: "pointer", transition: "transform .1s", display: "inline-block",
                      }} onMouseOver={ev => ev.target.style.transform = "scale(1.3)"}
                        onMouseOut={ev => ev.target.style.transform = "scale(1)"}>
                        {e}
                      </span>
                    ))}
                  </div>
                )}

                {/* Input bar */}
                <div style={{
                  padding: "10px 14px", borderTop: "1px solid #1A1A26",
                  display: "flex", gap: 8, alignItems: "center", background: "#0D0D12",
                }}>
                  <input type="file" ref={fileRef} onChange={sendFile} style={{ display: "none" }} accept="image/*,video/*,application/*" />
                  <button onClick={() => fileRef.current.click()} style={{
                    background: "#1A1A26", borderRadius: "50%", width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#A78BFA", fontSize: 17, flexShrink: 0,
                  }}>📎</button>
                  <button onClick={() => setShowEmoji(p => !p)} style={{
                    background: showEmoji ? "#2A1F44" : "#1A1A26", borderRadius: "50%",
                    width: 40, height: 40, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18, flexShrink: 0,
                  }}>😊</button>
                  <input
                    value={input}
                    onChange={e => { setInput(e.target.value); signalTyping(); }}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                    placeholder="Message..."
                    style={{
                      flex: 1, background: "#1A1A26", borderRadius: 24,
                      padding: "11px 16px", fontSize: 14,
                    }}
                  />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="ripple" style={{
                    background: input.trim() ? "linear-gradient(135deg, #A78BFA, #6366F1)" : "#1A1A26",
                    borderRadius: "50%", width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: "#fff", flexShrink: 0, transition: "background .2s",
                  }}>↑</button>
                </div>
              </div>
            )}

            {/* ── FRIENDS VIEW ── */}
            {view === "friends" && (
              <div style={{ padding: "16px 20px" }}>
                {/* Search bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                    Find People
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && doSearch()}
                      placeholder="Search by exact username..."
                      style={{
                        flex: 1, background: "#1A1A26", borderRadius: 14,
                        padding: "12px 16px", fontSize: 14, border: "1px solid #2A2A38",
                      }}
                    />
                    <button className="ripple" onClick={doSearch} disabled={searching} style={{
                      background: "linear-gradient(135deg, #A78BFA, #6366F1)",
                      color: "#fff", padding: "0 18px", borderRadius: 14,
                      fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      {searching ? "..." : "Search"}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#4B5563", marginTop: 6 }}>
                    💡 Tip: Share your username <span style={{ color: "#A78BFA", fontWeight: 700 }}>@{me.username}</span> with friends so they can find you
                  </div>
                </div>

                {/* Search results */}
                {searchResults.map(user => {
                  const isFriend = friends.some(f => f.username === user.username);
                  const sent = sentReqs.includes(user.username);
                  const isOnline = user.online && (Date.now() - user.lastSeen < 15000);
                  return (
                    <div key={user.username} style={{
                      background: "#141420", borderRadius: 16, padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 14, marginBottom: 12,
                      border: "1px solid #2A2A38",
                    }}>
                      <Avatar user={{ ...user, online: isOnline }} size={50} showStatus />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>@{user.username}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{user.bio}</div>
                      </div>
                      {isFriend ? (
                        <span style={{ color: "#4ADE80", fontSize: 12, fontWeight: 700 }}>✓ Friends</span>
                      ) : sent ? (
                        <span style={{ color: "#6B7280", fontSize: 12, fontWeight: 700 }}>Sent</span>
                      ) : (
                        <button className="ripple" onClick={() => sendFriendReq(user)} style={{
                          background: "linear-gradient(135deg, #A78BFA, #6366F1)",
                          color: "#fff", padding: "8px 16px", borderRadius: 20,
                          fontSize: 12, fontWeight: 700,
                        }}>+ Add</button>
                      )}
                    </div>
                  );
                })}

                {/* Friend Requests */}
                {requests.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                      Requests · {requests.length}
                    </div>
                    {requests.map(user => (
                      <div key={user.username} style={{
                        background: "#141420", borderRadius: 16, padding: "14px 16px",
                        display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
                        border: "1px solid #A78BFA33",
                      }}>
                        <Avatar user={user} size={46} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>@{user.username}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="ripple" onClick={() => acceptReq(user)} style={{
                            background: "linear-gradient(135deg, #A78BFA, #6366F1)",
                            color: "#fff", padding: "8px 14px", borderRadius: 20,
                            fontSize: 12, fontWeight: 700,
                          }}>Accept</button>
                          <button className="ripple" onClick={() => declineReq(user)} style={{
                            background: "#1E1E2A", color: "#9CA3AF",
                            padding: "8px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friends list */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                    Friends · {friends.length}
                  </div>
                  {friends.length === 0 && (
                    <div style={{ color: "#4B5563", textAlign: "center", padding: "30px 0", fontSize: 14 }}>
                      Search for friends above to get started!
                    </div>
                  )}
                  {friends.map(user => {
                    const isOnline = onlineUsers[user.username];
                    return (
                      <div key={user.username} className="chat-row" style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 0", borderBottom: "1px solid #151520",
                        cursor: "pointer", borderRadius: 10,
                      }} onClick={() => { setActiveChat({ ...user, online: isOnline }); setView("chats"); }}>
                        <Avatar user={{ ...user, online: isOnline }} size={46} showStatus />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>@{user.username}</div>
                          <div style={{ fontSize: 11, color: user.bio ? "#9CA3AF" : "#4B5563", marginTop: 2 }}>{user.bio || "No bio yet"}</div>
                        </div>
                        <div style={{ fontSize: 11, color: isOnline ? "#4ADE80" : "#4B5563", fontWeight: 600 }}>
                          {isOnline ? "● Online" : "Offline"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PROFILE VIEW ── */}
            {view === "profile" && (
              <div style={{ padding: "20px" }}>
                <div style={{
                  background: `linear-gradient(135deg, ${me.color}22, #141420)`,
                  borderRadius: 20, padding: 24, marginBottom: 20,
                  border: `1px solid ${me.color}33`, textAlign: "center",
                }}>
                  <Avatar user={me} size={80} ring />
                  {editingProfile ? (
                    <div style={{ marginTop: 16 }}>
                      <input value={profileDraft.name ?? me.name}
                        onChange={e => setProfileDraft(p => ({ ...p, name: e.target.value }))}
                        style={{ width: "100%", background: "#1A1A26", borderRadius: 12, padding: "10px 14px", fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 8, border: "1px solid #2A2A38" }}
                      />
                      <input value={profileDraft.bio ?? me.bio}
                        onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                        placeholder="Write a bio..."
                        style={{ width: "100%", background: "#1A1A26", borderRadius: 12, padding: "10px 14px", fontSize: 13, textAlign: "center", marginBottom: 16, border: "1px solid #2A2A38" }}
                      />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                        {COLORS.map(c => (
                          <div key={c} onClick={() => setProfileDraft(p => ({ ...p, color: c }))} style={{
                            width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                            border: (profileDraft.color ?? me.color) === c ? "3px solid #fff" : "3px solid transparent",
                            boxShadow: (profileDraft.color ?? me.color) === c ? `0 0 10px ${c}` : "none",
                          }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                        <button className="ripple" onClick={saveProfile} style={{
                          background: "linear-gradient(135deg, #A78BFA, #6366F1)", color: "#fff",
                          padding: "10px 24px", borderRadius: 24, fontSize: 13, fontWeight: 800,
                        }}>Save</button>
                        <button className="ripple" onClick={() => { setEditingProfile(false); setProfileDraft({}); }} style={{
                          background: "#1E1E2A", color: "#9CA3AF",
                          padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600,
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 800, fontSize: 20, marginTop: 14 }}>{me.name}</div>
                      <div style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>@{me.username}</div>
                      <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 8 }}>{me.bio}</div>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        marginTop: 10, background: "#1A1A26", padding: "5px 14px",
                        borderRadius: 20, fontSize: 12, color: "#4ADE80",
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
                        Active now
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
                        <button className="ripple" onClick={() => setEditingProfile(true)} style={{
                          background: "#1A1A26", color: "#A78BFA", padding: "9px 22px",
                          borderRadius: 24, fontSize: 13, fontWeight: 700,
                          border: `1px solid ${me.color}44`,
                        }}>✎ Edit Profile</button>
                        <button className="ripple" onClick={doLogout} style={{
                          background: "#1A1A26", color: "#EF4444", padding: "9px 18px",
                          borderRadius: 24, fontSize: 13, fontWeight: 700,
                          border: "1px solid #EF444433",
                        }}>Sign Out</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Friends", value: friends.length, icon: "👥" },
                    { label: "Requests", value: requests.length, icon: "📩" },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: "#141420", borderRadius: 16, padding: "18px 16px",
                      textAlign: "center", border: "1px solid #1E1E2A",
                    }}>
                      <div style={{ fontSize: 28 }}>{s.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 22, color: "#A78BFA", marginTop: 4 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#4B5563", fontWeight: 700, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#141420", borderRadius: 16, padding: 16, border: "1px solid #1E1E2A" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Your handle</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", color: "#A78BFA", fontSize: 18, fontWeight: 700 }}>@{me.username}</div>
                  <div style={{ fontSize: 12, color: "#4B5563", marginTop: 4 }}>Share this with friends so they can find and add you</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Nav — hidden in active chat */}
          {!(view === "chats" && activeChat) && (
            <div style={{
              position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "100%", maxWidth: 480,
              background: "#0D0D12", borderTop: "1px solid #1A1A26",
              display: "flex", justifyContent: "space-around", padding: "10px 0 16px",
              zIndex: 10,
            }}>
              {[
                { id: "chats", icon: "💬", label: "Chats" },
                { id: "friends", icon: "👥", label: "Friends", badge: requests.length },
                { id: "profile", icon: "👤", label: "Profile" },
              ].map(tab => (
                <button key={tab.id} className="tab-btn" onClick={() => setView(tab.id)} style={{
                  background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  color: view === tab.id ? "#A78BFA" : "#4B5563",
                  padding: "6px 24px", borderRadius: 16, transition: "all .15s", position: "relative",
                }}>
                  {tab.badge > 0 && (
                    <span style={{
                      position: "absolute", top: 0, right: 10,
                      background: "#EF4444", color: "#fff", borderRadius: 20,
                      fontSize: 9, fontWeight: 700, padding: "1px 5px",
                    }}>{tab.badge}</span>
                  )}
                  <span style={{ fontSize: 21 }}>{tab.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
