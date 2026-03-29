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

const IcBack = ({size=22,color="#A78BFA"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>);
const IcAttach = ({size=22,color="#A78BFA"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>);
const IcEmoji = ({size=22,color="#9CA3AF"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>);
const IcSend = ({size=20,color="#fff"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill={color} stroke={color}/></svg>);
const IcReply = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>);
const IcEdit = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IcCopy = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>);
const IcForward = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/></svg>);
const IcUnsend = ({size=20,color="#EF4444"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>);
const IcImage = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const IcClose = ({size=18,color="#6B7280"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcCamera = ({size=16,color="#fff"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const IcSwipeReply = ({size=18,color="#A78BFA"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>);
const IcMessage = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>);
const IcMute = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 0121 12M6.34 6.34A9 9 0 003 12c0 4.97 4.03 9 9 9a9 9 0 006.66-2.96"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V6a3 3 0 00-5.94-.6"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const IcUnmute = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 010 8M6 8a6 6 0 000 8M12 2v2M12 20v2"/><circle cx="12" cy="12" r="3"/></svg>);
const IcInfoSearch = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IcDotsHoriz = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>);
const IcDownload = ({size=20,color="#fff"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const IcBlock = ({size=22,color="#EF4444"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>);
const IcUserRemove = ({size=22,color="#F97316"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>);
const IcRestrict = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IcFlag = ({size=22,color="#EF4444"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>);
const IcBell = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>);
const IcBellOff = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const IcPalette = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>);
const IcPushPin = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z"/></svg>);
const IcMedia = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const IcNickname = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="17" y1="11" x2="22" y2="11"/><line x1="19.5" y1="8.5" x2="19.5" y2="13.5"/></svg>);
const IcChevronRight = ({size=16,color="#4B5563"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const IcChat = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>);
const IcFriends = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>);
const IcUser = ({size=22,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IcCheck = ({size=16,color="#A78BFA"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IcDoubleCheck = ({size=16,color="#A78BFA"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 11 7 8 4"/><polyline points="23 7 11 13 7 9"/></svg>);
const IcFile = ({size=24,color="#A78BFA"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>);
const IcPlusCircle = ({size=22,color="#A78BFA"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>);
const IcPhone = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.93 19.79 19.79 0 01.14 1.3 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.18v2.74z"/></svg>);
const IcVideoCall = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>);
const IcMic = ({size=20,color="#E2E8F0"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>);
const IcMicOff = ({size=20,color="#EF4444"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2M19 10v2a7 7 0 01-.09 1.11M12 19v4M8 23h8"/></svg>);
const IcPhoneOff = ({size=24,color="#EF4444"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07M7.42 7.42A19.5 19.5 0 003.07 9.93 19.79 19.79 0 01.14 1.3a2 2 0 011.97-1.3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11l-.27.27"/><line x1="23" y1="1" x2="1" y2="23"/></svg>);
const IcStar = ({size=20,color="#FBBF24",fill="none"}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

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

const getLastSeen = (user) => {
  if (!user?.last_seen) return "Offline";
  const diff = Math.floor((Date.now() - new Date(user.last_seen).getTime()) / 1000);
  if (diff < 20)  return "Active now";
  if (diff < 60)  return `Active ${diff}s ago`;
  if (diff < 3600) return `Active ${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `Active ${Math.floor(diff/3600)}h ago`;
  return `Active ${Math.floor(diff/86400)}d ago`;
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
  const [msgsLoaded, setMsgsLoaded] = useState(false);
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
  const [menuPos, setMenuPos] = useState({x:0,y:0});
  const [chatRowMenuPos, setChatRowMenuPos] = useState({top:0,left:0});
  const [swipeX, setSwipeX] = useState(0);
  const [nickname, setNickname] = useState("");
  const [editNickname, setEditNickname] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [, setTick] = useState(0);
  const [avatarOverlay, setAvatarOverlay] = useState(null);
  const [pinnedChats, setPinnedChats] = useState([]);
  const chatRowLongPress = useRef(null);
  const [chatListSearch, setChatListSearch] = useState("");
  const [chatRowMenu, setChatRowMenu] = useState(null);
  const [deletedChats, setDeletedChats] = useState([]);
  const [markedRead, setMarkedRead] = useState([]);
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);
  const [activeCall, setActiveCall] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  const fileRef = useRef();
  const profilePhotoRef = useRef();
  const chatEndRef = useRef();
  const textareaRef = useRef(); // ── NEW: ref to reset textarea height
  const typingTimerRef = useRef();
  const realtimeMsgRef = useRef(null);
  const realtimeTypingRef = useRef(null);
  const heartbeatRef = useRef(null);
  const longPressTimer = useRef(null);
  const swipeStartX = useRef(0);
  const unsentIds = useRef(new Set());

  const currentBg = CHAT_BGS.find(b=>b.id===chatBg)?.bg || "#0D0D12";
  const notify = (msg, color="#A78BFA") => { setToast({msg,color}); setTimeout(()=>setToast(null),2800); };

  useEffect(() => {
    const id = setInterval(() => setTick(t=>t+1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({data:{session}}) => {
      if (session?.user) {
        const {data:p} = await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if (p) { setMe(p); setScreen("home"); startHeartbeat(p.id); }
      }
    });
  }, []);

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
    const profile = { id:data.user.id, username:username.toLowerCase().trim(), name:name.trim(), bio:"Hey, I'm on Pulse!", color, online:true, last_seen:new Date().toISOString(), photo_url:null };
    const {error:pe} = await supabase.from("profiles").insert(profile);
    if (pe) { setAuthErr(pe.message); setLoading(false); return; }
    setMe(profile); setScreen("home"); setLoading(false);
    notify("Welcome to Pulse!"); startHeartbeat(profile.id);
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
    notify(`Welcome back, ${p.name}!`); startHeartbeat(p.id);
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
      else { setMe(p=>({...p,photo_url})); notify("Profile photo updated!"); }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file); e.target.value="";
  };

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
        // Fetch last message + unread count together
        const {data:msgs} = await supabase.from("messages").select("*")
          .or(`and(from_id.eq.${me.id},to_id.eq.${f.id}),and(from_id.eq.${f.id},to_id.eq.${me.id})`)
          .order("created_at",{ascending:false}).limit(20);
        if (msgs?.length) {
          // Filter out any locally unsent messages
          const visible = msgs.filter(m=>!unsentIds.current.has(m.id));
          const last = visible[0]||null;
          const unreadCount = visible.filter(m=>m.from_id===f.id&&!m.seen).length;
          lm[f.id] = last ? {...last, unreadCount} : null;
        } else {
          lm[f.id] = null;
        }
      }
      setLastMsgs(lm);
    };
    load(); const id=setInterval(load,5000); return ()=>clearInterval(id);
  }, [me,friends]);

  const loadMessages = useCallback(async () => {
    if (!me||!activeChat) return;
    const {data} = await supabase.from("messages").select("*")
      .or(`and(from_id.eq.${me.id},to_id.eq.${activeChat.id}),and(from_id.eq.${activeChat.id},to_id.eq.${me.id})`)
      .order("created_at",{ascending:true});
    const filtered = (data||[]).filter(m => !unsentIds.current.has(m.id));
    setMessages(filtered);
    setMsgsLoaded(true);
    const unseen = filtered.filter(m=>m.to_id===me.id&&!m.seen);
    if (unseen.length) await supabase.from("messages").update({seen:true}).in("id",unseen.map(m=>m.id));
  }, [me,activeChat]);

  useEffect(() => {
    if (!me||!activeChat) return;
    setMsgsLoaded(false);
    setMessages([]);
    // Do NOT clear unsentIds here — that would allow deleted msgs to reappear on re-fetch
    loadMessages();
    realtimeMsgRef.current?.unsubscribe();
    realtimeMsgRef.current = supabase.channel(`msgs:${[me.id,activeChat.id].sort().join("_")}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},(p)=>{
        if (!p.new?.id) return;
        if (unsentIds.current.has(p.new.id)) return;
        const isOurs=(p.new.from_id===me.id&&p.new.to_id===activeChat.id)||(p.new.from_id===activeChat.id&&p.new.to_id===me.id);
        if (!isOurs) return;
        setMessages(prev=>{
          if (prev.find(m=>m.id===p.new.id)) return prev;
          return [...prev, p.new];
        });
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"messages"},(p)=>{
        if (p.new?.id && unsentIds.current.has(p.new.id)) return;
        setMessages(prev=>prev.map(m=>m.id===p.new?.id?{...m,...p.new}:m));
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"messages"},(p)=>{
        if (p.old?.id) {
          unsentIds.current.add(p.old.id);
          setMessages(prev=>prev.filter(m=>m.id!==p.old.id));
          // Also clear from lastMsgs preview so recipient doesn't see deleted msg
          setLastMsgs(prev=>{
            const updated={...prev};
            const peerId=p.old.from_id===me.id?p.old.to_id:p.old.from_id;
            if (updated[peerId]?.id===p.old.id) {
              updated[peerId]=null; // will refresh on next poll
            }
            return updated;
          });
        }
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

  // ── FIX: reset textarea height after sending ──────────────────────────────
  const resetTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const sendMessage = async (text, type="text", extra={}) => {
    if ((!text?.trim()&&type==="text")||!activeChat) return;
    const msg = { from_id:me.id, to_id:activeChat.id, text:type==="text"?text.trim():text, type, seen:false, reactions:[], ...extra };
    if (replyTo) { msg.reply_to_id=replyTo.id; msg.reply_text=replyTo.type==="text"?replyTo.text:"Photo"; msg.reply_from=replyTo.from_id===me.id?"You":activeChat.name; }
    const {data,error} = await supabase.from("messages").insert(msg).select().single();
    if (!error&&data) setMessages(p=>[...p,data]);
    setInput("");
    resetTextarea(); // ── FIX: shrink textarea back to 1 row
    setShowEmoji(false);
    setReplyTo(null);
    await supabase.from("typing").upsert({from_id:me.id,to_id:activeChat.id,updated_at:new Date(0).toISOString()},{onConflict:"from_id,to_id"});
  };

  const sendFile = async (e) => {
    const file=e.target.files[0]; if (!file) return;
    const isImage=file.type.startsWith("image/");
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      await sendMessage(file.name,isImage?"image":"file",{data_url:ev.target.result,file_size:(file.size/1024).toFixed(1)+" KB"});
      notify(isImage?"Photo sent":"File sent");
    };
    reader.readAsDataURL(file); e.target.value="";
  };

  const unsendMessage = async (msgId) => {
    // Add to unsent set FIRST so any re-fetch filters it out
    unsentIds.current.add(msgId);
    setMessages(p=>p.filter(m=>m.id!==msgId));
    setMsgMenu(null);
    // Use from_id filter so RLS allows it (policy: sender can only delete their own)
    const { error } = await supabase.from("messages").delete().eq("id",msgId).eq("from_id",me.id);
    if (error) {
      // Delete failed — remove from unsent set and restore message
      unsentIds.current.delete(msgId);
      notify("Could not unsend message.","#EF4444");
      loadMessages(); // re-sync
    } else {
      notify("Message unsent.");
    }
  };

  const saveEditedMsg = async () => {
    if (!editingMsg?.text?.trim()) return;
    await supabase.from("messages").update({text:editingMsg.text,edited:true}).eq("id",editingMsg.id).eq("from_id",me.id);
    setMessages(p=>p.map(m=>m.id===editingMsg.id?{...m,text:editingMsg.text,edited:true}:m));
    setEditingMsg(null);
  };

  const toggleReaction = async (msg, emoji) => {
    const cur = Array.isArray(msg.reactions)?msg.reactions:[];
    const exists = cur.find(r=>r.userId===me.id&&r.emoji===emoji);
    const updated = exists?cur.filter(r=>!(r.userId===me.id&&r.emoji===emoji)):[...cur,{emoji,userId:me.id,userName:me.name}];
    setMessages(p=>p.map(m=>m.id===msg.id?{...m,reactions:updated}:m));
    await supabase.from("messages").update({reactions:updated}).eq("id",msg.id);
    setMsgMenu(null);
  };

  const pinMessage = (msg) => {
    const alreadyPinned = pinnedMsgs.find(m=>m.id===msg.id);
    setPinnedMsgs(p=>alreadyPinned?p.filter(m=>m.id!==msg.id):[...p,msg]);
    setMsgMenu(null);
    notify(alreadyPinned?"Unpinned.":"Message pinned");
  };

  const forwardMessage = (msg) => { setMsgMenu(null); setInput(msg.type==="text"?msg.text:""); };

  const sendFriendReq = async (user) => {
    const {error} = await supabase.from("friend_requests").insert({from_id:me.id,to_id:user.id});
    if (error) { notify("Could not send request.","#EF4444"); return; }
    setSentReqs(p=>[...p,user.id]); notify(`Request sent to ${user.name}!`);
  };
  const acceptReq = async (user) => {
    const [a,b]=[me.id,user.id].sort();
    await supabase.from("friendships").insert({user_a:a,user_b:b});
    await supabase.from("friend_requests").delete().eq("from_id",user.id).eq("to_id",me.id);
    setRequests(p=>p.filter(u=>u.id!==user.id)); setFriends(p=>[...p,user]);
    notify(`${user.name} is now your friend!`);
  };
  const declineReq = async (user) => {
    await supabase.from("friend_requests").delete().eq("from_id",user.id).eq("to_id",me.id);
    setRequests(p=>p.filter(u=>u.id!==user.id));
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
    setMe(updated); setEditingProfile(false); setProfileDraft({});
  };
  const blockUser = (user) => { setBlockedUsers(p=>[...p,user.id]); setFullProfileUser(null); setAvatarOverlay(null); setActiveChat(null); setMessages([]); notify(`${user.name} blocked.`,"#EF4444"); };
  const restrictUser = (user) => { setRestrictedUsers(p=>p.includes(user.id)?p.filter(id=>id!==user.id):[...p,user.id]); notify(restrictedUsers.includes(user.id)?`${user.name} unrestricted.`:`${user.name} restricted.`); };
  const muteUser = (user) => { setMutedUsers(p=>p.includes(user.id)?p.filter(id=>id!==user.id):[...p,user.id]); notify(mutedUsers.includes(user.id)?`${user.name} unmuted.`:`${user.name} muted.`); };
  const removeFriend = async (user) => {
    const [a,b]=[me.id,user.id].sort();
    await supabase.from("friendships").delete().or(`and(user_a.eq.${a},user_b.eq.${b})`);
    setFriends(p=>p.filter(f=>f.id!==user.id)); setFullProfileUser(null); setAvatarOverlay(null); setActiveChat(null); setMessages([]); notify(`Removed ${user.name}.`);
  };
  const isOnline = (user) => user?.online && Date.now()-new Date(user.last_seen).getTime()<20000;

  const handleTouchStart = (e, msg) => { swipeStartX.current=e.touches[0].clientX; setSwipeReply(msg); };
  const handleTouchMove = (e) => { const dx=e.touches[0].clientX-swipeStartX.current; if(dx>0&&dx<80) setSwipeX(dx); };
  const handleTouchEnd = (msg) => { if (swipeX>50) setReplyTo(msg); setSwipeX(0); setSwipeReply(null); };

  useEffect(() => {
    window.history.pushState({ pulse: true }, "");
    const onPop = (e) => {
      window.history.pushState({ pulse: true }, "");
      if (activeChat) {
        setActiveChat(null); setMessages([]); setMsgsLoaded(false);
        setShowEmoji(false); setPeerTyping(false);
        setChatView("messages"); setChatSearchOpen(false); setChatSearchQ("");
      } else if (fullProfileUser) {
        setFullProfileUser(null);
      } else if (avatarOverlay) {
        setAvatarOverlay(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [activeChat, fullProfileUser, avatarOverlay]);

  const startCall = (type) => {
    if (!activeChat) return;
    setActiveCall({ type, user: activeChat, status: "calling" });
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
    }, 3000);
  };

  const endCall = () => { setActiveCall(null); };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        const reader = new FileReader();
        reader.onload = async ev => {
          await sendMessage("🎤 Voice note", "file", { data_url: ev.target.result, file_size: (blob.size/1024).toFixed(1) + " KB", is_voice: true });
        };
        reader.readAsDataURL(blob);
        setRecordSeconds(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch { notify("Microphone access denied.", "#EF4444"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    setRecordSeconds(0);
    clearInterval(recordTimerRef.current);
    audioChunksRef.current = [];
  };

  const fmtSecs = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const togglePinChat = (userId) => {
    setPinnedChats(p => p.includes(userId) ? p.filter(id=>id!==userId) : [...p, userId]);
    notify(pinnedChats.includes(userId) ? "Chat unpinned." : "Chat pinned ⭐");
  };

  const handleDeleteChat = (userId) => {
    setDeletedChats(p=>[...p, userId]);
    setChatRowMenu(null);
    notify("Chat deleted.");
  };
  const handleMarkRead = (userId) => {
    setMarkedRead(p=>[...p, userId]);
    setChatRowMenu(null);
    notify("Marked as read.");
  };

  const handlePullStart = (e) => { pullStartY.current = e.touches?.[0]?.clientY ?? 0; };
  const handlePullEnd = async (e) => {
    const dy = (e.changedTouches?.[0]?.clientY ?? 0) - pullStartY.current;
    if (dy > 80) {
      setIsPulling(true);
      await loadSocial();
      setTimeout(()=>setIsPulling(false), 600);
    }
  };



  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%;margin:0;padding:0;overflow:hidden}
    html{height:-webkit-fill-available}
    body{min-height:-webkit-fill-available}
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
    textarea::placeholder{color:#4B5563}
    .msg-bubble{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;}
  `;

  const filteredMessages = chatSearchQ ? messages.filter(m=>m.type==="text"&&m.text.toLowerCase().includes(chatSearchQ.toLowerCase())) : messages;

  const sortedFriends = [...friends]
    .filter(u => !deletedChats.includes(u.id) && !blockedUsers.includes(u.id))
    .filter(u => chatListSearch.trim() === "" || u.name.toLowerCase().includes(chatListSearch.toLowerCase()) || u.username.toLowerCase().includes(chatListSearch.toLowerCase()))
    .sort((a,b) => {
      // Pinned always on top
      const ap = pinnedChats.includes(a.id) ? 0 : 1;
      const bp = pinnedChats.includes(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      // Within same pin group: sort by latest message time descending (newest first)
      const aTime = lastMsgs[a.id]?.created_at ? new Date(lastMsgs[a.id].created_at).getTime() : 0;
      const bTime = lastMsgs[b.id]?.created_at ? new Date(lastMsgs[b.id].created_at).getTime() : 0;
      return bTime - aTime;
    });

  const InfoRow = ({IconComp, label, sub, action, red=false, last=false}) => (
    <button onClick={action} style={{ width:"100%",padding:"14px 18px",background:"none",color:red?"#EF4444":"#E2E8F0",fontSize:14,fontWeight:600,textAlign:"left",borderBottom:last?"none":"1px solid #1E1E2A",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"none" }}>
      <div style={{ width:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <IconComp size={20} color={red?"#EF4444":"#A78BFA"} />
      </div>
      <div style={{ flex:1 }}><div>{label}</div>{sub&&<div style={{ fontSize:12,color:"#4B5563",fontWeight:400,marginTop:1 }}>{sub}</div>}</div>
      <IcChevronRight size={16} color="#4B5563" />
    </button>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0D0D12", height:"100dvh", minHeight:"-webkit-fill-available", width:"100%", maxWidth:"100%", color:"#E2E8F0", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, right:0, bottom:0, overflow:"hidden" }}>
      <style>{css}</style>

      <input type="file" ref={fileRef} onChange={sendFile} style={{display:"none"}} accept="image/*,application/*" />
      <input type="file" ref={profilePhotoRef} onChange={handleProfilePhotoUpload} style={{display:"none"}} accept="image/*" />

      {/* ── ACTIVE CALL OVERLAY ── */}
      {activeCall && (
        <div style={{ position:"fixed",inset:0,background:"#0A0A10",zIndex:5000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24 }}>
          <div style={{ fontSize:13,color:"#6B7280",fontWeight:600,letterSpacing:1,textTransform:"uppercase" }}>
            {activeCall.type==="video"?"Video Call":"Audio Call"} · {activeCall.status==="calling"?"Calling...":"Connected"}
          </div>
          <Avatar user={activeCall.user} size={100} ring />
          <div style={{ fontWeight:800,fontSize:24,color:"#E2E8F0" }}>{activeCall.user.name}</div>
          {activeCall.status==="calling" && (
            <div style={{ display:"flex",gap:6 }}>
              {[0,1,2].map(i=><span key={i} style={{ width:8,height:8,borderRadius:"50%",background:"#A78BFA",display:"inline-block",animation:`typingBounce 1.2s ${i*0.3}s infinite` }}/>)}
            </div>
          )}
          {activeCall.status==="connected" && (
            <div style={{ fontSize:13,color:"#4ADE80",fontWeight:600 }}>● Live</div>
          )}
          {activeCall.type==="video" && activeCall.status==="connected" && (
            <div style={{ width:280,height:180,borderRadius:18,background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #2A2A38" }}>
              <div style={{ color:"#4B5563",fontSize:13 }}>Camera preview</div>
            </div>
          )}
          <div style={{ display:"flex",gap:32,marginTop:20 }}>
            <button onClick={endCall} style={{ width:66,height:66,borderRadius:"50%",background:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",border:"none",boxShadow:"0 4px 20px #EF444466" }}>
              <IcPhoneOff size={28} color="#fff"/>
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"#fff",padding:"10px 22px",borderRadius:28,zIndex:9999,fontWeight:700,fontSize:13,boxShadow:`0 4px 24px ${toast.color}66`,animation:"popIn .2s ease",whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center" }}>{toast.msg}</div>}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",zIndex:9998,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20 }}>
          <img src={lightbox} alt="" style={{ maxWidth:"100%",maxHeight:"80vh",borderRadius:12,objectFit:"contain" }} />
          <div style={{ display:"flex",gap:16,marginTop:24 }}>
            <a href={lightbox} download="pulse-image.jpg" onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"12px 24px",borderRadius:24,fontSize:14,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:8 }}><IcDownload size={18}/> Download</a>
            <button onClick={()=>setLightbox(null)} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"12px 24px",borderRadius:24,fontSize:14,fontWeight:600,border:"1px solid #2A2A38",display:"flex",alignItems:"center",gap:8 }}><IcClose size={16} color="#9CA3AF"/> Close</button>
          </div>
        </div>
      )}

      {/* Avatar Overlay */}
      {avatarOverlay && (
        <div onClick={()=>setAvatarOverlay(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#141420",borderRadius:24,padding:24,width:300,border:"1px solid #2A2A38",animation:"popIn .2s ease" }}>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:20 }}>
              <Avatar user={avatarOverlay} size={56} ring showStatus />
              <div>
                <div style={{ fontWeight:800,fontSize:16 }}>{avatarOverlay.name}</div>
                <div style={{ fontSize:12,color:"#6B7280",marginTop:2 }}>@{avatarOverlay.username}</div>
                <div style={{ fontSize:11,color:isOnline(avatarOverlay)?"#4ADE80":"#6B7280",marginTop:3 }}>{getLastSeen(avatarOverlay)}</div>
              </div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <button onClick={()=>{setAvatarOverlay(null);setFullProfileUser(avatarOverlay);}} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"12px 16px",borderRadius:14,fontSize:14,fontWeight:700,textAlign:"left",display:"flex",alignItems:"center",gap:10 }}>
                <IcUser size={18} color="#fff"/> View Profile
              </button>
              <button onClick={()=>{setAvatarOverlay(null);setActiveChat(avatarOverlay);setView("chats");setChatView("messages");}} style={{ background:"#1E1E2A",color:"#E2E8F0",padding:"12px 16px",borderRadius:14,fontSize:14,fontWeight:600,textAlign:"left",display:"flex",alignItems:"center",gap:10,border:"1px solid #2A2A38" }}>
                <IcMessage size={18} color="#A78BFA"/> Message
              </button>
              <button onClick={()=>{togglePinChat(avatarOverlay.id);setAvatarOverlay(null);}} style={{ background:"#1E1E2A",color:"#E2E8F0",padding:"12px 16px",borderRadius:14,fontSize:14,fontWeight:600,textAlign:"left",display:"flex",alignItems:"center",gap:10,border:"1px solid #2A2A38" }}>
                <IcStar size={18} color="#FBBF24" fill={pinnedChats.includes(avatarOverlay.id)?"#FBBF24":"none"}/> {pinnedChats.includes(avatarOverlay.id)?"Unpin favourite":"Pin as favourite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Profile Screen */}
      {fullProfileUser && (
        <div style={{ position:"fixed",inset:0,background:"#0D0D12",zIndex:300,overflowY:"auto",animation:"slideIn .25s ease" }}>
          <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #1A1A26",position:"sticky",top:0,background:"#0D0D12",zIndex:10 }}>
            <button onClick={()=>setFullProfileUser(null)} style={{ background:"none",border:"none",padding:6,display:"flex",alignItems:"center" }}><IcBack size={24} color="#A78BFA"/></button>
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
              <button onClick={()=>{setFullProfileUser(null);setActiveChat(fullProfileUser);setView("chats");setChatView("messages");}} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"10px 20px",borderRadius:24,fontSize:13,fontWeight:700,border:"none",display:"flex",alignItems:"center",gap:8 }}>
                <IcMessage size={16} color="#fff"/> Message
              </button>
            </div>
            <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:isOnline(fullProfileUser)?"#0f2d1a":"#1a1a26",padding:"6px 14px",borderRadius:20,marginBottom:16,border:`1px solid ${isOnline(fullProfileUser)?"#4ADE8033":"#2A2A38"}` }}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:isOnline(fullProfileUser)?"#4ADE80":"#4B5563",display:"inline-block" }} />
              <span style={{ fontSize:13,color:isOnline(fullProfileUser)?"#4ADE80":"#6B7280",fontWeight:600 }}>{getLastSeen(fullProfileUser)}</span>
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
                  <button onClick={()=>{setEditNickname(false);notify("Nickname saved!");}} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:700,border:"none" }}>Save</button>
                </div>
              ) : (
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ color:nickname?"#E2E8F0":"#4B5563",fontSize:14 }}>{nickname||"No nickname set"}</span>
                  <button onClick={()=>setEditNickname(true)} style={{ background:"#1A1A26",color:"#A78BFA",padding:"6px 12px",borderRadius:10,fontSize:12,fontWeight:700,border:"1px solid #2A2A38" }}>Edit</button>
                </div>
              )}
            </div>
            <div style={{ background:"#141420",borderRadius:16,overflow:"hidden",border:"1px solid #1E1E2A" }}>
              <InfoRow IconComp={mutedUsers.includes(fullProfileUser.id)?IcBell:IcBellOff} label={mutedUsers.includes(fullProfileUser.id)?"Unmute notifications":"Mute notifications"} action={()=>muteUser(fullProfileUser)} />
              <InfoRow IconComp={IcRestrict} label={restrictedUsers.includes(fullProfileUser.id)?"Remove restriction":"Restrict"} action={()=>restrictUser(fullProfileUser)} />
              <InfoRow IconComp={IcUserRemove} label="Remove friend" action={()=>removeFriend(fullProfileUser)} red />
              <InfoRow IconComp={IcBlock} label="Block" action={()=>blockUser(fullProfileUser)} red />
              <InfoRow IconComp={IcFlag} label="Report" action={()=>{notify("Reported.","#F97316");setFullProfileUser(null);}} red last />
            </div>
          </div>
        </div>
      )}

      {/* BG Picker */}
      {showBgPicker && (
        <div onClick={()=>setShowBgPicker(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:250,display:"flex",alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%",background:"#0F0F1A",borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",border:"1px solid #1E1E2A" }}>
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

      {/* ── AUTH SCREENS ── */}
      {screen==="splash" && (
        <div className="screen-enter" style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32 }}>
          <div style={{ width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#A78BFA,#6366F1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,marginBottom:24,boxShadow:"0 0 60px #A78BFA55" }}>⚡</div>
          <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:36,letterSpacing:"-2px",background:"linear-gradient(135deg,#A78BFA,#6366F1,#EC4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>pulse</div>
          <div style={{ color:"#4B5563",fontSize:14,marginTop:8,marginBottom:48 }}>Real connections. Live.</div>
          <button className="ripple" onClick={()=>setScreen("signup")} style={{ width:"100%",padding:15,borderRadius:18,background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",fontWeight:700,fontSize:16,marginBottom:12 }}>Create Account</button>
          <button className="ripple" onClick={()=>setScreen("login")} style={{ width:"100%",padding:15,borderRadius:18,background:"#1A1A26",color:"#A78BFA",fontWeight:700,fontSize:16,border:"1px solid #2A2A38" }}>Sign In</button>
        </div>
      )}
      {screen==="signup" && (
        <div className="screen-enter" style={{ flex:1,padding:"48px 28px 32px",display:"flex",flexDirection:"column",minHeight:"100vh",overflowY:"auto" }}>
          <button onClick={()=>setScreen("splash")} style={{ background:"none",border:"none",padding:6,marginBottom:18,alignSelf:"flex-start" }}><IcBack size={24} color="#6B7280"/></button>
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
      {screen==="login" && (
        <div className="screen-enter" style={{ flex:1,padding:"48px 28px 32px",display:"flex",flexDirection:"column",minHeight:"100vh" }}>
          <button onClick={()=>setScreen("splash")} style={{ background:"none",border:"none",padding:6,marginBottom:18,alignSelf:"flex-start" }}><IcBack size={24} color="#6B7280"/></button>
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

      {/* ── HOME ── */}
      {screen==="home" && me && (
        <>
          {/* STICKY Top Bar */}
          <div style={{ padding:"12px 16px",borderBottom:"1px solid #1A1A26",display:"flex",alignItems:"center",gap:8,background:"#0D0D12",flexShrink:0,zIndex:20 }}>
            {activeChat && view==="chats" ? (
              <button onClick={()=>{setActiveChat(null);setMessages([]);setMsgsLoaded(false);setShowEmoji(false);setPeerTyping(false);setChatView("messages");setChatSearchOpen(false);setChatSearchQ("");}} style={{ background:"none",border:"none",padding:6,display:"flex",alignItems:"center",flexShrink:0 }}><IcBack size={24} color="#A78BFA"/></button>
            ) : (
              <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:22,letterSpacing:"-1px",background:"linear-gradient(135deg,#A78BFA,#6366F1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",flex:1 }}>pulse</div>
            )}
            {activeChat && view==="chats" ? (
              <>
                <div style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",flex:1 }} onClick={()=>setChatView(v=>v==="messages"?"info":"messages")}>
                  <Avatar user={{...activeChat,online:isOnline(activeChat)}} size={36} showStatus ring />
                  <div>
                    <div style={{ fontWeight:700,fontSize:14 }}>{nickname||activeChat.name}</div>
                    <div style={{ fontSize:11,color:isOnline(activeChat)?"#4ADE80":"#6B7280" }}>{isOnline(activeChat)?"Active now":getLastSeen(activeChat)}</div>
                  </div>
                </div>
                <button onClick={()=>startCall("audio")} style={{ background:"#1A1A26",border:"1px solid #2A2A38",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <IcPhone size={18} color="#A78BFA"/>
                </button>
                <button onClick={()=>startCall("video")} style={{ background:"#1A1A26",border:"1px solid #2A2A38",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <IcVideoCall size={18} color="#A78BFA"/>
                </button>
              </>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                {requests.length>0 && <span style={{ background:"#EF4444",color:"#fff",borderRadius:20,fontSize:11,fontWeight:700,padding:"2px 8px" }}>{requests.length} req</span>}
                <Avatar user={me} size={32} />
              </div>
            )}
          </div>

          {/* Chat search bar */}
          {activeChat && chatSearchOpen && (
            <div style={{ padding:"8px 16px",borderBottom:"1px solid #1A1A26",background:"#0D0D12",flexShrink:0,display:"flex",gap:8,alignItems:"center" }}>
              <input value={chatSearchQ} onChange={e=>setChatSearchQ(e.target.value)} placeholder="Search messages..." style={{ flex:1,background:"#1A1A26",borderRadius:24,padding:"9px 16px",fontSize:14,border:"1px solid #2A2A38" }} autoFocus />
              <button onClick={()=>{setChatSearchOpen(false);setChatSearchQ("");}} style={{ background:"none",border:"none",padding:4 }}><IcClose size={18} color="#6B7280"/></button>
            </div>
          )}

          {/* ── CHAT MESSAGES VIEW ── */}
          {view==="chats" && activeChat && chatView==="messages" ? (
            <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0,background:currentBg }} onClick={()=>setMsgMenu(null)}>
              {pinnedMsgs.length>0 && (
                <div style={{ padding:"8px 16px",background:"#141420",borderBottom:"1px solid #1E1E2A",display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                  <IcPushPin size={14} color="#A78BFA"/>
                  <span style={{ fontSize:13,color:"#C4C4D4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{pinnedMsgs[pinnedMsgs.length-1]?.text}</span>
                </div>
              )}

              {/* Scrollable messages */}
              <div style={{ flex:1,overflowY:"auto",padding:"12px 12px 8px",display:"flex",flexDirection:"column",gap:2 }}>
                {!msgsLoaded && (
                  <div style={{ textAlign:"center",color:"#4B5563",marginTop:60 }}>
                    <div style={{ width:24,height:24,border:"2px solid #A78BFA",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto" }} />
                  </div>
                )}
                {msgsLoaded && filteredMessages.length===0 && !chatSearchQ && (
                  <div style={{ textAlign:"center",color:"#4B5563",marginTop:60,fontSize:14 }}>
                    <div style={{ fontSize:44,marginBottom:12 }}>👋</div>Say hello to {activeChat.name}!
                  </div>
                )}
                {msgsLoaded && chatSearchQ && filteredMessages.length===0 && (
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
                      onTouchStart={e=>handleTouchStart(e,msg)} onTouchMove={handleTouchMove} onTouchEnd={()=>handleTouchEnd(msg)}>
                      {!isMe && <div style={{ width:32,flexShrink:0 }}>{isLastInGroup&&<Avatar user={activeChat} size={30} />}</div>}
                      <div style={{ maxWidth:"78%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start" }}>
                        {msg.reply_to_id && <div style={{ fontSize:11,color:"#6B7280",fontWeight:600,marginBottom:3,textAlign:isMe?"right":"left" }}>{isMe?"You replied":"Replied to you"}</div>}
                        {msg.reply_to_id && <div style={{ background:"rgba(255,255,255,0.07)",borderRadius:14,padding:"7px 12px",marginBottom:3,fontSize:13,color:"#9CA3AF",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",border:"1px solid rgba(255,255,255,0.08)" }}>{msg.reply_text}</div>}
                        <div className="msg-bubble"
                          onContextMenu={e=>{e.preventDefault();const r=e.currentTarget.getBoundingClientRect();setMenuPos({top:r.bottom,left:r.left,width:r.width,isMe});setMsgMenu({msg});}}
                          onTouchStart={e=>{swipeStartX.current=e.touches[0].clientX;const el=e.currentTarget;longPressTimer.current=setTimeout(()=>{const r=el.getBoundingClientRect();setMenuPos({top:r.bottom,left:r.left,width:r.width,isMe});setMsgMenu({msg});},500);}}
                          onTouchMove={e=>{clearTimeout(longPressTimer.current);handleTouchMove(e);}}
                          onTouchEnd={()=>{clearTimeout(longPressTimer.current);handleTouchEnd(msg);}}
                          style={{ background:msgMenu?.msg?.id===msg.id?(isMe?"linear-gradient(135deg,#7C3AED,#5B21B6)":"#2A2A3A"):isMe?"linear-gradient(135deg,#9333EA,#7C3AED)":"#1C1C28",color:"#fff",borderRadius:isMe?(isFirstInGroup?"20px 20px 6px 20px":"20px 6px 6px 20px"):(isFirstInGroup?"20px 20px 20px 6px":"6px 20px 20px 6px"),padding:msg.type==="image"?4:"11px 15px",fontSize:15,lineHeight:1.55,cursor:"pointer",wordBreak:"break-word",whiteSpace:"pre-wrap",transition:"background .15s",transform:msgMenu?.msg?.id===msg.id?"scale(1.02)":"scale(1)" }}>
                          {msg.type==="image"&&<img src={msg.data_url} alt="" onClick={()=>setLightbox(msg.data_url)} style={{ maxWidth:220,maxHeight:240,borderRadius:14,display:"block",cursor:"pointer" }} />}
                          {msg.type==="file"&&(
                            msg.is_voice ? (
                              <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:180 }}>
                                <IcMic size={20} color={isMe?"#fff":"#A78BFA"}/>
                                <audio controls src={msg.data_url} style={{ height:32,flex:1,filter:"invert(0)",maxWidth:160 }}/>
                                <span style={{ fontSize:11,opacity:.65 }}>{msg.file_size}</span>
                              </div>
                            ) : (
                              <div style={{ display:"flex",alignItems:"center",gap:10 }}><IcFile size={24} color="#A78BFA"/><div><div style={{ fontWeight:600,fontSize:13 }}>{msg.text}</div><div style={{ fontSize:11,opacity:.65 }}>{msg.file_size}</div></div></div>
                            )
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
                        {msgReactions.length>0&&(<div style={{ display:"flex",gap:3,marginTop:4,flexWrap:"wrap" }}>{Object.entries(msgReactions.reduce((a,r)=>{a[r.emoji]=(a[r.emoji]||0)+1;return a;},{})).map(([emoji,count])=>(<span key={emoji} onClick={()=>toggleReaction(msg,emoji)} style={{ background:"#1E1E2A",border:"1px solid #2A2A38",borderRadius:20,padding:"2px 8px",fontSize:12,cursor:"pointer" }}>{emoji} {count}</span>))}</div>)}
                        {isLastInGroup&&(<div style={{ fontSize:10,color:"#4B5563",marginTop:3,display:"flex",alignItems:"center",gap:4 }}>{time}{msg.edited&&<span style={{ color:"#6B7280" }}>· edited</span>}{isMe&&isLast&&(msg.seen?<IcDoubleCheck size={14} color="#A78BFA"/>:<IcCheck size={14} color="#4B5563"/>)}</div>)}
                      </div>
                      {isSwiping&&swipeX>20&&<div style={{ opacity:swipeX/60 }}><IcSwipeReply size={20}/></div>}
                    </div>
                  );
                })}
                {peerTyping&&<div style={{ display:"flex",alignItems:"flex-end",gap:8 }}><Avatar user={activeChat} size={26} /><TypingBubble /></div>}
                <div ref={chatEndRef} />
              </div>

              {/* Context menu — anchored below the pressed message */}
              {msgMenu&&(()=>{
                const menuW = Math.min(260, window.innerWidth*0.88);
                const spaceBelow = window.innerHeight - menuPos.top - 8;
                const menuH = Math.min(380, spaceBelow > 200 ? spaceBelow - 16 : window.innerHeight * 0.55);
                // Place below message if enough space, otherwise above
                const topPos = spaceBelow > 200 ? menuPos.top + 8 : menuPos.top - menuH - 60;
                // Align to message side: right-align for my messages, left-align for theirs
                const leftPos = menuPos.isMe
                  ? Math.min(window.innerWidth - menuW - 12, menuPos.left + menuPos.width - menuW)
                  : Math.max(12, menuPos.left);
                return (
                  <div onClick={()=>setMsgMenu(null)} style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.45)" }}>
                    <div onClick={e=>e.stopPropagation()} style={{ position:"fixed",top:Math.max(8,topPos),left:leftPos,background:"#1A1A26",borderRadius:18,overflow:"hidden",width:menuW,boxShadow:"0 8px 40px #000000BB",border:"1px solid #2A2A38",zIndex:101,maxHeight:menuH,overflowY:"auto",animation:"popIn .18s ease" }}>
                      {/* Reaction bar */}
                      <div style={{ display:"flex",justifyContent:"space-around",padding:"14px 12px",borderBottom:"1px solid #2A2A38",background:"#141420" }}>
                        {REACT_EMOJIS.map(e=><span key={e} onClick={()=>toggleReaction(msgMenu.msg,e)} style={{ fontSize:26,cursor:"pointer",padding:"0 2px" }}>{e}</span>)}
                      </div>
                      {/* Timestamp */}
                      <div style={{ padding:"8px 16px 4px",fontSize:11,color:"#4B5563",fontWeight:600,borderBottom:"1px solid #1E1E2A" }}>
                        {new Date(msgMenu.msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                      </div>
                      {[
                        {label:"Reply",Icon:IcReply,action:()=>{setReplyTo(msgMenu.msg);setMsgMenu(null);}},
                        ...(msgMenu.msg.from_id===me.id&&msgMenu.msg.type==="text"?[{label:"Edit",Icon:IcEdit,action:()=>{setEditingMsg({id:msgMenu.msg.id,text:msgMenu.msg.text});setMsgMenu(null);}}]:[]),
                        {label:"Copy",Icon:IcCopy,action:()=>{navigator.clipboard?.writeText(msgMenu.msg.text||"");notify("Copied!");setMsgMenu(null);}},
                        {label:"Forward",Icon:IcForward,action:()=>forwardMessage(msgMenu.msg)},
                        {label:pinnedMsgs.find(m=>m.id===msgMenu.msg.id)?"Unpin":"Pin",Icon:IcPushPin,action:()=>pinMessage(msgMenu.msg)},
                        ...(msgMenu.msg.type==="image"?[{label:"View photo",Icon:IcImage,action:()=>{setLightbox(msgMenu.msg.data_url);setMsgMenu(null);}}]:[]),
                        ...(msgMenu.msg.from_id===me.id?[{label:"Unsend",Icon:IcUnsend,color:"#EF4444",action:()=>unsendMessage(msgMenu.msg.id)}]:[{label:"Report",Icon:IcFlag,color:"#EF4444",action:()=>{notify("Reported.","#F97316");setMsgMenu(null);}}]),
                      ].map((opt,i,arr)=>(
                        <button key={opt.label} onClick={opt.action} style={{ width:"100%",padding:"13px 18px",background:"none",color:opt.color||"#E2E8F0",fontSize:14,fontWeight:600,textAlign:"left",borderBottom:i<arr.length-1?"1px solid #1E1E2A":"none",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"none" }}>
                          <opt.Icon size={20} color={opt.color||"#E2E8F0"}/>{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {showEmoji&&(<div style={{ background:"#141420",borderTop:"1px solid #1E1E2A",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:10,flexShrink:0 }}>{EMOJIS.map(e=><span key={e} onClick={()=>setInput(p=>p+e)} style={{ fontSize:22,cursor:"pointer" }}>{e}</span>)}</div>)}

              {replyTo&&(
                <div style={{ padding:"8px 16px",background:"#141420",borderTop:"1px solid #1E1E2A",display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                  <div style={{ flex:1,borderLeft:"3px solid #A78BFA",paddingLeft:10 }}>
                    <div style={{ fontSize:12,color:"#A78BFA",fontWeight:700 }}>Replying to {replyTo.from_id===me.id?"yourself":activeChat.name}</div>
                    <div style={{ fontSize:13,color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{replyTo.type==="text"?replyTo.text:"Photo"}</div>
                  </div>
                  <button onClick={()=>setReplyTo(null)} style={{ background:"none",border:"none",padding:4 }}><IcClose size={18} color="#6B7280"/></button>
                </div>
              )}

              {/* ── Input bar ── */}
              <div style={{ padding:"10px 12px",borderTop:"1px solid #1A1A26",display:"flex",gap:6,alignItems:"flex-end",background:"#0D0D12",flexShrink:0 }}>
                {isRecording ? (
                  <>
                    <button onClick={cancelRecording} style={{ background:"#1E1E2A",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"none" }}>
                      <IcClose size={18} color="#EF4444"/>
                    </button>
                    <div style={{ flex:1,background:"#1A1A26",borderRadius:24,padding:"11px 16px",display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ width:8,height:8,borderRadius:"50%",background:"#EF4444",display:"inline-block",animation:"typingBounce 1s infinite" }}/>
                      <span style={{ fontSize:14,color:"#E2E8F0",fontWeight:600 }}>Recording {fmtSecs(recordSeconds)}</span>
                    </div>
                    <button onClick={stopRecording} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",borderRadius:"50%",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"none" }}>
                      <IcCheck size={22} color="#fff"/>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>fileRef.current.click()} style={{ background:"#1A1A26",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"none",flexShrink:0 }}><IcAttach size={20}/></button>
                    <button onClick={()=>setShowEmoji(p=>!p)} style={{ background:showEmoji?"#2A1F44":"#1A1A26",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"none",flexShrink:0 }}><IcEmoji size={20} color={showEmoji?"#A78BFA":"#9CA3AF"}/></button>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => { setInput(e.target.value); signalTyping(); }}
                      placeholder="Message..."
                      rows={1}
                      enterKeyHint="enter"
                      style={{ flex:1, background:"#1A1A26", borderRadius:18, padding:"11px 16px", fontSize:14, resize:"none", lineHeight:"1.4", maxHeight:120, overflowY:"auto", fontFamily:"'DM Sans',sans-serif" }}
                      onInput={e => {
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                      }}
                    />
                    {input.trim() ? (
                      <button onClick={()=>sendMessage(input)} className="ripple" style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"none" }}><IcSend size={18}/></button>
                    ) : (
                      <button onTouchStart={startRecording} onMouseDown={startRecording} style={{ background:"#1A1A26",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"none" }}>
                        <IcMic size={20} color="#A78BFA"/>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

          ) : (
            <div style={{ flex:1,overflowY:"auto",paddingBottom:16 }}>

              {/* Chat Info */}
              {view==="chats" && activeChat && chatView==="info" && (
                <div>
                  <div style={{ height:120,background:`linear-gradient(135deg,${activeChat.color}66,${activeChat.color}22)`,display:"flex",alignItems:"flex-end",padding:"0 20px 16px" }}>
                    <Avatar user={{...activeChat,online:isOnline(activeChat)}} size={72} showStatus ring />
                    <div style={{ marginLeft:16 }}>
                      <div style={{ fontWeight:800,fontSize:20 }}>{nickname||activeChat.name}</div>
                      <div style={{ color:"#6B7280",fontSize:13 }}>@{activeChat.username}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-around",padding:"20px 16px",borderBottom:"1px solid #1A1A26" }}>
                    {[
                      {IconComp:IcMessage,label:"Message",action:()=>setChatView("messages")},
                      {IconComp:mutedUsers.includes(activeChat.id)?IcUnmute:IcMute,label:mutedUsers.includes(activeChat.id)?"Unmute":"Mute",action:()=>muteUser(activeChat)},
                      {IconComp:IcInfoSearch,label:"Search",action:()=>{setChatView("messages");setChatSearchOpen(true);}},
                      {IconComp:IcDotsHoriz,label:"More",action:()=>setFullProfileUser(activeChat)},
                    ].map(a=>(
                      <button key={a.label} onClick={a.action} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"none",color:"#E2E8F0",cursor:"pointer",border:"none" }}>
                        <div style={{ width:48,height:48,borderRadius:"50%",background:"#1A1A26",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #2A2A38" }}><a.IconComp size={20} color="#A78BFA"/></div>
                        <span style={{ fontSize:11,color:"#6B7280",fontWeight:600 }}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ margin:"12px 16px",background:"#141420",borderRadius:16,overflow:"hidden",border:"1px solid #1E1E2A" }}>
                    <InfoRow IconComp={IcPalette} label="Chat theme" sub={CHAT_BGS.find(b=>b.id===chatBg)?.label||"Default"} action={()=>setShowBgPicker(true)} />
                    <InfoRow IconComp={IcPushPin} label="Pinned messages" sub={`${pinnedMsgs.length} pinned`} action={()=>{}} />
                    <InfoRow IconComp={IcMedia} label="Media" sub={`${messages.filter(m=>m.type==="image").length} photos`} action={()=>{}} />
                    <InfoRow IconComp={IcNickname} label="Nicknames" sub={nickname||"None set"} action={()=>setFullProfileUser(activeChat)} />
                    <InfoRow IconComp={mutedUsers.includes(activeChat.id)?IcBell:IcBellOff} label={mutedUsers.includes(activeChat.id)?"Unmute notifications":"Mute notifications"} action={()=>muteUser(activeChat)} />
                    <InfoRow IconComp={IcBlock} label="Block" action={()=>blockUser(activeChat)} red />
                    <InfoRow IconComp={IcFlag} label="Report" action={()=>notify("Reported.","#F97316")} red last />
                  </div>
                  {messages.filter(m=>m.type==="image").length>0 && (
                    <div style={{ margin:"0 16px 20px" }}>
                      <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Media</div>
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3,borderRadius:12,overflow:"hidden" }}>
                        {messages.filter(m=>m.type==="image").slice(-9).map(m=>(<img key={m.id} src={m.data_url} alt="" onClick={()=>setLightbox(m.data_url)} style={{ width:"100%",aspectRatio:"1",objectFit:"cover",cursor:"pointer" }} />))}
                      </div>
                    </div>
                  )}
                  {pinnedMsgs.length>0 && (
                    <div style={{ margin:"0 16px 20px" }}>
                      <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Pinned Messages</div>
                      {pinnedMsgs.map(m=>(<div key={m.id} style={{ background:"#141420",borderRadius:12,padding:"12px 14px",marginBottom:8,border:"1px solid #2A2A38",display:"flex",alignItems:"center",gap:10 }}><IcPushPin size={16} color="#A78BFA"/><div style={{ flex:1,fontSize:13,color:"#C4C4D4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.text}</div><button onClick={()=>pinMessage(m)} style={{ background:"none",border:"none",padding:2 }}><IcClose size={14} color="#4B5563"/></button></div>))}
                    </div>
                  )}
                </div>
              )}

              {/* Chats list */}
              {view==="chats" && !activeChat && (
                <div
                  style={{ padding:"0 20px 6px" }}
                  onTouchStart={handlePullStart}
                  onTouchEnd={handlePullEnd}
                >
                  {isPulling && (
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"12px 0",gap:8 }}>
                      <div style={{ width:18,height:18,border:"2px solid #A78BFA",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
                      <span style={{ fontSize:13,color:"#6B7280" }}>Refreshing...</span>
                    </div>
                  )}
                  <div style={{ padding:"16px 0 12px" }}>
                    <div style={{ display:"flex",alignItems:"center",background:"#1A1A26",borderRadius:14,padding:"10px 14px",gap:10,border:"1px solid #2A2A38" }}>
                      <IcInfoSearch size={16} color="#4B5563"/>
                      <input value={chatListSearch} onChange={e=>setChatListSearch(e.target.value)} placeholder="Search chats..." style={{ flex:1,fontSize:14,color:"#E2E8F0",background:"none" }} />
                      {chatListSearch && <button onClick={()=>setChatListSearch("")} style={{ background:"none",border:"none",padding:0,display:"flex" }}><IcClose size={14} color="#6B7280"/></button>}
                    </div>
                  </div>
                  <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Messages</div>
                  {friends.length===0 && <div style={{ textAlign:"center",color:"#4B5563",padding:"40px 0",fontSize:14 }}><div style={{ fontSize:42,marginBottom:12 }}>💬</div>Add friends to start chatting!</div>}
                  {sortedFriends.length===0 && friends.length>0 && chatListSearch && <div style={{ textAlign:"center",color:"#4B5563",padding:"30px 0",fontSize:14 }}>No chats match "{chatListSearch}"</div>}

                  {chatRowMenu && (()=>{
                    const menuW = Math.min(270, window.innerWidth - 24);
                    const spaceBelow = window.innerHeight - chatRowMenuPos.top - 8;
                    const menuH = 240;
                    const topPos = spaceBelow > menuH + 16 ? chatRowMenuPos.top + 6 : chatRowMenuPos.top - menuH - 6;
                    const leftPos = Math.max(12, Math.min(chatRowMenuPos.left, window.innerWidth - menuW - 12));
                    return (
                      <div onClick={()=>setChatRowMenu(null)} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.45)" }}>
                        <div onClick={e=>e.stopPropagation()} style={{ position:"fixed",top:Math.max(8,topPos),left:leftPos,background:"#1A1A26",borderRadius:18,overflow:"hidden",width:menuW,boxShadow:"0 8px 40px #000000BB",border:"1px solid #2A2A38",animation:"popIn .18s ease",zIndex:201 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid #2A2A38",background:"#141420" }}>
                            <Avatar user={chatRowMenu.user} size={36} showStatus />
                            <div>
                              <div style={{ fontWeight:700,fontSize:14 }}>{chatRowMenu.user.name}</div>
                              <div style={{ fontSize:12,color:"#6B7280" }}>@{chatRowMenu.user.username}</div>
                            </div>
                          </div>
                          {[
                            { label: pinnedChats.includes(chatRowMenu.user.id) ? "Unpin chat" : "Pin chat", Icon: IcPushPin, color:"#E2E8F0", action:()=>{togglePinChat(chatRowMenu.user.id);setChatRowMenu(null);} },
                            { label: "Mark as read", Icon: IcDoubleCheck, color:"#E2E8F0", action:()=>handleMarkRead(chatRowMenu.user.id) },
                            { label: "View profile", Icon: IcUser, color:"#E2E8F0", action:()=>{setFullProfileUser(chatRowMenu.user);setChatRowMenu(null);} },
                            { label: "Delete chat", Icon: IcUnsend, color:"#EF4444", action:()=>handleDeleteChat(chatRowMenu.user.id) },
                          ].map((opt,i,arr)=>(
                            <button key={opt.label} onClick={opt.action} style={{ width:"100%",padding:"13px 16px",background:"none",color:opt.color,fontSize:14,fontWeight:600,textAlign:"left",borderBottom:i<arr.length-1?"1px solid #1E1E2A":"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"none" }}>
                              <opt.Icon size={20} color={opt.color}/>{opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {sortedFriends.map(user=>{
                    const lm=lastMsgs[user.id];
                    const online=isOnline(user);
                    const isMarkedRead = markedRead.includes(user.id);
                    const unreadCount = isMarkedRead ? 0 : (lm?.unreadCount||0);
                    const unread = unreadCount > 0;
                    const time=lm?new Date(lm.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
                    const isPinned=pinnedChats.includes(user.id);
                    return (
                      <div key={user.id} className="chat-row"
                        onClick={()=>{setActiveChat(user);setChatView("messages");setMarkedRead(p=>p.filter(id=>id!==user.id));}}
                        onTouchStart={(e)=>{
                          pullStartY.current = e.touches[0].clientY;
                          const el=e.currentTarget;
                          chatRowLongPress.current=setTimeout(()=>{const r=el.getBoundingClientRect();setChatRowMenuPos({top:r.bottom,left:r.left,width:r.width});setChatRowMenu({user});},550);
                        }}
                        onTouchEnd={(e)=>{
                          clearTimeout(chatRowLongPress.current);
                          const dy = e.changedTouches[0].clientY - pullStartY.current;
                          if (dy > 80 && !chatRowMenu) { setIsPulling(true); loadSocial().then(()=>setTimeout(()=>setIsPulling(false),600)); }
                        }}
                        onTouchMove={()=>clearTimeout(chatRowLongPress.current)}
                        onContextMenu={e=>{e.preventDefault();const r=e.currentTarget.getBoundingClientRect();setChatRowMenuPos({top:r.bottom,left:r.left,width:r.width});setChatRowMenu({user});}}
                        style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #151520",cursor:"pointer",borderRadius:12,position:"relative",background:chatRowMenu?.user?.id===user.id?"#1a1a2e":"transparent",transition:"background .15s" }}>
                        <div onClick={e=>{e.stopPropagation();setAvatarOverlay(user);}} style={{ flexShrink:0,cursor:"pointer" }}>
                          <Avatar user={{...user,online}} size={50} showStatus />
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                            <div style={{ fontWeight:unread?800:600,fontSize:14,display:"flex",alignItems:"center",gap:5 }}>
                              {isPinned && <IcStar size={12} color="#FBBF24" fill="#FBBF24"/>}
                              {user.name}
                            </div>
                            <div style={{ fontSize:11,color:unread?"#A78BFA":"#4B5563",fontWeight:unread?700:400 }}>{time}</div>
                          </div>
                          <div style={{ fontSize:13,color:unread?"#A78BFA":"#6B7280",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:unread?600:400 }}>
                            {mutedUsers.includes(user.id)&&<IcBellOff size={11} color="#4B5563"/>}
                            {" "}{lm?(lm.type==="image"?"📷 Photo":lm.type==="file"?"📎 File":(lm.from_id===me.id?`You: ${lm.text}`:lm.text)):"Say hello!"}
                          </div>
                        </div>
                        {unread && (
                          <div style={{ flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3 }}>
                            <div style={{ minWidth:22,height:22,borderRadius:11,background:"linear-gradient(135deg,#A78BFA,#6366F1)",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 7px" }}>
                              <span style={{ fontSize:11,fontWeight:800,color:"#fff" }}>{unreadCount>9?"9+":unreadCount}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Friends */}
              {view==="friends" && (
                <div style={{ padding:"16px 20px" }} onTouchStart={handlePullStart} onTouchEnd={handlePullEnd}>
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"#4B5563",letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>Find People</div>
                    <div style={{ display:"flex",gap:8 }}>
                      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Search by username..." style={{ flex:1,background:"#1A1A26",borderRadius:14,padding:"12px 16px",fontSize:14,border:"1px solid #2A2A38" }} />
                      <button className="ripple" onClick={doSearch} disabled={searching} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"0 18px",borderRadius:14,fontWeight:700,fontSize:14,flexShrink:0,border:"none" }}>{searching?"...":"Search"}</button>
                    </div>
                    <div style={{ fontSize:11,color:"#4B5563",marginTop:6 }}>Your handle: <span style={{ color:"#A78BFA",fontWeight:700 }}>@{me.username}</span></div>
                  </div>
                  {searchResults.map(user=>{
                    const isFriend=friends.some(f=>f.id===user.id); const sent=sentReqs.includes(user.id);
                    return (
                      <div key={user.id} style={{ background:"#141420",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:12,border:"1px solid #2A2A38",cursor:"pointer" }}
                        onClick={()=>setFullProfileUser(user)}>
                        <Avatar user={{...user,online:isOnline(user)}} size={50} showStatus />
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:14 }}>{user.name}</div>
                          <div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div>
                          <div style={{ fontSize:12,color:"#9CA3AF",marginTop:2 }}>{user.bio}</div>
                        </div>
                        <div onClick={e=>e.stopPropagation()}>
                          {isFriend
                            ? <span style={{ color:"#4ADE80",fontSize:12,fontWeight:700 }}>Friends</span>
                            : sent
                              ? <span style={{ color:"#6B7280",fontSize:12,fontWeight:700 }}>Sent</span>
                              : <button className="ripple" onClick={e=>{e.stopPropagation();sendFriendReq(user);}} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700,border:"none",display:"flex",alignItems:"center",gap:6 }}><IcPlusCircle size={14} color="#fff"/> Add</button>
                          }
                        </div>
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
                            <button className="ripple" onClick={()=>acceptReq(user)} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"8px 14px",borderRadius:20,fontSize:12,fontWeight:700,border:"none" }}>Accept</button>
                            <button className="ripple" onClick={()=>declineReq(user)} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"8px 12px",borderRadius:20,fontSize:12,fontWeight:600,border:"none",display:"flex",alignItems:"center" }}><IcClose size={14} color="#9CA3AF"/></button>
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
                        <div key={user.id} className="chat-row" style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #151520",cursor:"pointer",borderRadius:10 }}
                          onClick={()=>{setActiveChat(user);setView("chats");setChatView("messages");}}>
                          <div onClick={e=>{e.stopPropagation();setAvatarOverlay(user);}} style={{ flexShrink:0 }}>
                            <Avatar user={{...user,online}} size={46} showStatus />
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600,fontSize:14 }}>{user.name}</div>
                            <div style={{ fontSize:12,color:"#6B7280" }}>@{user.username}</div>
                            <div style={{ fontSize:11,color:online?"#4ADE80":"#6B7280",marginTop:2 }}>{getLastSeen(user)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Profile */}
              {view==="profile" && (
                <div style={{ padding:"20px" }} onTouchStart={handlePullStart} onTouchEnd={handlePullEnd}>
                  <div style={{ background:`linear-gradient(135deg,${me.color}22,#141420)`,borderRadius:20,padding:24,marginBottom:20,border:`1px solid ${me.color}33`,textAlign:"center" }}>
                    <div style={{ position:"relative",display:"inline-block" }}>
                      <Avatar user={me} size={88} ring />
                      <button onClick={()=>profilePhotoRef.current.click()} disabled={uploadingPhoto} style={{ position:"absolute",bottom:0,right:0,width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#A78BFA,#6366F1)",border:"2px solid #0D0D12",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px #00000066" }}>
                        {uploadingPhoto?<div style={{width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>:<IcCamera size={14}/>}
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
                          <button className="ripple" onClick={saveProfile} style={{ background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",padding:"10px 24px",borderRadius:24,fontSize:13,fontWeight:800,border:"none" }}>Save</button>
                          <button className="ripple" onClick={()=>{setEditingProfile(false);setProfileDraft({});}} style={{ background:"#1E1E2A",color:"#9CA3AF",padding:"10px 20px",borderRadius:24,fontSize:13,fontWeight:600,border:"none" }}>Cancel</button>
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
                          <button className="ripple" onClick={()=>setEditingProfile(true)} style={{ background:"#1A1A26",color:"#A78BFA",padding:"9px 22px",borderRadius:24,fontSize:13,fontWeight:700,border:`1px solid ${me.color}44`,display:"flex",alignItems:"center",gap:8 }}><IcEdit size={15} color="#A78BFA"/> Edit Profile</button>
                          <button className="ripple" onClick={doLogout} style={{ background:"#1A1A26",color:"#EF4444",padding:"9px 18px",borderRadius:24,fontSize:13,fontWeight:700,border:"1px solid #EF444433",display:"flex",alignItems:"center",gap:8 }}><IcUnsend size={15} color="#EF4444"/> Sign Out</button>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
                    {[{label:"Friends",value:friends.length,IconComp:IcFriends},{label:"Requests",value:requests.length,IconComp:IcBell}].map(s=>(
                      <div key={s.label} style={{ background:"#141420",borderRadius:16,padding:"18px 16px",textAlign:"center",border:"1px solid #1E1E2A" }}>
                        <s.IconComp size={28} color="#A78BFA"/>
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
          {!(view==="chats"&&activeChat&&chatView==="messages") && (
            <div style={{ flexShrink:0,background:"#0D0D12",borderTop:"1px solid #1A1A26",display:"flex",justifyContent:"space-around",padding:"10px 0 16px",zIndex:10 }}>
              {[
                {id:"chats",IconComp:IcChat,label:"Chats"},
                {id:"friends",IconComp:IcFriends,label:"Friends",badge:requests.length},
                {id:"profile",IconComp:IcUser,label:"Profile"},
              ].map(tab=>(
                <button key={tab.id} className="tab-btn" onClick={()=>setView(tab.id)} style={{ background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:view===tab.id?"#A78BFA":"#4B5563",padding:"6px 24px",borderRadius:16,transition:"all .15s",position:"relative",border:"none" }}>
                  {tab.badge>0&&<span style={{ position:"absolute",top:0,right:10,background:"#EF4444",color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"1px 5px" }}>{tab.badge}</span>}
                  <tab.IconComp size={22} color={view===tab.id?"#A78BFA":"#4B5563"}/>
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
