import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const COLORS = ["#FF6B6B","#4ECDC4","#FFE66D","#A8E6CF","#FF8B94","#F0ABFC","#93C5FD","#FCA5A5","#6EE7B7","#FDBA74"];
const EMOJIS = ["😀","😂","😍","🔥","👍","❤️","🎉","😊","🙌","💯","👀","✨","😭","🥳","🤔","💪","🫡","🤝","🌟","🥰","😎","🙏","💥","🎶","🍕"];

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

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [me, setMe] = useState(null);
  const [view, setView] = useState("chats");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentReqs, setSentReqs] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lastMsgs, setLastMsgs] = useState({});
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

  const fileRef = useRef();
  const chatEndRef = useRef();
  const typingTimerRef = useRef();
  const realtimeMsgRef = useRef(null);
  const realtimeTypingRef = useRef(null);
  const heartbeatRef = useRef(null);

  const notify = (msg, color = "#A78BFA") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  // Session restore
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) { setMe(profile); setScreen("home"); startHeartbeat(profile.id); }
      }
    });
  }, []);

  const doSignup = async () => {
    const { username, password, name, color } = authForm;
    if (!username.trim() || !password || !name.trim()) { setAuthErr("All fields required."); return; }
    if (username.length < 3) { setAuthErr("Username must be 3+ chars."); return; }
    if (password.length < 6) { setAuthErr("Password must be 6+ chars."); return; }
    setLoading(true); setAuthErr("");
    const { data: existing } = await supabase.from("profiles")
      .select("username").eq("username", username.toLowerCase().trim()).maybeSingle();
    if (existing) { setAuthErr("Username taken."); setLoading(false); return; }
    const fakeEmail = `${username.toLowerCase().trim()}@pulse.internal`;
    const { data, error } = await supabase.auth.signUp({ email: fakeEmail, password });
    if (error) { setAuthErr(error.message); setLoading(false); return; }
    const profile = {
      id: data.user.id, username: username.toLowerCase().trim(),
      name: name.trim(), bio: "Hey, I'm on Pulse! 👋", color,
      online: true, last_seen: new Date().toISOString(),
    };
    const { error: pe } = await supabase.from("profiles").insert(profile);
    if (pe) { setAuthErr(pe.message); setLoading(false); return; }
    setMe(profile); setScreen("home"); setLoading(false);
    notify("Welcome to Pulse! 🎉");
    startHeartbeat(profile.id);
  };

  const doLogin = async () => {
    const { username, password } = authForm;
    if (!username || !password) { setAuthErr("Fill in all fields."); return; }
    setLoading(true); setAuthErr("");
    const fakeEmail = `${username.toLowerCase().trim()}@pulse.internal`;
    const { data, error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    if (error) { setAuthErr("Wrong username or password."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    if (!profile) { setAuthErr("Profile not found."); setLoading(false); return; }
    await supabase.from("profiles").update({ online: true, last_seen: new Date().toISOString() }).eq("id", profile.id);
    setMe({ ...profile, online: true }); setScreen("home"); setLoading(false);
    notify(`Welcome back, ${profile.name}! 👋`);
    startHeartbeat(profile.id);
  };

  const doLogout = async () => {
    clearInterval(heartbeatRef.current);
    realtimeMsgRef.current?.unsubscribe();
    realtimeTypingRef.current?.unsubscribe();
    if (me) await supabase.from("profiles").update({ online: false, last_seen: new Date().toISOString() }).eq("id", me.id);
    await supabase.auth.signOut();
    setMe(null); setFriends([]); setRequests([]); setSentReqs([]);
    setMessages([]); setActiveChat(null); setLastMsgs({});
    setScreen("login");
    setAuthForm({ username: "", password: "", name: "", color: COLORS[0] });
  };

  const startHeartbeat = (userId) => {
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(async () => {
      await supabase.from("profiles").update({ online: true, last_seen: new Date().toISOString() }).eq("id", userId);
    }, 10000);
  };

  const loadSocial = useCallback(async () => {
    if (!me) return;
    const { data: fships } = await supabase.from("friendships")
      .select("user_a, user_b").or(`user_a.eq.${me.id},user_b.eq.${me.id}`);
    if (fships?.length) {
      const ids = fships.map(f => f.user_a === me.id ? f.user_b : f.user_a);
      const { data: fps } = await supabase.from("profiles").select("*").in("id", ids);
      setFriends(fps || []);
    } else setFriends([]);
    const { data: incoming } = await supabase.from("friend_requests")
      .select("from_id, profiles!friend_requests_from_id_fkey(*)").eq("to_id", me.id);
    setRequests(incoming?.map(r => r.profiles) || []);
    const { data: sent } = await supabase.from("friend_requests").select("to_id").eq("from_id", me.id);
    setSentReqs(sent?.map(s => s.to_id) || []);
  }, [me]);

  useEffect(() => {
    if (!me) return;
    loadSocial();
    const id = setInterval(loadSocial, 12000);
    return () => clearInterval(id);
  }, [me, loadSocial]);

  useEffect(() => {
    if (!me || !friends.length) return;
    const load = async () => {
      const lm = {};
      for (const f of friends) {
        const { data } = await supabase.from("messages").select("*")
          .or(`and(from_id.eq.${me.id},to_id.eq.${f.id}),and(from_id.eq.${f.id},to_id.eq.${me.id})`)
          .order("created_at", { ascending: false }).limit(1);
        lm[f.id] = data?.[0] || null;
      }
      setLastMsgs(lm);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [me, friends]);

  const loadMessages = useCallback(async () => {
    if (!me || !activeChat) return;
    const { data } = await supabase.from("messages").select("*")
      .or(`and(from_id.eq.${me.id},to_id.eq.${activeChat.id}),and(from_id.eq.${activeChat.id},to_id.eq.${me.id})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    const unseen = (data || []).filter(m => m.to_id === me.id && !m.seen);
    if (unseen.length) await supabase.from("messages").update({ seen: true }).in("id", unseen.map(m => m.id));
  }, [me, activeChat]);

  useEffect(() => {
    if (!me || !activeChat) return;
    loadMessages();
    realtimeMsgRef.current?.unsubscribe();
    realtimeMsgRef.current = supabase
      .channel(`chat:${[me.id, activeChat.id].sort().join("_")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `to_id=eq.${me.id}` }, () => loadMessages())
      .subscribe();
    realtimeTypingRef.current?.unsubscribe();
    realtimeTypingRef.current = supabase
      .channel(`typing:${activeChat.id}_to_${me.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "typing", filter: `from_id=eq.${activeChat.id}` }, (p) => {
        const age = Date.now() - new Date(p.new?.updated_at).getTime();
        setPeerTyping(age < 3000);
      }).subscribe();
    return () => { realtimeMsgRef.current?.unsubscribe(); realtimeTypingRef.current?.unsubscribe(); };
  }, [me, activeChat, loadMessages]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, peerTyping]);

  const signalTyping = async () => {
    if (!me || !activeChat) return;
    await supabase.from("typing").upsert({ from_id: me.id, to_id: activeChat.id, updated_at: new Date().toISOString() }, { onConflict: "from_id,to_id" });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(async () => {
      await supabase.from("typing").upsert({ from_id: me.id, to_id: activeChat.id, updated_at: new Date(0).toISOString() }, { onConflict: "from_id,to_id" });
    }, 2500);
  };

  const sendMessage = async (text, type = "text", extra = {}) => {
    if ((!text?.trim() && type === "text") || !activeChat) return;
    const { data, error } = await supabase.from("messages").insert({
      from_id: me.id, to_id: activeChat.id,
      text: type === "text" ? text.trim() : text,
      type, seen: false, ...extra,
    }).select().single();
    if (!error && data) setMessages(p => [...p, data]);
    setInput(""); setShowEmoji(false);
    await supabase.from("typing").upsert({ from_id: me.id, to_id: activeChat.id, updated_at: new Date(0).toISOString() }, { onConflict: "from_id,to_id" });
  };

  const sendFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await sendMessage(file.name, isImage ? "image" : "file", { data_url: ev.target.result, file_size: (file.size / 1024).toFixed(1) + " KB" });
      notify(isImage ? "Photo sent 📷" : "File sent 📎");
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const sendFriendReq = async (user) => {
    const { error } = await supabase.from("friend_requests").insert({ from_id: me.id, to_id: user.id });
    if (error) { notify("Could not send request.", "#EF4444"); return; }
    setSentReqs(p => [...p, user.id]);
    notify(`Friend request sent to ${user.name}!`);
  };

  const acceptReq = async (user) => {
    const [a, b] = [me.id, user.id].sort();
    await supabase.from("friendships").insert({ user_a: a, user_b: b });
    await supabase.from("friend_requests").delete().eq("from_id", user.id).eq("to_id", me.id);
    setRequests(p => p.filter(u => u.id !== user.id));
    setFriends(p => [...p, user]);
    notify(`${user.name} is now your friend! 🎉`);
  };

  const declineReq = async (user) => {
    await supabase.from("friend_requests").delete().eq("from_id", user.id).eq("to_id", me.id);
    setRequests(p => p.filter(u => u.id !== user.id));
    notify("Request declined.");
  };

  const doSearch = async () => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("profiles").select("*")
      .ilike("username", `%${searchQ.trim()}%`).neq("id", me.id).limit(10);
    setSearchResults(data || []); setSearching(false);
    if (!data?.length) notify("No users found.", "#F97316");
  };

  const saveProfile = async () => {
    const updated = { ...me, ...profileDraft };
    await supabase.from("profiles").update({ name: updated.name, bio: updated.bio, color: updated.color }).eq("id", me.id);
    setMe(updated); setEditingProfile(false); setProfileDraft({});
    notify("Profile updated! ✨");
  };

  const isOnline = (user) => user?.online && Date.now() - new Date(user.last_seen).getTime() < 20000;

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif", background: "#0D0D12", minHeight: "100vh", color: "#E2E8F0",
      maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800&family=DM+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2A2A38;border-radius:10px}
        input,textarea{outline:none;border:none;background:none;font-family:inherit;color:inherit}
        button{cursor:pointer;border:none;font-family:inherit}
        .ripple{transition:all .15s ease}.ripple:active{transform:scale(.97)}
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes popIn{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .msg-in{animation:popIn .2s ease}.screen-enter{animation:fadeUp .3s ease}
        .tab-btn:hover{background:#1A1A26!important}.chat-row:hover{background:#151520!important}
        input::placeholder{color:#4B5563}
      `}</style>

      {toast && (
        <div style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"#fff",padding:"10px 22px",borderRadius:28,zIndex:9999,fontWeight:700,fontSize:13,boxShadow:`0 4px 24px ${toast.color}66`,animation:"popIn .2s ease",whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* SPLASH */}
      {screen === "splash" && (
        <div className="screen-enter" style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32 }}>
          <div style={{ width:80,height:80,borderRadius:24,background:"linear-gradient(135deg, #A78BFA, #6366F1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,marginBottom:24,boxShadow:"0 0 60px #A78BFA55" }}>⚡</div>
          <div style={{ fontFamily:"'DM Mono', monospace",fontWeight:700,fontSize:36,letterSpacing:"-2px",background:"linear-gradient(135deg, #A78BFA, #6366F1, #EC4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>pulse</div>
          <div style={{ color:"#4B5563",fontSize:14,marginTop:8,marginBottom:48 }}>Real connections. Live.</div>
          <button className="ripple" onClick={() => setScreen("signup")} style={{ width:"100%",padding:15,borderRadius:18,background:"linear-gradient(135deg, #A78BFA, #6366F1)",color:"#fff",fontWeight:700,fontSize:16,marginBottom:12 }}>Create Account</button>
          <button className="ripple" onClick={() => setScreen("login")} style={{ width:"100%",padding:15,borderRadius:18,background:"#1A1A26",color:"#A78BFA",fontWeight:700,fontSize:16,border:"1px solid #2A2A38" }}>Sign In</button>
        </div>
      )}

      {/* SIGNUP */}
      {screen === "signup" && (
        <div className="screen-enter" style={{ flex:1,padding:"48px 28px 32px",display:"flex",flexDirection:"column",minHeight:"100vh",overflowY:"auto" }}>
          <button onClick={() => setScreen("splash")} style={{ background:"none",color:"#6B7280",fontSize:22,marginBottom:24,alignSelf:"flex-start" }}>←</button>
          <div style={{ fontFamily:"'DM Mono', monospace",fontWeight:700,fontSize:28,letterSpacing:"-1px",background:"linear-gradient(135deg, #A78BFA, #6366F1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6 }}>Join Pulse</div>
          <div style={{ color:"#4B5563",fontSize:14,marginBottom:32 }}>Create your account to get started.</div>
          {["name","username","password"].map(field => (
            <div key={field} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{field==="name"?"Display Name":field.charAt(0).toUpperCase()+field.slice(1)}</div>
              <input type={field==="password"?"password":"text"} value={authForm[field]}
                onChange={e => setAuthForm(p=>({...p,[field]:e.target.value}))}
                onKeyDown={e => e.key==="Enter" && doSignup()}
                placeholder={field==="name"?"Your name":field==="username"?"unique_handle":"••••••••"}
                style={{ width:"100%",background:"#1A1A26",borderRadius:14,padding:"13px 16px",fontSize:15,border:"1px solid #2A2A38" }}
              />
            </div>
          ))}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Avatar Color</div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {COLORS.map(c => (
                <div key={c} onClick={()=>setAuthForm(p=>({...p,color:c}))} style={{ width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:authForm.color===c?"3px solid #fff":"3px solid transparent",boxShadow:authForm.color===c?`0 0 12px ${c}`:"none",transition:"all .15s" }} />
              ))}
            </div>
          </div>
          {authErr && <div style={{ color:"#F87171",fontSize:13,marginBottom:14,fontWeight:600 }}>⚠ {authErr}</div>}
          <button className="ripple" onClick={doSignup} disabled={loading} style={{ width:"100%",padding:15,borderRadius:18,background:loading?"#2A2A38":"linear-gradient(135deg, #A78BFA, #6366F1)",color:"#fff",fontWeight:800,fontSize:15 }}>
            {loading?"Creating...":"Create Account →"}
          </button>
          <div style={{ textAlign:"center",marginTop:20,color:"#4B5563",fontSize:13 }}>
            Already have an account?{" "}<span onClick={()=>{setScreen("login");setAuthErr("");}} style={{ color:"#A78BFA",fontWeight:700,cursor:"pointer" }}>Sign In</span>
          </div>
        </div>
      )}

      {/* LOGIN */}
      {screen === "login" && (
        <div className="screen-enter" style={{ flex:1,padding:"48px 28px 32px",display:"flex",flexDirection:"column",minHeight:"100vh" }}>
          <button onClick={() => setScreen("splash")} style={{ background:"none",color:"#6B7280",fontSize:22,marginBottom:24,alignSelf:"flex-start" }}>←</button>
          <div style={{ fontFamily:"'DM Mono', monospace",fontWeight:700,fontSize:28,letterSpacing:"-1px",background:"linear-gradient(135deg, #A78BFA, #6366F1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6 }}>Welcome back</div>
          <div style={{ color:"#4B5563",fontSize:14,marginBottom:32 }}>Sign in to continue.</div>
          {["username","password"].map(field => (
            <div key={field} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{field.charAt(0).toUpperCase()+field.slice(1)}</div>
              <input type={field==="password"?"password":"text"} value={authForm[field]}
                onChange={e => setAuthForm(p=>({...p,[field]:e.target.value}))}
                onKeyDown={e => e.key==="Enter" && doLogin()}
                placeholder={field==="username"?"your_username":"••••••••"}
                style={{ width:"100%",background:"#1A1A26",borderRadius:14,padding:"13px 16px",fontSize:15,border:"1px solid #2A2A38" }}
              />
            </div>
          ))}
          {authErr && <div style={{ color:"#F87171",fontSize:13,marginBottom:14,fontWeight:600 }}>⚠ {authErr}</div>}
          <button className="ripple" onClick={doLogin} disabled={loading} style={{ width:"100%",padding:15,borderRadius:18,background:loading?"#2A2A38":"linear-gradient(135deg, #A78BFA, #6366F1)",color:"#fff",fontWeight:800,fontSize:15,marginTop:8 }}>
            {loading?"Signing in...":"Sign In →"}
          </button>
          <div style={{ textAlign:"center",marginTop:20,color:"#4B5563",fontSize:13 }}>
            New here?{" "}<span onClick={()=>{setScreen("signup");setAuthErr("");}} style={{ color:"#A78BFA",fontWeight:700,cursor:"pointer" }}>Create account</span>
          </div>
        </div>
      )}

      {/* HOME */}
      {screen === "home" && me && (
        <>
          <div style={{ padding:"14px 20px",borderBottom:"1px solid #1A1A26",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0D0D12",position:"sticky",top:0,zIndex:20 }}>
            {activeChat && view==="chats" ? (
              <button onClick={()=>{setActiveChat(null);setMessages([]);setShowEmoji(false);setPeerTyping(false);}} style={{ background:"#1A1A26",color:"#A78BFA",padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:700 }}>← Back</button>
            ) : (
              <div style={{ fontFamily:"'DM Mono', monospace",fontWeight:700,fontSize:22,letterSpacing:"-1px",background:"linear-gradient(135deg, #A78BFA, #6366F1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>pulse</div>
            )}
            {activeChat && view==="chats" ? (
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <Avatar user={{...activeChat,online:isOnline(activeChat)}} size={36} showStatus ring />
                <div>
                  <div style={{ fontWeight:700,fontSize:14 }}>{activeChat.name}</div>
                  <div style={{ fontSize:11,color:isOnline(activeChat)?"#4ADE80":"#6B7280" }}>{isOnline(activeChat)?"● Active now":"● Offline"}</div>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                {requests.length > 0 && <span style={{ background:"#EF4444",color:"#fff",borderRadius:20,fontSize:11,fontWeight:700,padding:"2px 8px" }}>{requests.length} req</span>}
                <Avatar user={me} size={32} />
              </div>
            )}
          </div>

          <div style={{ flex:1,overflowY:"auto",paddingBottom:activeChat?0:72 }}>

            {/* CHATS LIST */}
            {view==="chats" && !activeChat && (
              <div style={{ padding:"16px 20px 6px" }}>
                <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:14 }}>Messages</div>
                {friends.length===0 && (
                  <div style={{ textAlign:"center",color:"#4B5563",padding:"40px 0",fontSize:14 }}>
                    <div style={{ fontSize:42,marginBottom:12 }}>💬</div>Add friends to start chatting!
                  </div>
                )}
                {friends.map(user => {
                  const lm = lastMsgs[user.id];
                  const online = isOnline(user);
                  const unread = lm && !lm.seen && lm.from_id !== me.id;
                  const time = lm ? new Date(lm.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "";
                  return (
                    <div key={user.id} className="chat-row" onClick={()=>setActiveChat(user)} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #151520",cursor:"pointer",transition:"background .15s",borderRadius:12 }}>
                      <Avatar user={{...user,online}} size={50} showStatus />
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                          <div style={{ fontWeight:unread?800:600,fontSize:14 }}>{user.name}</div>
                          <div style={{ fontSize:11,color:"#4B5563" }}>{time}</div>
                        </div>
                        <div style={{ fontSize:13,color:unread?"#A78BFA":"#6B7280",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:unread?600:400 }}>
                          {lm?(lm.type==="image"?"📷 Photo":lm.type==="file"?`📎 ${lm.text}`:(lm.from_id===me.id?`You: ${lm.text}`:lm.text)):"Say hello! 👋"}
                        </div>
                      </div>
                      {unread && <div style={{ width:10,height:10,borderRadius:"50%",background:"#A78BFA",flexShrink:0 }} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CHAT WINDOW */}
            {view==="chats" && activeChat && (
              <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 120px)" }}>
                <div style={{ flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:8 }}>
                  {messages.length===0 && (
                    <div style={{ textAlign:"center",color:"#4B5563",marginTop:60,fontSize:14 }}>
                      <div style={{ fontSize:44,marginBottom:12 }}>👋</div>Say hello to {activeChat.name}!
                    </div>
                  )}
                  {messages.map((msg,i) => {
                    const isMe = msg.from_id===me.id;
                    const isLast = i===messages.length-1;
                    const time = new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
                    return (
                      <div key={msg.id} className="msg-in" style={{ display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:8 }}>
                        {!isMe && <Avatar user={activeChat} size={28} />}
                        <div style={{ maxWidth:"74%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start" }}>
                          <div style={{ background:isMe?"linear-gradient(135deg, #A78BFA, #6366F1)":"#1E1E2A",color:"#fff",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:msg.type==="image"?4:"10px 14px",fontSize:14,lineHeight:1.55 }}>
                            {msg.type==="image" && <img src={msg.data_url} alt="" style={{ maxWidth:220,maxHeight:240,borderRadius:14,display:"block" }} />}
                            {msg.type==="file" && (
                              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                                <span style={{ fontSize:24 }}>📎</span>
                                <div><div style={{ fontWeight:600,fontSize:13 }}>{msg.text}</div><div style={{ fontSize:11,opacity:.65 }}>{msg.file_size}</div></div>
                              </div>
                            )}
                            {msg.type==="text" && msg.text}
                          </div>
                          <div style={{ fontSize:10,color:"#4B5563",marginTop:4,display:"flex",alignItems:"center",gap:4 }}>
                            {time}
                            {isMe && isLast && <span style={{ color:msg.seen?"#A78BFA":"#4B5563",fontWeight:700 }}>{msg.seen?" ✓✓":" ✓"}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {peerTyping && (
                    <div style={{ display:"flex",alignItems:"flex-end",gap:8 }}>
                      <Avatar user={activeChat} size={28} /><TypingBubble />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                {showEmoji && (
                  <div style={{ background:"#141420",borderTop:"1px solid #1E1E2A",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:10 }}>
                    {EMOJIS.map(e => (
                      <span key={e} onClick={()=>setInput(p=>p+e)} style={{ fontSize:22,cursor:"pointer",transition:"transform .1s",display:"inline-block" }}
                        onMouseOver={ev=>ev.target.style.transform="scale(1.3)"} onMouseOut={ev=>ev.target.style.transform="scale(1)"}>{e}</span>
                    ))}
                  </div>
                )}
                <div style={{ padding:"10px 14px",borderTop:"1px solid #1A1A26",display:"flex",gap:8,alignItems:"center",background:"#0D0D12" }}>
                  <input type="file" ref={fileRef} onChange={sendFile} style={{ display:"none" }} accept="image/*,application/*" />
                  <button onClick={()=>fileRef.current.click()} style={{ background:"#1A1A26",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",color:"#A78BFA",fontSize:17,flexShrink:0 }}>📎</button>
                  <button onClick={()=>setShowEmoji(p=>!p)} style={{ background:showEmoji?"#2A1F44":"#1A1A26",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>😊</button>
                  <input value={input} onChange={e=>{setInput(e.target.value);signalTyping();}}
                    onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage(input)}
                    placeholder="Message..." style={{ flex:1,background:"#1A1A26",borderRadius:24,padding:"11px 16px",fontSize:14 }} />
                  <button onClick={()=>sendMessage(input)} disabled={!input.trim()} className="ripple" style={{ background:input.trim()?"linear-gradient(135deg, #A78BFA, #6366F1)":"#1A1A26",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",flexShrink:0,transition:"background .2s" }}>↑</button>
                </div>
              </div>
            )}

            {/* FRIENDS */}
            {view==="friends" && (
              <div style={{ padding:"16px 20px" }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>Find People</div>
                  <div style={{ display:"flex",gap:8 }}>
                    <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()}
                      placeholder="Search by username..." style={{ flex:1,background:"#1A1A26",borderRadius:14,padding:"12px 16px",fontSize:14,border:"1px solid #2A2A38" }} />
                    <button className="ripple" onClick={doSearch} disabled={searching} style={{ background:"linear-gradient(135deg, #A78BFA, #6366F1)",color:"#fff",padding:"0 18px",borderRadius:14,fontWeight:700,fontSize:14,flexShrink:0 }}>
                      {searching?"...":"Search"}
                    </button>
                  </div>
                  <div style={{ fontSize:11,color:"#4B5563",marginTop:6 }}>💡 Your handle: <span style={{ color:"#A78BFA",fontWeight:700 }}>@{me.username}</span></div>
                </div>
                {searchResults.map(user => {
                  const isFriend = friends.some(f=>f.id===user.id);
                  const sent = sentReqs.includes(user.id);
                  return (
                    <div key={user.id} style={{ background:"#141420",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:12,border:"1px solid #2A2A38" }}>
                      <Avatar user={{...user,online:isOnline(user)}} size={50} showStatus />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:14 }}>{user.name}</div>
                        <div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div>
                        <div style={{ fontSize:12,color:"#9CA3AF",marginTop:2 }}>{user.bio}</div>
                      </div>
                      {isFriend?<span style={{ color:"#4ADE80",fontSize:12,fontWeight:700 }}>✓ Friends</span>
                        :sent?<span style={{ color:"#6B7280",fontSize:12,fontWeight:700 }}>Sent</span>
                        :<button className="ripple" onClick={()=>sendFriendReq(user)} style={{ background:"linear-gradient(135deg, #A78BFA, #6366F1)",color:"#fff",padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700 }}>+ Add</button>}
                    </div>
                  );
                })}
                {requests.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Requests · {requests.length}</div>
                    {requests.map(user => (
                      <div key={user.id} style={{ background:"#141420",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:10,border:"1px solid #A78BFA33" }}>
                        <Avatar user={user} size={46} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:14 }}>{user.name}</div>
                          <div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div>
                        </div>
                        <div style={{ display:"flex",gap:8 }}>
                          <button className="ripple" onClick={()=>acceptReq(user)} style={{ background:"linear-gradient(135deg, #A78BFA, #6366F1)",color:"#fff",padding:"8px 14px",borderRadius:20,fontSize:12,fontWeight:700 }}>Accept</button>
                          <button className="ripple" onClick={()=>declineReq(user)} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"8px 12px",borderRadius:20,fontSize:12,fontWeight:600 }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Friends · {friends.length}</div>
                  {friends.length===0 && <div style={{ color:"#4B5563",textAlign:"center",padding:"30px 0",fontSize:14 }}>Search for friends above!</div>}
                  {friends.map(user => {
                    const online = isOnline(user);
                    return (
                      <div key={user.id} className="chat-row" style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #151520",cursor:"pointer",borderRadius:10 }}
                        onClick={()=>{setActiveChat(user);setView("chats");}}>
                        <Avatar user={{...user,online}} size={46} showStatus />
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600,fontSize:14 }}>{user.name}</div>
                          <div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div>
                          <div style={{ fontSize:11,color:"#9CA3AF",marginTop:2 }}>{user.bio||"No bio yet"}</div>
                        </div>
                        <div style={{ fontSize:11,color:online?"#4ADE80":"#4B5563",fontWeight:600 }}>{online?"● Online":"Offline"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PROFILE */}
            {view==="profile" && (
              <div style={{ padding:"20px" }}>
                <div style={{ background:`linear-gradient(135deg, ${me.color}22, #141420)`,borderRadius:20,padding:24,marginBottom:20,border:`1px solid ${me.color}33`,textAlign:"center" }}>
                  <Avatar user={me} size={80} ring />
                  {editingProfile ? (
                    <div style={{ marginTop:16 }}>
                      <input value={profileDraft.name??me.name} onChange={e=>setProfileDraft(p=>({...p,name:e.target.value}))}
                        style={{ width:"100%",background:"#1A1A26",borderRadius:12,padding:"10px 14px",fontSize:16,fontWeight:700,textAlign:"center",marginBottom:8,border:"1px solid #2A2A38" }} />
                      <input value={profileDraft.bio??me.bio} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))} placeholder="Write a bio..."
                        style={{ width:"100%",background:"#1A1A26",borderRadius:12,padding:"10px 14px",fontSize:13,textAlign:"center",marginBottom:16,border:"1px solid #2A2A38" }} />
                      <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:16 }}>
                        {COLORS.map(c => (
                          <div key={c} onClick={()=>setProfileDraft(p=>({...p,color:c}))} style={{ width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:(profileDraft.color??me.color)===c?"3px solid #fff":"3px solid transparent",boxShadow:(profileDraft.color??me.color)===c?`0 0 10px ${c}`:"none" }} />
                        ))}
                      </div>
                      <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
                        <button className="ripple" onClick={saveProfile} style={{ background:"linear-gradient(135deg, #A78BFA, #6366F1)",color:"#fff",padding:"10px 24px",borderRadius:24,fontSize:13,fontWeight:800 }}>Save</button>
                        <button className="ripple" onClick={()=>{setEditingProfile(false);setProfileDraft({});}} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"10px 20px",borderRadius:24,fontSize:13,fontWeight:600 }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight:800,fontSize:20,marginTop:14 }}>{me.name}</div>
                      <div style={{ color:"#6B7280",fontSize:13,marginTop:2 }}>@{me.username}</div>
                      <div style={{ color:"#9CA3AF",fontSize:13,marginTop:8 }}>{me.bio}</div>
                      <div style={{ display:"inline-flex",alignItems:"center",gap:6,marginTop:10,background:"#1A1A26",padding:"5px 14px",borderRadius:20,fontSize:12,color:"#4ADE80" }}>
                        <span style={{ width:7,height:7,borderRadius:"50%",background:"#4ADE80",display:"inline-block" }} />Active now
                      </div>
                      <div style={{ display:"flex",gap:10,marginTop:16,justifyContent:"center" }}>
                        <button className="ripple" onClick={()=>setEditingProfile(true)} style={{ background:"#1A1A26",color:"#A78BFA",padding:"9px 22px",borderRadius:24,fontSize:13,fontWeight:700,border:`1px solid ${me.color}44` }}>✎ Edit Profile</button>
                        <button className="ripple" onClick={doLogout} style={{ background:"#1A1A26",color:"#EF4444",padding:"9px 18px",borderRadius:24,fontSize:13,fontWeight:700,border:"1px solid #EF444433" }}>Sign Out</button>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
                  {[{label:"Friends",value:friends.length,icon:"👥"},{label:"Requests",value:requests.length,icon:"📩"}].map(s => (
                    <div key={s.label} style={{ background:"#141420",borderRadius:16,padding:"18px 16px",textAlign:"center",border:"1px solid #1E1E2A" }}>
                      <div style={{ fontSize:28 }}>{s.icon}</div>
                      <div style={{ fontWeight:800,fontSize:22,color:"#A78BFA",marginTop:4 }}>{s.value}</div>
                      <div style={{ fontSize:11,color:"#4B5563",fontWeight:700,marginTop:2,textTransform:"uppercase",letterSpacing:1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#141420",borderRadius:16,padding:16,border:"1px solid #1E1E2A" }}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>Your handle</div>
                  <div style={{ fontFamily:"'DM Mono', monospace",color:"#A78BFA",fontSize:18,fontWeight:700 }}>@{me.username}</div>
                  <div style={{ fontSize:12,color:"#4B5563",marginTop:4 }}>Share this with friends so they can find and add you</div>
                </div>
              </div>
            )}
          </div>

          {!(view==="chats" && activeChat) && (
            <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#0D0D12",borderTop:"1px solid #1A1A26",display:"flex",justifyContent:"space-around",padding:"10px 0 16px",zIndex:10 }}>
              {[{id:"chats",icon:"💬",label:"Chats"},{id:"friends",icon:"👥",label:"Friends",badge:requests.length},{id:"profile",icon:"👤",label:"Profile"}].map(tab => (
                <button key={tab.id} className="tab-btn" onClick={()=>setView(tab.id)} style={{ background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:view===tab.id?"#A78BFA":"#4B5563",padding:"6px 24px",borderRadius:16,transition:"all .15s",position:"relative" }}>
                  {tab.badge>0 && <span style={{ position:"absolute",top:0,right:10,background:"#EF4444",color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"1px 5px" }}>{tab.badge}</span>}
                  <span style={{ fontSize:21 }}>{tab.icon}</span>
                  <span style={{ fontSize:10,fontWeight:700,letterSpacing:.5 }}>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
