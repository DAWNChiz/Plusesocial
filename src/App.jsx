import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const COLORS = ["#FF6B6B","#4ECDC4","#FFE66D","#A8E6CF","#FF8B94","#F0ABFC","#93C5FD","#FCA5A5","#6EE7B7","#FDBA74"];
const EMOJIS = ["😀","😂","😍","🔥","👍","❤️","🎉","😊","🙌","💯","👀","✨","😭","🥳","🤔","💪","🫡","🤝","🌟","🥰","😎","🙏","💥","🎶","🍕"];
const REACT_EMOJIS = ["❤️","😂","😮","😢","😡","👍"];
const CHAT_BGS = [
  { id:"default", label:"Default", bg:"#0D0D12" },
  { id:"midnight", label:"Midnight", bg:"linear-gradient(160deg,#0D0D12,#1a0533)" },
  { id:"ocean", label:"Ocean", bg:"linear-gradient(160deg,#0a1628,#0d2847)" },
  { id:"forest", label:"Forest", bg:"linear-gradient(160deg,#0a1a0d,#0d2e14)" },
  { id:"sunset", label:"Sunset", bg:"linear-gradient(160deg,#1a0a0a,#2d1210)" },
  { id:"rose", label:"Rose", bg:"linear-gradient(160deg,#1a0d18,#2d1429)" },
  { id:"gold", label:"Gold", bg:"linear-gradient(160deg,#1a1500,#2d2200)" },
  { id:"slate", label:"Slate", bg:"linear-gradient(160deg,#0e1117,#1a2030)" },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────
const Icon = ({ d, size=22, color="currentColor", fill="none", strokeWidth=1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IcBack = ({size=22,color="#A78BFA"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IcAttach = ({size=22,color="#A78BFA"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
  </svg>
);
const IcEmoji = ({size=22,color="#9CA3AF"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
  </svg>
);
const IcSend = ({size=20,color="#fff"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill={color} stroke={color}/>
  </svg>
);
const IcReply = ({size=20,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
  </svg>
);
const IcEdit = ({size=20,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcCopy = ({size=20,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IcForward = ({size=20,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/>
  </svg>
);
const IcPin = ({size=20,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z"/>
  </svg>
);
const IcUnsend = ({size=20,color="#EF4444"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
  </svg>
);
const IcReport = ({size=20,color="#EF4444"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const IcImage = ({size=20,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IcSearch = ({size=18,color="#A78BFA"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcClose = ({size=18,color="#6B7280"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcCamera = ({size=16,color="#fff"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const IcMore = ({size=20,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
  </svg>
);
const IcSwipeReply = ({size=18,color="#A78BFA"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
  </svg>
);

// ── Chat info action icons (SVG) ───────────────────────────────────────────
const IcMessage = ({size=22,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IcMute = ({size=22,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64A9 9 0 0121 12M6.34 6.34A9 9 0 003 12c0 4.97 4.03 9 9 9a9 9 0 006.66-2.96"/>
    <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V6a3 3 0 00-5.94-.6"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IcUnmute = ({size=22,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 010 8M6 8a6 6 0 000 8M12 2v2M12 20v2"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcInfoSearch = ({size=22,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcDotsHoriz = ({size=22,color="#E2E8F0"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
  </svg>
);

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({ user, size=42, ring=false, showStatus=false, onClick }) => (
  <div style={{ position:"relative", flexShrink:0, cursor:onClick?"pointer":"default" }} onClick={onClick}>
    {user.photo_url ? (
      <img src={user.photo_url} alt={user.name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", boxShadow:ring?`0 0 0 2px #0D0D12,0 0 0 3.5px ${user.color}`:"none", display:"block" }} />
    ) : (
      <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${user.color}cc,${user.color})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:Math.max(10,size*0.31), color:"#fff", boxShadow:ring?`0 0 0 2px #0D0D12,0 0 0 3.5px ${user.color}`:"none", userSelect:"none" }}>
        {(user.name||"?").slice(0,2).toUpperCase()}
      </div>
    )}
    {showStatus && <span style={{ position:"absolute", bottom:1, right:1, width:Math.max(8,size*0.24), height:Math.max(8,size*0.24), borderRadius:"50%", background:user.online?"#4ADE80":"#4B5563", border:"2px solid #0D0D12" }} />}
  </div>
);

const TypingBubble = () => (
  <div style={{ display:"flex", alignItems:"center", gap:4, padding:"10px 14px", background:"#1E1E2A", borderRadius:"18px 18px 18px 4px", width:"fit-content" }}>
    {[0,1,2].map(i=><span key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#6B7280", display:"inline-block", animation:`typingBounce 1.2s ${i*0.2}s infinite ease-in-out` }} />)}
  </div>
);

// ── Last seen helper ───────────────────────────────────────────────────────
const getLastSeen = (user) => {
  if (!user?.last_seen) return "Offline";
  const diff = Math.floor((Date.now() - new Date(user.last_seen).getTime()) / 1000);
  if (diff < 20)  return "Active now";
  if (diff < 60)  return `Active ${diff}s ago`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `Active ${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `Active ${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return `Active ${d}d ago`;
};

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [me, setMe] = useState(null);
  const [view, setView] = useState("chats");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentReqs, setSentReqs] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatView, setChatView] = useState("messages");
  const [messages, setMessages] = useState([]);
  const [pinnedMsgs, setPinnedMsgs] = useState([]);
  const [lastMsgs, setLastMsgs] = useState({});
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [chatSearchQ, setChatSearchQ] = useState("");
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [toast, setToast] = useState(null);
  const [authForm, setAuthForm] = useState({ username:"", password:"", name:"", color:COLORS[0] });
  const [authErr, setAuthErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({});
  const [msgMenu, setMsgMenu] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [fullProfileUser, setFullProfileUser] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [restrictedUsers, setRestrictedUsers] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [chatBg, setChatBg] = useState("default");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [swipeReply, setSwipeReply] = useState(null);
  const [swipeX, setSwipeX] = useState(0);
  const [nickname, setNickname] = useState("");
  const [editNickname, setEditNickname] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Force re-render every minute so last-seen timestamps stay fresh
  const [, setTick] = useState(0);

  const fileRef = useRef();
  const profilePhotoRef = useRef();
  const chatEndRef = useRef();
  const typingTimerRef = useRef();
  const realtimeMsgRef = useRef(null);
  const realtimeTypingRef = useRef(null);
  const heartbeatRef = useRef(null);
  const longPressTimer = useRef(null);
  const swipeStartX = useRef(0);

  const currentBg = CHAT_BGS.find(b=>b.id===chatBg)?.bg || "#0D0D12";
  const notify = (msg, color="#A78BFA") => { setToast({msg,color}); setTimeout(()=>setToast(null),2800); };

  // Tick every 30 s so last-seen labels update without a full reload
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Session restore ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({data:{session}}) => {
      if (session?.user) {
        const {data:p} = await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if (p) { setMe(p); setScreen("home"); startHeartbeat(p.id); }
      }
    });
  }, []);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const doSignup = async () => {
    const {username,password,name,color} = authForm;
    if (!username.trim()||!password||!name.trim()) { setAuthErr("All fields required."); return; }
    if (username.length<3) { setAuthErr("Username must be 3+ chars."); return; }
    if (password.length<6) { setAuthErr("Password must be 6+ chars."); return; }
    setLoading(true); setAuthErr("");
    const {data:ex} = await supabase.from("profiles").select("username").eq("username",username.toLowerCase().trim()).maybeSingle();
    if (ex) { setAuthErr("Username taken."); setLoading(false); return; }
    const email = `${username.toLowerCase().trim()}@pulsesocial.app`;
    const {data,error} = await supabase.auth.signUp({email,password});
    if (error) { setAuthErr(error.message); setLoading(false); return; }
    const profile = { id:data.user.id, username:username.toLowerCase().trim(), name:name.trim(), bio:"Hey, I'm on Pulse! 👋", color, online:true, last_seen:new Date().toISOString(), photo_url:null };
    const {error:pe} = await supabase.from("profiles").insert(profile);
    if (pe) { setAuthErr(pe.message); setLoading(false); return; }
    setMe(profile); setScreen("home"); setLoading(false);
    notify("Welcome to Pulse! 🎉"); startHeartbeat(profile.id);
  };

  const doLogin = async () => {
    const {username,password} = authForm;
    if (!username||!password) { setAuthErr("Fill in all fields."); return; }
    setLoading(true); setAuthErr("");
    const email = `${username.toLowerCase().trim()}@pulsesocial.app`;
    const {data,error} = await supabase.auth.signInWithPassword({email,password});
    if (error) { setAuthErr("Wrong username or password."); setLoading(false); return; }
    const {data:p} = await supabase.from("profiles").select("*").eq("id",data.user.id).single();
    if (!p) { setAuthErr("Profile not found."); setLoading(false); return; }
    await supabase.from("profiles").update({online:true,last_seen:new Date().toISOString()}).eq("id",p.id);
    setMe({...p,online:true}); setScreen("home"); setLoading(false);
    notify(`Welcome back, ${p.name}! 👋`); startHeartbeat(p.id);
  };

  const doLogout = async () => {
    clearInterval(heartbeatRef.current);
    realtimeMsgRef.current?.unsubscribe(); realtimeTypingRef.current?.unsubscribe();
    if (me) await supabase.from("profiles").update({online:false,last_seen:new Date().toISOString()}).eq("id",me.id);
    await supabase.auth.signOut();
    setMe(null); setFriends([]); setRequests([]); setSentReqs([]);
    setMessages([]); setActiveChat(null); setLastMsgs({});
    setScreen("login"); setAuthForm({username:"",password:"",name:"",color:COLORS[0]});
  };

  const startHeartbeat = (uid) => {
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(async()=>{
      await supabase.from("profiles").update({online:true,last_seen:new Date().toISOString()}).eq("id",uid);
    },10000);
  };

  // ── Profile photo upload ──────────────────────────────────────────────────
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file||!me) return;
    if (!file.type.startsWith("image/")) { notify("Please select an image.","#EF4444"); return; }
    if (file.size > 5*1024*1024) { notify("Image must be under 5MB.","#EF4444"); return; }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const photo_url = ev.target.result;
      const {error} = await supabase.from("profiles").update({photo_url}).eq("id",me.id);
      if (error) notify("Failed to upload photo.","#EF4444");
      else { setMe(p=>({...p,photo_url})); notify("Profile photo updated! 📸"); }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
    e.target.value="";
  };

  // ── Social ────────────────────────────────────────────────────────────────
  const loadSocial = useCallback(async () => {
    if (!me) return;
    const {data:fs} = await supabase.from("friendships").select("user_a,user_b").or(`user_a.eq.${me.id},user_b.eq.${me.id}`);
    if (fs?.length) {
      const ids = fs.map(f=>f.user_a===me.id?f.user_b:f.user_a);
      const {data:fps} = await supabase.from("profiles").select("*").in("id",ids);
      setFriends(fps||[]);
    } else setFriends([]);
    const {data:inc} = await supabase.from("friend_requests").select("from_id,profiles!friend_requests_from_id_fkey(*)").eq("to_id",me.id);
    setRequests(inc?.map(r=>r.profiles)||[]);
    const {data:sent} = await supabase.from("friend_requests").select("to_id").eq("from_id",me.id);
    setSentReqs(sent?.map(s=>s.to_id)||[]);
  }, [me]);

  useEffect(() => { if (!me) return; loadSocial(); const id=setInterval(loadSocial,12000); return ()=>clearInterval(id); }, [me,loadSocial]);

  useEffect(() => {
    if (!me||!friends.length) return;
    const load = async () => {
      const lm={};
      for (const f of friends) {
        const {data} = await supabase.from("messages").select("*").or(`and(from_id.eq.${me.id},to_id.eq.${f.id}),and(from_id.eq.${f.id},to_id.eq.${me.id})`).order("created_at",{ascending:false}).limit(1);
        lm[f.id]=data?.[0]||null;
      }
      setLastMsgs(lm);
    };
    load(); const id=setInterval(load,5000); return ()=>clearInterval(id);
  }, [me,friends]);

  // ── Messages ──────────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!me||!activeChat) return;
    const {data} = await supabase.from("messages").select("*")
      .or(`and(from_id.eq.${me.id},to_id.eq.${activeChat.id}),and(from_id.eq.${activeChat.id},to_id.eq.${me.id})`)
      .order("created_at",{ascending:true});
    setMessages(data||[]);
    const unseen=(data||[]).filter(m=>m.to_id===me.id&&!m.seen);
    if (unseen.length) await supabase.from("messages").update({seen:true}).in("id",unseen.map(m=>m.id));
  }, [me,activeChat]);

  useEffect(() => {
    if (!me||!activeChat) return;
    loadMessages();
    realtimeMsgRef.current?.unsubscribe();
    realtimeMsgRef.current = supabase.channel(`msgs:${[me.id,activeChat.id].sort().join("_")}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`to_id=eq.${me.id}`},()=>loadMessages())
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"messages"},()=>loadMessages())
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"messages"},(p)=>{
        if (p.old?.id) setMessages(prev=>prev.filter(m=>m.id!==p.old.id));
      })
      .subscribe();
    realtimeTypingRef.current?.unsubscribe();
    realtimeTypingRef.current = supabase.channel(`typ:${activeChat.id}_${me.id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"typing",filter:`from_id=eq.${activeChat.id}`},(p)=>{
        setPeerTyping(Date.now()-new Date(p.new?.updated_at).getTime()<3000);
      }).subscribe();
    return ()=>{ realtimeMsgRef.current?.unsubscribe(); realtimeTypingRef.current?.unsubscribe(); };
  }, [me,activeChat,loadMessages]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,peerTyping]);

  const signalTyping = async () => {
    if (!me||!activeChat) return;
    await supabase.from("typing").upsert({from_id:me.id,to_id:activeChat.id,updated_at:new Date().toISOString()},{onConflict:"from_id,to_id"});
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(async()=>{
      await supabase.from("typing").upsert({from_id:me.id,to_id:activeChat.id,updated_at:new Date(0).toISOString()},{onConflict:"from_id,to_id"});
    },2500);
  };

  const sendMessage = async (text, type="text", extra={}) => {
    if ((!text?.trim()&&type==="text")||!activeChat) return;
    const msg = { from_id:me.id, to_id:activeChat.id, text:type==="text"?text.trim():text, type, seen:false, reactions:[], ...extra };
    if (replyTo) { msg.reply_to_id=replyTo.id; msg.reply_text=replyTo.type==="text"?replyTo.text:"📷 Photo"; msg.reply_from=replyTo.from_id===me.id?"You":activeChat.name; }
    const {data,error} = await supabase.from("messages").insert(msg).select().single();
    if (!error&&data) setMessages(p=>[...p,data]);
    setInput(""); setShowEmoji(false); setReplyTo(null);
    await supabase.from("typing").upsert({from_id:me.id,to_id:activeChat.id,updated_at:new Date(0).toISOString()},{onConflict:"from_id,to_id"});
  };

  const sendFile = async (e) => {
    const file=e.target.files[0]; if (!file) return;
    const isImage=file.type.startsWith("image/");
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      await sendMessage(file.name,isImage?"image":"file",{data_url:ev.target.result,file_size:(file.size/1024).toFixed(1)+" KB"});
      notify(isImage?"Photo sent 📷":"File sent 📎");
    };
    reader.readAsDataURL(file); e.target.value="";
  };

  const unsendMessage = async (msgId) => {
    setMessages(p=>p.filter(m=>m.id!==msgId));
    setMsgMenu(null);
    const {error} = await supabase.from("messages").delete().eq("id",msgId).eq("from_id",me.id);
    if (error) { notify("Could not unsend.","#EF4444"); loadMessages(); }
    else notify("Message unsent.");
  };

  const saveEditedMsg = async () => {
    if (!editingMsg?.text?.trim()) return;
    await supabase.from("messages").update({text:editingMsg.text,edited:true}).eq("id",editingMsg.id).eq("from_id",me.id);
    setMessages(p=>p.map(m=>m.id===editingMsg.id?{...m,text:editingMsg.text,edited:true}:m));
    setEditingMsg(null); notify("Message edited.");
  };

  const toggleReaction = async (msg, emoji) => {
    const cur = Array.isArray(msg.reactions)?msg.reactions:[];
    const exists = cur.find(r=>r.userId===me.id&&r.emoji===emoji);
    const updated = exists?cur.filter(r=>!(r.userId===me.id&&r.emoji===emoji)):[...cur,{emoji,userId:me.id,userName:me.name}];
    setMessages(p=>p.map(m=>m.id===msg.id?{...m,reactions:updated}:m));
    await supabase.from("messages").update({reactions:updated}).eq("id",msg.id);
    setMsgMenu(null);
  };

  const pinMessage = async (msg) => {
    setPinnedMsgs(p=>p.find(m=>m.id===msg.id)?p.filter(m=>m.id!==msg.id):[...p,msg]);
    setMsgMenu(null); notify(pinnedMsgs.find(m=>m.id===msg.id)?"Unpinned.":"Message pinned 📌");
  };

  const forwardMessage = (msg) => {
    setMsgMenu(null);
    setInput(msg.type==="text"?msg.text:""); notify("Message copied to input — edit & send!");
  };

  // ── Friend actions ────────────────────────────────────────────────────────
  const sendFriendReq = async (user) => {
    const {error} = await supabase.from("friend_requests").insert({from_id:me.id,to_id:user.id});
    if (error) { notify("Could not send request.","#EF4444"); return; }
    setSentReqs(p=>[...p,user.id]); notify(`Friend request sent to ${user.name}!`);
  };
  const acceptReq = async (user) => {
    const [a,b]=[me.id,user.id].sort();
    await supabase.from("friendships").insert({user_a:a,user_b:b});
    await supabase.from("friend_requests").delete().eq("from_id",user.id).eq("to_id",me.id);
    setRequests(p=>p.filter(u=>u.id!==user.id)); setFriends(p=>[...p,user]);
    notify(`${user.name} is now your friend! 🎉`);
  };
  const declineReq = async (user) => {
    await supabase.from("friend_requests").delete().eq("from_id",user.id).eq("to_id",me.id);
    setRequests(p=>p.filter(u=>u.id!==user.id)); notify("Request declined.");
  };
  const doSearch = async () => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const {data} = await supabase.from("profiles").select("*").ilike("username",`%${searchQ.trim()}%`).neq("id",me.id).limit(10);
    setSearchResults(data||[]); setSearching(false);
    if (!data?.length) notify("No users found.","#F97316");
  };
  const saveProfile = async () => {
    const updated={...me,...profileDraft};
    await supabase.from("profiles").update({name:updated.name,bio:updated.bio,color:updated.color}).eq("id",me.id);
    setMe(updated); setEditingProfile(false); setProfileDraft({}); notify("Profile updated! ✨");
  };
  const blockUser = (user) => { setBlockedUsers(p=>[...p,user.id]); setFullProfileUser(null); setActiveChat(null); setMessages([]); notify(`${user.name} blocked.`,"#EF4444"); };
  const restrictUser = (user) => { setRestrictedUsers(p=>p.includes(user.id)?p.filter(id=>id!==user.id):[...p,user.id]); notify(restrictedUsers.includes(user.id)?`${user.name} unrestricted.`:`${user.name} restricted.`); };
  const muteUser = (user) => { setMutedUsers(p=>p.includes(user.id)?p.filter(id=>id!==user.id):[...p,user.id]); notify(mutedUsers.includes(user.id)?`${user.name} unmuted.`:`${user.name} muted.`); };
  const removeFriend = async (user) => {
    const [a,b]=[me.id,user.id].sort();
    await supabase.from("friendships").delete().or(`and(user_a.eq.${a},user_b.eq.${b})`);
    setFriends(p=>p.filter(f=>f.id!==user.id)); setFullProfileUser(null); setActiveChat(null); setMessages([]); notify(`Removed ${user.name}.`);
  };
  const isOnline = (user) => user?.online && Date.now()-new Date(user.last_seen).getTime()<20000;

  // ── Swipe to reply ────────────────────────────────────────────────────────
  const handleTouchStart = (e, msg) => { swipeStartX.current=e.touches[0].clientX; setSwipeReply(msg); };
  const handleTouchMove = (e) => { const dx=e.touches[0].clientX-swipeStartX.current; if(dx>0&&dx<80) setSwipeX(dx); };
  const handleTouchEnd = (msg) => {
    if (swipeX>50) setReplyTo(msg);
    setSwipeX(0); setSwipeReply(null);
  };

  const css = `
    @import url('[fonts.googleapis.com](https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap)');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2A2A38;border-radius:10px}
    input,textarea{outline:none;border:none;background:none;font-family:inherit;color:inherit}
    button{cursor:pointer;border:none;font-family:inherit}
    .ripple{transition:all .15s ease}.ripple:active{transform:scale(.97)}
    @keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    @keyframes popIn{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .msg-in{animation:popIn .2s ease}.screen-enter{animation:fadeUp .3s ease}
    .tab-btn:hover{background:#1A1A26!important}.chat-row:hover{background:#151520!important}
    input::placeholder{color:#4B5563}
    /* ── suppress long-press highlight on message bubbles ── */
    .msg-bubble{
      -webkit-user-select:none;
      user-select:none;
      -webkit-touch-callout:none;
      -webkit-tap-highlight-color:transparent;
    }
  `;

  const filteredMessages = chatSearchQ
    ? messages.filter(m=>m.type==="text"&&m.text.toLowerCase().includes(chatSearchQ.toLowerCase()))
    : messages;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0D0D12", minHeight:"100vh", color:"#E2E8F0", maxWidth:480, margin:"0 auto", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      <style>{css}</style>

      {/* Hidden file inputs */}
      <input type="file" ref={fileRef} onChange={sendFile} style={{display:"none"}} accept="image/*,application/*" />
      <input type="file" ref={profilePhotoRef} onChange={handleProfilePhotoUpload} style={{display:"none"}} accept="image/*" />

      {/* Toast */}
      {toast && <div style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"#fff",padding:"10px 22px",borderRadius:28,zIndex:9999,fontWeight:700,fontSize:13,boxShadow:`0 4px 24px ${toast.color}66`,animation:"popIn .2s ease",whiteSpace:"nowrap" }}>{toast.msg}</div>}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",zIndex:9998,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20 }}>
          <img src={lightbox} alt="" style={{ maxWidth:"100%",maxHeight:"80vh",borderRadius:12,objectFit:"contain" }} />
          <div style={{ display:"flex",gap:16,marginTop:24 }}>
            <a href={lightbox} download="pulse-image.jpg" onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"12px 28px",borderRadius:24,fontSize:14,fontWeight:700,textDecoration:"none" }}>⬇️ Download</a>
            <button onClick={()=>setLightbox(null)} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"12px 24px",borderRadius:24,fontSize:14,fontWeight:600,border:"1px solid #2A2A38" }}>Close</button>
          </div>
        </div>
      )}

      {/* Full Profile Screen */}
      {fullProfileUser && (
        <div style={{ position:"fixed",inset:0,background:"#0D0D12",zIndex:300,overflowY:"auto",animation:"slideIn .25s ease" }}>
          <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #1A1A26",position:"sticky",top:0,background:"#0D0D12",zIndex:10 }}>
            <button onClick={()=>setFullProfileUser(null)} style={{ background:"#1A1A26",color:"#A78BFA",padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:700,border:"none" }}>← Back</button>
            <div style={{ fontWeight:700,fontSize:15 }}>{fullProfileUser.name}</div>
          </div>
          <div style={{ height:140,background:`linear-gradient(135deg,${fullProfileUser.color}88,${fullProfileUser.color}22)`,position:"relative" }}>
            <div style={{ position:"absolute",bottom:-44,left:24 }}><Avatar user={fullProfileUser} size={88} ring /></div>
          </div>
          <div style={{ padding:"56px 24px 32px" }}>
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16 }}>
              <div>
                <div style={{ fontWeight:800,fontSize:22 }}>{fullProfileUser.name}</div>
                <div style={{ color:"#6B7280",fontSize:14,marginTop:2 }}>@{fullProfileUser.username}</div>
                {nickname && <div style={{ color:"#A78BFA",fontSize:13,marginTop:2 }}>Nickname: {nickname}</div>}
              </div>
              <button onClick={()=>{setFullProfileUser(null);setActiveChat(fullProfileUser);setView("chats");setChatView("messages");}} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"10px 20px",borderRadius:24,fontSize:13,fontWeight:700,border:"none" }}>💬 Message</button>
            </div>
            {/* Last seen in full profile */}
            <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:isOnline(fullProfileUser)?"#0f2d1a":"#1a1a26",padding:"6px 14px",borderRadius:20,marginBottom:16,border:`1px solid ${isOnline(fullProfileUser)?"#4ADE8033":"#2A2A38"}` }}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:isOnline(fullProfileUser)?"#4ADE80":"#4B5563",display:"inline-block" }} />
              <span style={{ fontSize:13,color:isOnline(fullProfileUser)?"#4ADE80":"#6B7280",fontWeight:600 }}>
                {getLastSeen(fullProfileUser)}
              </span>
            </div>
            <div style={{ background:"#141420",borderRadius:16,padding:16,marginBottom:16,border:"1px solid #1E1E2A" }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>About</div>
              <div style={{ color:"#C4C4D4",fontSize:14,lineHeight:1.6 }}>{fullProfileUser.bio||"No bio yet."}</div>
            </div>
            <div style={{ background:"#141420",borderRadius:16,padding:16,marginBottom:16,border:"1px solid #1E1E2A" }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>Nickname</div>
              {editNickname ? (
                <div style={{ display:"flex",gap:8 }}>
                  <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Set a nickname..." style={{ flex:1,background:"#1A1A26",borderRadius:10,padding:"8px 12px",fontSize:14,border:"1px solid #2A2A38" }} />
                  <button onClick={()=>{setEditNickname(false);notify("Nickname saved!");}} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:700 }}>Save</button>
                </div>
              ) : (
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ color:nickname?"#E2E8F0":"#4B5563",fontSize:14 }}>{nickname||"No nickname set"}</span>
                  <button onClick={()=>setEditNickname(true)} style={{ background:"#1A1A26",color:"#A78BFA",padding:"6px 12px",borderRadius:10,fontSize:12,fontWeight:700,border:"1px solid #2A2A38" }}>Edit</button>
                </div>
              )}
            </div>
            <div style={{ background:"#141420",borderRadius:16,overflow:"hidden",border:"1px solid #1E1E2A" }}>
              {[
                {label:mutedUsers.includes(fullProfileUser.id)?"Unmute notifications":"Mute notifications",icon:mutedUsers.includes(fullProfileUser.id)?"🔔":"🔕",action:()=>muteUser(fullProfileUser),color:"#E2E8F0"},
                {label:restrictedUsers.includes(fullProfileUser.id)?"Remove restriction":"Restrict",icon:"🔇",action:()=>restrictUser(fullProfileUser),color:"#E2E8F0"},
                {label:"Remove friend",icon:"👋",action:()=>removeFriend(fullProfileUser),color:"#F97316"},
                {label:"Block",icon:"🚫",action:()=>blockUser(fullProfileUser),color:"#EF4444"},
                {label:"Report",icon:"🚩",action:()=>{notify("Reported.","#F97316");setFullProfileUser(null);},color:"#EF4444"},
              ].map((opt,i,arr)=>(
                <button key={opt.label} onClick={opt.action} style={{ width:"100%",padding:"14px 18px",background:"none",color:opt.color,fontSize:14,fontWeight:600,textAlign:"left",borderBottom:i<arr.length-1?"1px solid #1E1E2A":"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"none" }}>
                  <span style={{ fontSize:18 }}>{opt.icon}</span>{opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BG Picker */}
      {showBgPicker && (
        <div onClick={()=>setShowBgPicker(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:250,display:"flex",alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%",maxWidth:480,margin:"0 auto",background:"#0F0F1A",borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",border:"1px solid #1E1E2A" }}>
            <div style={{ width:40,height:4,background:"#2A2A38",borderRadius:4,margin:"0 auto 20px" }} />
            <div style={{ fontWeight:700,fontSize:16,marginBottom:16 }}>Chat Background</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
              {CHAT_BGS.map(bg=>(
                <div key={bg.id} onClick={()=>{setChatBg(bg.id);setShowBgPicker(false);}} style={{ borderRadius:14,overflow:"hidden",cursor:"pointer",border:chatBg===bg.id?"2px solid #A78BFA":"2px solid transparent" }}>
                  <div style={{ height:70,background:bg.bg }} />
                  <div style={{ background:"#141420",padding:"6px 4px",textAlign:"center",fontSize:10,fontWeight:700,color:chatBg===bg.id?"#A78BFA":"#6B7280",textTransform:"uppercase" }}>{bg.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SPLASH */}
      {screen==="splash" && (
        <div className="screen-enter" style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32 }}>
          <div style={{ width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#A78BFA,#6366F1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,marginBottom:24,boxShadow:"0 0 60px #A78BFA55" }}>⚡</div>
          <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:36,letterSpacing:"-2px",background:"linear-gradient(135deg,#A78BFA,#6366F1,#EC4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>pulse</div>
          <div style={{ color:"#4B5563",fontSize:14,marginTop:8,marginBottom:48 }}>Real connections. Live.</div>
          <button className="ripple" onClick={()=>setScreen("signup")} style={{ width:"100%",padding:15,borderRadius:18,background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",fontWeight:700,fontSize:16,marginBottom:12 }}>Create Account</button>
          <button className="ripple" onClick={()=>setScreen("login")} style={{ width:"100%",padding:15,borderRadius:18,background:"#1A1A26",color:"#A78BFA",fontWeight:700,fontSize:16,border:"1px solid #2A2A38" }}>Sign In</button>
        </div>
      )}

      {/* SIGNUP */}
      {screen==="signup" && (
        <div className="screen-enter" style={{ flex:1,padding:"48px 28px 32px",display:"flex",flexDirection:"column",minHeight:"100vh",overflowY:"auto" }}>
          <button onClick={()=>setScreen("splash")} style={{ background:"none",color:"#6B7280",fontSize:22,marginBottom:24,alignSelf:"flex-start" }}>←</button>
          <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:28,letterSpacing:"-1px",background:"linear-gradient(135deg,#A78BFA,#6366F1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6 }}>Join Pulse</div>
          <div style={{ color:"#4B5563",fontSize:14,marginBottom:32 }}>Create your account to get started.</div>
          {["name","username","password"].map(field=>(
            <div key={field} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{field==="name"?"Display Name":field.charAt(0).toUpperCase()+field.slice(1)}</div>
              <input type={field==="password"?"password":"text"} value={authForm[field]} onChange={e=>setAuthForm(p=>({...p,[field]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doSignup()} placeholder={field==="name"?"Your name":field==="username"?"unique_handle":"••••••••"} style={{ width:"100%",background:"#1A1A26",borderRadius:14,padding:"13px 16px",fontSize:15,border:"1px solid #2A2A38" }} />
            </div>
          ))}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Avatar Color</div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {COLORS.map(c=><div key={c} onClick={()=>setAuthForm(p=>({...p,color:c}))} style={{ width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:authForm.color===c?"3px solid #fff":"3px solid transparent",boxShadow:authForm.color===c?`0 0 12px ${c}`:"none",transition:"all .15s" }} />)}
            </div>
          </div>
          {authErr && <div style={{ color:"#F87171",fontSize:13,marginBottom:14,fontWeight:600 }}>⚠ {authErr}</div>}
          <button className="ripple" onClick={doSignup} disabled={loading} style={{ width:"100%",padding:15,borderRadius:18,background:loading?"#2A2A38":"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",fontWeight:800,fontSize:15 }}>{loading?"Creating...":"Create Account →"}</button>
          <div style={{ textAlign:"center",marginTop:20,color:"#4B5563",fontSize:13 }}>Already have an account?{" "}<span onClick={()=>{setScreen("login");setAuthErr("");}} style={{ color:"#A78BFA",fontWeight:700,cursor:"pointer" }}>Sign In</span></div>
        </div>
      )}

      {/* LOGIN */}
      {screen==="login" && (
        <div className="screen-enter" style={{ flex:1,padding:"48px 28px 32px",display:"flex",flexDirection:"column",minHeight:"100vh" }}>
          <button onClick={()=>setScreen("splash")} style={{ background:"none",color:"#6B7280",fontSize:22,marginBottom:24,alignSelf:"flex-start" }}>←</button>
          <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:28,letterSpacing:"-1px",background:"linear-gradient(135deg,#A78BFA,#6366F1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6 }}>Welcome back</div>
          <div style={{ color:"#4B5563",fontSize:14,marginBottom:32 }}>Sign in to continue.</div>
          {["username","password"].map(field=>(
            <div key={field} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{field.charAt(0).toUpperCase()+field.slice(1)}</div>
              <input type={field==="password"?"password":"text"} value={authForm[field]} onChange={e=>setAuthForm(p=>({...p,[field]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder={field==="username"?"your_username":"••••••••"} style={{ width:"100%",background:"#1A1A26",borderRadius:14,padding:"13px 16px",fontSize:15,border:"1px solid #2A2A38" }} />
            </div>
          ))}
          {authErr && <div style={{ color:"#F87171",fontSize:13,marginBottom:14,fontWeight:600 }}>⚠ {authErr}</div>}
          <button className="ripple" onClick={doLogin} disabled={loading} style={{ width:"100%",padding:15,borderRadius:18,background:loading?"#2A2A38":"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",fontWeight:800,fontSize:15,marginTop:8 }}>{loading?"Signing in...":"Sign In →"}</button>
          <div style={{ textAlign:"center",marginTop:20,color:"#4B5563",fontSize:13 }}>New here?{" "}<span onClick={()=>{setScreen("signup");setAuthErr("");}} style={{ color:"#A78BFA",fontWeight:700,cursor:"pointer" }}>Create account</span></div>
        </div>
      )}

      {/* HOME */}
      {screen==="home" && me && (
        <>
          {/* ── Top Bar (sticky) ── */}
          <div style={{ padding:"14px 20px",borderBottom:"1px solid #1A1A26",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0D0D12",position:"sticky",top:0,zIndex:20,flexShrink:0 }}>
            {activeChat && view==="chats" ? (
              <button onClick={()=>{setActiveChat(null);setMessages([]);setShowEmoji(false);setPeerTyping(false);setChatView("messages");setChatSearchOpen(false);setChatSearchQ("");}} style={{ background:"none",border:"none",padding:"6px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10 }}><IcBack size={24} color="#A78BFA"/></button>
            ) : (
              <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:22,letterSpacing:"-1px",background:"linear-gradient(135deg,#A78BFA,#6366F1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>pulse</div>
            )}
            {activeChat && view==="chats" ? (
              <div style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",flex:1,marginLeft:12 }} onClick={()=>setChatView(v=>v==="messages"?"info":"messages")}>
                <Avatar user={{...activeChat,online:isOnline(activeChat)}} size={36} showStatus ring />
                <div>
                  <div style={{ fontWeight:700,fontSize:14 }}>{nickname||activeChat.name}</div>
                  {/* ── Last seen label in chat header ── */}
                  <div style={{ fontSize:11,color:isOnline(activeChat)?"#4ADE80":"#6B7280" }}>
                    {isOnline(activeChat) ? "● Active now" : `● ${getLastSeen(activeChat)}`}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                {requests.length>0 && <span style={{ background:"#EF4444",color:"#fff",borderRadius:20,fontSize:11,fontWeight:700,padding:"2px 8px" }}>{requests.length} req</span>}
                <Avatar user={me} size={32} />
              </div>
            )}
          </div>

          {/* Chat search bar */}
          {activeChat && chatSearchOpen && (
            <div style={{ padding:"8px 16px",borderBottom:"1px solid #1A1A26",background:"#0D0D12",flexShrink:0 }}>
              <input value={chatSearchQ} onChange={e=>setChatSearchQ(e.target.value)} placeholder="Search messages..." style={{ width:"100%",background:"#1A1A26",borderRadius:24,padding:"9px 16px",fontSize:14,border:"1px solid #2A2A38" }} autoFocus />
            </div>
          )}

          {/* ── CHAT MESSAGES VIEW — fixed layout, only list scrolls ── */}
          {view==="chats" && activeChat && chatView==="messages" ? (
            <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0,background:currentBg }} onClick={()=>setMsgMenu(null)}>

              {/* Pinned banner */}
              {pinnedMsgs.length>0 && (
                <div style={{ padding:"8px 16px",background:"#141420",borderBottom:"1px solid #1E1E2A",display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                  <span>📌</span>
                  <span style={{ fontSize:13,color:"#C4C4D4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{pinnedMsgs[pinnedMsgs.length-1]?.text}</span>
                </div>
              )}

              {/* Scrollable message list */}
              <div style={{ flex:1,overflowY:"auto",padding:"12px 12px 8px",display:"flex",flexDirection:"column",gap:2 }}>
                {filteredMessages.length===0&&!chatSearchQ && (
                  <div style={{ textAlign:"center",color:"#4B5563",marginTop:60,fontSize:14 }}>
                    <div style={{ fontSize:44,marginBottom:12 }}>👋</div>Say hello to {activeChat.name}!
                  </div>
                )}
                {chatSearchQ&&filteredMessages.length===0 && (
                  <div style={{ textAlign:"center",color:"#4B5563",marginTop:40,fontSize:14 }}>No messages found.</div>
                )}
                {filteredMessages.map((msg,i)=>{
                  const isMe=msg.from_id===me.id;
                  const isLast=i===filteredMessages.length-1;
                  const isEditing=editingMsg?.id===msg.id;
                  const time=new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
                  const msgReactions=Array.isArray(msg.reactions)?msg.reactions:[];
                  const isSwiping=swipeReply?.id===msg.id;
                  const nextMsg=filteredMessages[i+1];
                  const prevMsg=filteredMessages[i-1];
                  const isLastInGroup=!nextMsg||nextMsg.from_id!==msg.from_id;
                  const isFirstInGroup=!prevMsg||prevMsg.from_id!==msg.from_id;
                  return (
                    <div key={msg.id} className="msg-in"
                      style={{ display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:6,marginBottom:isLastInGroup?6:1,transform:isSwiping?`translateX(${swipeX}px)`:"none",transition:isSwiping?"none":"transform .2s ease" }}
                      onTouchStart={e=>handleTouchStart(e,msg)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={()=>handleTouchEnd(msg)}>

                      {!isMe && <div style={{ width:32,flexShrink:0 }}>{isLastInGroup&&<Avatar user={activeChat} size={30} />}</div>}

                      <div style={{ maxWidth:"78%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start" }}>
                        {msg.reply_to_id && (
                          <div style={{ fontSize:11,color:"#6B7280",fontWeight:600,marginBottom:3,textAlign:isMe?"right":"left" }}>
                            {isMe?"You replied":"Replied to you"}
                          </div>
                        )}
                        {msg.reply_to_id && (
                          <div style={{ background:"rgba(255,255,255,0.07)",borderRadius:14,padding:"7px 12px",marginBottom:3,fontSize:13,color:"#9CA3AF",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",border:"1px solid rgba(255,255,255,0.08)" }}>
                            {msg.reply_text}
                          </div>
                        )}
                        {/* Bubble — class msg-bubble suppresses long-press highlight */}
                        <div
                          className="msg-bubble"
                          onContextMenu={e=>{e.preventDefault();setMsgMenu({msg});}}
                          onTouchStart={e=>{
                            swipeStartX.current=e.touches[0].clientX;
                            longPressTimer.current=setTimeout(()=>setMsgMenu({msg}),500);
                          }}
                          onTouchMove={e=>{clearTimeout(longPressTimer.current);handleTouchMove(e);}}
                          onTouchEnd={()=>{clearTimeout(longPressTimer.current);handleTouchEnd(msg);}}
                          style={{
                            background:isMe?"linear-gradient(135deg,#9333EA,#7C3AED)":"#1C1C28",
                            color:"#fff",
                            borderRadius:isMe
                              ?(isFirstInGroup?"20px 20px 6px 20px":"20px 6px 6px 20px")
                              :(isFirstInGroup?"20px 20px 20px 6px":"6px 20px 20px 6px"),
                            padding:msg.type==="image"?4:"11px 15px",
                            fontSize:15,lineHeight:1.55,cursor:"pointer",wordBreak:"break-word",
                          }}>
                          {msg.type==="image"&&<img src={msg.data_url} alt="" onClick={()=>setLightbox(msg.data_url)} style={{ maxWidth:220,maxHeight:240,borderRadius:14,display:"block",cursor:"pointer" }} />}
                          {msg.type==="file"&&(
                            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                              <span style={{ fontSize:24 }}>📎</span>
                              <div><div style={{ fontWeight:600,fontSize:13 }}>{msg.text}</div><div style={{ fontSize:11,opacity:.65 }}>{msg.file_size}</div></div>
                            </div>
                          )}
                          {msg.type==="text"&&(isEditing?(
                            <div onClick={e=>e.stopPropagation()}>
                              <input value={editingMsg.text} onChange={e=>setEditingMsg(p=>({...p,text:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")saveEditedMsg();if(e.key==="Escape")setEditingMsg(null);}} autoFocus style={{ background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"4px 8px",color:"#fff",fontSize:14,width:"100%",outline:"none" }} />
                              <div style={{ display:"flex",gap:6,marginTop:6 }}>
                                <button onClick={saveEditedMsg} style={{ background:"rgba(255,255,255,0.2)",color:"#fff",border:"none",borderRadius:8,padding:"3px 10px",fontSize:12,cursor:"pointer",fontWeight:700 }}>Save</button>
                                <button onClick={()=>setEditingMsg(null)} style={{ background:"transparent",color:"rgba(255,255,255,0.6)",border:"none",fontSize:12,cursor:"pointer" }}>Cancel</button>
                              </div>
                            </div>
                          ):msg.text)}
                        </div>
                        {msgReactions.length>0&&(
                          <div style={{ display:"flex",gap:3,marginTop:4,flexWrap:"wrap" }}>
                            {Object.entries(msgReactions.reduce((a,r)=>{a[r.emoji]=(a[r.emoji]||0)+1;return a;},{})).map(([emoji,count])=>(
                              <span key={emoji} onClick={()=>toggleReaction(msg,emoji)} style={{ background:"#1E1E2A",border:"1px solid #2A2A38",borderRadius:20,padding:"2px 8px",fontSize:12,cursor:"pointer" }}>{emoji} {count}</span>
                            ))}
                          </div>
                        )}
                        {isLastInGroup&&(
                          <div style={{ fontSize:10,color:"#4B5563",marginTop:3,display:"flex",alignItems:"center",gap:4 }}>
                            {time}
                            {msg.edited&&<span style={{ color:"#6B7280" }}>· edited</span>}
                            {isMe&&isLast&&<span style={{ color:msg.seen?"#A78BFA":"#4B5563",fontWeight:700 }}>{msg.seen?" ✓✓":" ✓"}</span>}
                          </div>
                        )}
                      </div>
                      {isSwiping&&swipeX>20&&<div style={{ opacity:swipeX/60 }}><IcSwipeReply size={20}/></div>}
                    </div>
                  );
                })}
                {peerTyping&&<div style={{ display:"flex",alignItems:"flex-end",gap:8 }}><Avatar user={activeChat} size={26} /><TypingBubble /></div>}
                <div ref={chatEndRef} />
              </div>

              {/* Context menu */}
              {msgMenu&&(
                <div onClick={()=>setMsgMenu(null)} style={{ position:"fixed",inset:0,zIndex:100 }}>
                  <div onClick={e=>e.stopPropagation()} style={{ position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#1A1A26",borderRadius:20,overflow:"hidden",width:250,boxShadow:"0 8px 40px #00000088",border:"1px solid #2A2A38",zIndex:101 }}>
                    <div style={{ display:"flex",justifyContent:"space-around",padding:"12px 16px",borderBottom:"1px solid #2A2A38" }}>
                      {REACT_EMOJIS.map(e=><span key={e} onClick={()=>toggleReaction(msgMenu.msg,e)} style={{ fontSize:24,cursor:"pointer" }}>{e}</span>)}
                    </div>
                    {[
                      {label:"Reply",Icon:IcReply,action:()=>{setReplyTo(msgMenu.msg);setMsgMenu(null);}},
                      ...(msgMenu.msg.from_id===me.id&&msgMenu.msg.type==="text"?[{label:"Edit",Icon:IcEdit,action:()=>{setEditingMsg({id:msgMenu.msg.id,text:msgMenu.msg.text});setMsgMenu(null);}}]:[]),
                      {label:"Copy",Icon:IcCopy,action:()=>{navigator.clipboard?.writeText(msgMenu.msg.text||"");notify("Copied!");setMsgMenu(null);}},
                      {label:"Forward",Icon:IcForward,action:()=>forwardMessage(msgMenu.msg)},
                      {label:pinnedMsgs.find(m=>m.id===msgMenu.msg.id)?"Unpin":"Pin",Icon:IcPin,action:()=>pinMessage(msgMenu.msg)},
                      ...(msgMenu.msg.type==="image"?[{label:"View photo",Icon:IcImage,color:"#E2E8F0",action:()=>{setLightbox(msgMenu.msg.data_url);setMsgMenu(null);}}]:[]),
                      ...(msgMenu.msg.from_id===me.id?[{label:"Unsend",Icon:IcUnsend,color:"#EF4444",action:()=>unsendMessage(msgMenu.msg.id)}]:[{label:"Report",Icon:IcReport,color:"#EF4444",action:()=>{notify("Reported.","#F97316");setMsgMenu(null);}}]),
                    ].map((opt,i,arr)=>(
                      <button key={opt.label} onClick={opt.action} style={{ width:"100%",padding:"13px 20px",background:"none",color:opt.color||"#E2E8F0",fontSize:14,fontWeight:600,textAlign:"left",borderBottom:i<arr.length-1?"1px solid #2A2A38":"none",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"none" }}>
                        <opt.Icon size={20} color={opt.color||"#E2E8F0"}/>{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Emoji picker */}
              {showEmoji&&(
                <div style={{ background:"#141420",borderTop:"1px solid #1E1E2A",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:10,flexShrink:0 }}>
                  {EMOJIS.map(e=><span key={e} onClick={()=>setInput(p=>p+e)} style={{ fontSize:22,cursor:"pointer" }}>{e}</span>)}
                </div>
              )}

              {/* Reply preview */}
              {replyTo&&(
                <div style={{ padding:"8px 16px",background:"#141420",borderTop:"1px solid #1E1E2A",display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                  <div style={{ flex:1,borderLeft:"3px solid #A78BFA",paddingLeft:10 }}>
                    <div style={{ fontSize:12,color:"#A78BFA",fontWeight:700 }}>Replying to {replyTo.from_id===me.id?"yourself":activeChat.name}</div>
                    <div style={{ fontSize:13,color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{replyTo.type==="text"?replyTo.text:"📷 Photo"}</div>
                  </div>
                  <button onClick={()=>setReplyTo(null)} style={{ background:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"center",padding:4 }}><IcClose size={18} color="#6B7280"/></button>
                </div>
              )}

              {/* ── Input bar (sticky footer) ── */}
              <div style={{ padding:"10px 12px",borderTop:"1px solid #1A1A26",display:"flex",gap:6,alignItems:"center",background:"#0D0D12",flexShrink:0 }}>
                <button onClick={()=>fileRef.current.click()} style={{ background:"#1A1A26",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><IcAttach size={20}/></button>
                <button onClick={()=>setShowEmoji(p=>!p)} style={{ background:showEmoji?"#2A1F44":"#1A1A26",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><IcEmoji size={20} color={showEmoji?"#A78BFA":"#9CA3AF"}/></button>
                <input value={input} onChange={e=>{setInput(e.target.value);signalTyping();}} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage(input)} placeholder="Message..." style={{ flex:1,background:"#1A1A26",borderRadius:24,padding:"11px 16px",fontSize:14 }} />
                <button onClick={()=>sendMessage(input)} disabled={!input.trim()} className="ripple" style={{ background:input.trim()?"linear-gradient(135deg,#A78BFA,#6366F1)":"#1A1A26",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><IcSend size={18}/></button>
              </div>
            </div>

          ) : (
            /* ── All non-chat-message views scroll normally ── */
            <div style={{ flex:1,overflowY:"auto",paddingBottom:view==="chats"&&activeChat?0:72 }}>

              {/* ── CHAT INFO VIEW ── */}
              {view==="chats" && activeChat && chatView==="info" && (
                <div style={{ padding:0 }}>
                  <div style={{ height:120,background:`linear-gradient(135deg,${activeChat.color}66,${activeChat.color}22)`,display:"flex",alignItems:"flex-end",padding:"0 20px 16px" }}>
                    <Avatar user={{...activeChat,online:isOnline(activeChat)}} size={72} showStatus ring />
                    <div style={{ marginLeft:16 }}>
                      <div style={{ fontWeight:800,fontSize:20 }}>{nickname||activeChat.name}</div>
                      <div style={{ color:"#6B7280",fontSize:13 }}>@{activeChat.username}</div>
                    </div>
                  </div>
                  {/* Action buttons with SVG icons */}
                  <div style={{ display:"flex",justifyContent:"space-around",padding:"20px 16px",borderBottom:"1px solid #1A1A26" }}>
                    {[
                      {
                        IconComp: IcMessage,
                        label:"Message",
                        action:()=>setChatView("messages"),
                      },
                      {
                        IconComp: mutedUsers.includes(activeChat.id) ? IcUnmute : IcMute,
                        label: mutedUsers.includes(activeChat.id) ? "Unmute" : "Mute",
                        action:()=>muteUser(activeChat),
                      },
                      {
                        IconComp: IcInfoSearch,
                        label:"Search",
                        action:()=>{setChatView("messages");setChatSearchOpen(true);},
                      },
                      {
                        IconComp: IcDotsHoriz,
                        label:"More",
                        action:()=>setFullProfileUser(activeChat),
                      },
                    ].map(a=>(
                      <button key={a.label} onClick={a.action} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"none",color:"#E2E8F0",cursor:"pointer",border:"none" }}>
                        <div style={{ width:48,height:48,borderRadius:"50%",background:"#1A1A26",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #2A2A38" }}>
                          <a.IconComp size={20} color="#A78BFA" />
                        </div>
                        <span style={{ fontSize:11,color:"#6B7280",fontWeight:600 }}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ margin:"12px 16px",background:"#141420",borderRadius:16,overflow:"hidden",border:"1px solid #1E1E2A" }}>
                    {[
                      {icon:"🎨",label:"Chat theme",sub:CHAT_BGS.find(b=>b.id===chatBg)?.label||"Default",action:()=>setShowBgPicker(true)},
                      {icon:"📌",label:"Pinned messages",sub:`${pinnedMsgs.length} pinned`,action:()=>{}},
                      {icon:"🖼️",label:"Media",sub:`${messages.filter(m=>m.type==="image").length} photos`,action:()=>{}},
                      {icon:"🏷️",label:"Nicknames",sub:nickname||"None set",action:()=>setFullProfileUser(activeChat)},
                      {icon:"🔇",label:mutedUsers.includes(activeChat.id)?"Unmute notifications":"Mute notifications",sub:"",action:()=>muteUser(activeChat)},
                      {icon:"🚫",label:"Block",sub:"",action:()=>blockUser(activeChat),red:true},
                      {icon:"🚩",label:"Report",sub:"",action:()=>notify("Reported.","#F97316"),red:true},
                    ].map((opt,i,arr)=>(
                      <button key={opt.label} onClick={opt.action} style={{ width:"100%",padding:"14px 18px",background:"none",color:opt.red?"#EF4444":"#E2E8F0",fontSize:14,fontWeight:600,textAlign:"left",borderBottom:i<arr.length-1?"1px solid #1E1E2A":"none",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"none" }}>
                        <span style={{ fontSize:20,width:28 }}>{opt.icon}</span>
                        <div style={{ flex:1 }}><div>{opt.label}</div>{opt.sub&&<div style={{ fontSize:12,color:"#4B5563",fontWeight:400,marginTop:1 }}>{opt.sub}</div>}</div>
                        <span style={{ color:"#4B5563",fontSize:14 }}>›</span>
                      </button>
                    ))}
                  </div>
                  {messages.filter(m=>m.type==="image").length > 0 && (
                    <div style={{ margin:"0 16px 20px" }}>
                      <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Media</div>
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3,borderRadius:12,overflow:"hidden" }}>
                        {messages.filter(m=>m.type==="image").slice(-9).map(m=>(
                          <img key={m.id} src={m.data_url} alt="" onClick={()=>setLightbox(m.data_url)} style={{ width:"100%",aspectRatio:"1",objectFit:"cover",cursor:"pointer" }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {pinnedMsgs.length > 0 && (
                    <div style={{ margin:"0 16px 20px" }}>
                      <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Pinned Messages</div>
                      {pinnedMsgs.map(m=>(
                        <div key={m.id} style={{ background:"#141420",borderRadius:12,padding:"12px 14px",marginBottom:8,border:"1px solid #2A2A38",display:"flex",alignItems:"center",gap:10 }}>
                          <span style={{ fontSize:18 }}>📌</span>
                          <div style={{ flex:1,fontSize:13,color:"#C4C4D4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.text}</div>
                          <button onClick={()=>pinMessage(m)} style={{ background:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"center",padding:2 }}><IcClose size={14} color="#4B5563"/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── CHATS LIST ── */}
              {view==="chats" && !activeChat && (
                <div style={{ padding:"16px 20px 6px" }}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:14 }}>Messages</div>
                  {friends.length===0 && <div style={{ textAlign:"center",color:"#4B5563",padding:"40px 0",fontSize:14 }}><div style={{ fontSize:42,marginBottom:12 }}>💬</div>Add friends to start chatting!</div>}
                  {friends.map(user=>{
                    const lm=lastMsgs[user.id]; const online=isOnline(user); const unread=lm&&!lm.seen&&lm.from_id!==me.id;
                    const time=lm?new Date(lm.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
                    if (blockedUsers.includes(user.id)) return null;
                    return (
                      <div key={user.id} className="chat-row" onClick={()=>{setActiveChat(user);setChatView("messages");}} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #151520",cursor:"pointer",borderRadius:12 }}>
                        <Avatar user={{...user,online}} size={50} showStatus />
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                            <div style={{ fontWeight:unread?800:600,fontSize:14 }}>{user.name}</div>
                            <div style={{ fontSize:11,color:"#4B5563" }}>{time}</div>
                          </div>
                          <div style={{ fontSize:13,color:unread?"#A78BFA":"#6B7280",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:unread?600:400 }}>
                            {mutedUsers.includes(user.id)&&<span style={{ fontSize:11 }}>🔕 </span>}
                            {lm?(lm.type==="image"?"📷 Photo":lm.type==="file"?`📎 ${lm.text}`:(lm.from_id===me.id?`You: ${lm.text}`:lm.text)):"Say hello! 👋"}
                          </div>
                        </div>
                        {unread&&<div style={{ width:10,height:10,borderRadius:"50%",background:"#A78BFA",flexShrink:0 }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── FRIENDS ── */}
              {view==="friends" && (
                <div style={{ padding:"16px 20px" }}>
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>Find People</div>
                    <div style={{ display:"flex",gap:8 }}>
                      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Search by username..." style={{ flex:1,background:"#1A1A26",borderRadius:14,padding:"12px 16px",fontSize:14,border:"1px solid #2A2A38" }} />
                      <button className="ripple" onClick={doSearch} disabled={searching} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"0 18px",borderRadius:14,fontWeight:700,fontSize:14,flexShrink:0 }}>{searching?"...":"Search"}</button>
                    </div>
                    <div style={{ fontSize:11,color:"#4B5563",marginTop:6 }}>💡 Your handle: <span style={{ color:"#A78BFA",fontWeight:700 }}>@{me.username}</span></div>
                  </div>
                  {searchResults.map(user=>{
                    const isFriend=friends.some(f=>f.id===user.id); const sent=sentReqs.includes(user.id);
                    return (
                      <div key={user.id} style={{ background:"#141420",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:12,border:"1px solid #2A2A38" }}>
                        <Avatar user={{...user,online:isOnline(user)}} size={50} showStatus />
                        <div style={{ flex:1 }}><div style={{ fontWeight:700,fontSize:14 }}>{user.name}</div><div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div><div style={{ fontSize:12,color:"#9CA3AF",marginTop:2 }}>{user.bio}</div></div>
                        {isFriend?<span style={{ color:"#4ADE80",fontSize:12,fontWeight:700 }}>✓ Friends</span>:sent?<span style={{ color:"#6B7280",fontSize:12,fontWeight:700 }}>Sent</span>:<button className="ripple" onClick={()=>sendFriendReq(user)} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700 }}>+ Add</button>}
                      </div>
                    );
                  })}
                  {requests.length>0&&(
                    <div style={{ marginBottom:20 }}>
                      <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Requests · {requests.length}</div>
                      {requests.map(user=>(
                        <div key={user.id} style={{ background:"#141420",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:10,border:"1px solid #A78BFA33" }}>
                          <Avatar user={user} size={46} />
                          <div style={{ flex:1 }}><div style={{ fontWeight:700,fontSize:14 }}>{user.name}</div><div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div></div>
                          <div style={{ display:"flex",gap:8 }}>
                            <button className="ripple" onClick={()=>acceptReq(user)} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"8px 14px",borderRadius:20,fontSize:12,fontWeight:700 }}>Accept</button>
                            <button className="ripple" onClick={()=>declineReq(user)} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"8px 12px",borderRadius:20,fontSize:12,fontWeight:600 }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Friends · {friends.length}</div>
                    {friends.length===0&&<div style={{ color:"#4B5563",textAlign:"center",padding:"30px 0",fontSize:14 }}>Search for friends above!</div>}
                    {friends.map(user=>{
                      const online=isOnline(user);
                      return (
                        <div key={user.id} className="chat-row" style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #151520",cursor:"pointer",borderRadius:10 }} onClick={()=>{setActiveChat(user);setView("chats");setChatView("messages");}}>
                          <Avatar user={{...user,online}} size={46} showStatus />
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600,fontSize:14 }}>{user.name}</div>
                            <div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div>
                            {/* Last seen on friend list */}
                            <div style={{ fontSize:11,color:online?"#4ADE80":"#6B7280",marginTop:2 }}>
                              {getLastSeen(user)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── PROFILE ── */}
              {view==="profile" && (
                <div style={{ padding:"20px" }}>
                  <div style={{ background:`linear-gradient(135deg,${me.color}22,#141420)`,borderRadius:20,padding:24,marginBottom:20,border:`1px solid ${me.color}33`,textAlign:"center" }}>
                    <div style={{ position:"relative",display:"inline-block" }}>
                      <Avatar user={me} size={88} ring />
                      <button onClick={()=>profilePhotoRef.current.click()} disabled={uploadingPhoto} style={{ position:"absolute",bottom:0,right:0,width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#A78BFA,#6366F1)",border:"2px solid #0D0D12",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px #00000066" }}>
                        {uploadingPhoto ? <div style={{width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/> : <IcCamera size={14}/>}
                      </button>
                    </div>
                    {editingProfile?(
                      <div style={{ marginTop:16 }}>
                        <input value={profileDraft.name??me.name} onChange={e=>setProfileDraft(p=>({...p,name:e.target.value}))} style={{ width:"100%",background:"#1A1A26",borderRadius:12,padding:"10px 14px",fontSize:16,fontWeight:700,textAlign:"center",marginBottom:8,border:"1px solid #2A2A38" }} />
                        <input value={profileDraft.bio??me.bio} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))} placeholder="Write a bio..." style={{ width:"100%",background:"#1A1A26",borderRadius:12,padding:"10px 14px",fontSize:13,textAlign:"center",marginBottom:16,border:"1px solid #2A2A38" }} />
                        <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:16 }}>
                          {COLORS.map(c=><div key={c} onClick={()=>setProfileDraft(p=>({...p,color:c}))} style={{ width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:(profileDraft.color??me.color)===c?"3px solid #fff":"3px solid transparent",boxShadow:(profileDraft.color??me.color)===c?`0 0 10px ${c}`:"none" }} />)}
                        </div>
                        <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
                          <button className="ripple" onClick={saveProfile} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"10px 24px",borderRadius:24,fontSize:13,fontWeight:800 }}>Save</button>
                          <button className="ripple" onClick={()=>{setEditingProfile(false);setProfileDraft({});}} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"10px 20px",borderRadius:24,fontSize:13,fontWeight:600 }}>Cancel</button>
                        </div>
                      </div>
                    ):(
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
                    {[{label:"Friends",value:friends.length,icon:"👥"},{label:"Requests",value:requests.length,icon:"📩"}].map(s=>(
                      <div key={s.label} style={{ background:"#141420",borderRadius:16,padding:"18px 16px",textAlign:"center",border:"1px solid #1E1E2A" }}>
                        <div style={{ fontSize:28 }}>{s.icon}</div>
                        <div style={{ fontWeight:800,fontSize:22,color:"#A78BFA",marginTop:4 }}>{s.value}</div>
                        <div style={{ fontSize:11,color:"#4B5563",fontWeight:700,marginTop:2,textTransform:"uppercase",letterSpacing:1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#141420",borderRadius:16,padding:16,border:"1px solid #1E1E2A" }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>Your handle</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",color:"#A78BFA",fontSize:18,fontWeight:700 }}>@{me.username}</div>
                    <div style={{ fontSize:12,color:"#4B5563",marginTop:4 }}>Share this with friends so they can find you</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Nav */}
          {!(view==="chats"&&activeChat) && (
            <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#0D0D12",borderTop:"1px solid #1A1A26",display:"flex",justifyContent:"space-around",padding:"10px 0 16px",zIndex:10 }}>
              {[{id:"chats",icon:"💬",label:"Chats"},{id:"friends",icon:"👥",label:"Friends",badge:requests.length},{id:"profile",icon:"👤",label:"Profile"}].map(tab=>(
                <button key={tab.id} className="tab-btn" onClick={()=>setView(tab.id)} style={{ background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:view===tab.id?"#A78BFA":"#4B5563",padding:"6px 24px",borderRadius:16,transition:"all .15s",position:"relative" }}>
                  {tab.badge>0&&<span style={{ position:"absolute",top:0,right:10,background:"#EF4444",color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"1px 5px" }}>{tab.badge}</span>}
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
