import { useEffect, useRef, useState, useCallback } from "react";
import Threads from "./components/Threads";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MULISH = "'Mulish', sans-serif";
const MONO = "'Courier New', monospace";
const PRIMARY_COLOR = "#6D619E"; // Matching the Threads color palette

// Neo Brutalism Font for Loading
const NEO_FONT = "'JetBrains Mono', 'Courier New', monospace";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; background: #0c0a0c; overflow-x: hidden; color: #fff; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(109, 97, 158, 0.4); borderRadius: 10px; }
  @keyframes ldot { 0%,100% { opacity:1; box-shadow:0 0 10px #6D619E; } 50% { opacity:.3; } }
  @keyframes toastIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; } }
  @keyframes slideIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

  .mobile-only { display: none; }
  @media (max-width: 768px) {
    .mobile-only { display: block; }
    .desktop-only { display: none; }
  }
  .nav-item { transition: all 0.2s; }
  .nav-item:hover { background: rgba(109, 97, 158, 0.1) !important; color: #6D619E !important; }
  .coin-row:hover { background: rgba(255,255,255,0.03) !important; }
`;

const GLASS = {
  background: "rgba(30, 20, 40, 0.30)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderTop: "1px solid rgba(255, 255, 255, 0.30)",
  borderRadius: 20,
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
};
const GLASS_SIDEBAR = {
  background: "rgba(20, 15, 30, 0.35)",
  backdropFilter: "blur(32px) saturate(180%)",
  WebkitBackdropFilter: "blur(32px) saturate(180%)"
};
const PHASE_STYLE = { "BREAKOUT": { bg:`rgba(109, 97, 158, .25)`, color:PRIMARY_COLOR }, "ACCUMULATION": { bg:`rgba(255,255,255,.08)`, color:"rgba(255,255,255,.6)" }, "FADING": { bg:`rgba(244, 63, 94, .2)`, color:"#f43f5e" }, "CRASH RISK": { bg:`rgba(225, 29, 72, .25)`, color:"#e11d48" }, "EMERGING": { bg:`rgba(34, 197, 94, .2)`, color:"#22c55e" } };

const COINS = [
  {rank:1,name:"Dogecoin",ticker:"DOGE",score:91,delta:"+12",mentions:"28.4K",phase:"BREAKOUT"},
  {rank:2,name:"Pepe",ticker:"PEPE",score:84,delta:"+8",mentions:"19.1K",phase:"BREAKOUT"},
  {rank:3,name:"Shiba Inu",ticker:"SHIB",score:78,delta:"+5",mentions:"15.3K",phase:"ACCUMULATION"},
  {rank:4,name:"Dogwifhat",ticker:"WIF",score:72,delta:"+14",mentions:"11.8K",phase:"BREAKOUT"},
  {rank:5,name:"Neiro",ticker:"NEIRO",score:65,delta:"+21",mentions:"9.2K",phase:"EMERGING"},
  {rank:6,name:"Floki",ticker:"FLOKI",score:58,delta:"+3",mentions:"7.6K",phase:"ACCUMULATION"},
  {rank:7,name:"Bonk",ticker:"BONK",score:52,delta:"-4",mentions:"6.1K",phase:"FADING"},
  {rank:8,name:"Mog Coin",ticker:"MOG",score:21,delta:"-22",mentions:"1.4K",phase:"CRASH RISK"},
];

const ALERTS = [
  {coin:"PEPE", action:"Crash Risk", badge:"CRITICAL",detail:"ML >74% conf"},
  {coin:"DOGE", action:"Spike +340%", badge:"HIGH",detail:"X + Reddit"},
  {coin:"WIF", action:"Influencer Surge", badge:"HIGH",detail:"2.3M followers"},
  {coin:"NEIRO", action:"Emerging", badge:"MEDIUM",detail:"3 platforms"},
  {coin:"SHIB", action:"Sentiment Flip", badge:"MEDIUM",detail:"0.6 → 2.1"},
];

const TOASTS = [["Crash Risk","PEPE >74% confidence"],["Spike Detected","DOGE +340% mentions"],["Influencer","2.1M tweeted DOGE"],["Emerging","NEIRO 500 mentions/hr"]];

const mulish = e => ({fontFamily:MULISH,...e});
const mono = e => ({fontFamily:MONO,...e});
const neoBrutalism = e => ({fontFamily:NEO_FONT,...e});

// In-memory user database (simulates NeonDB)
let UsersDB = [
  { id: 1, username: 'arshawww', email: 'arshawww@cryso.io', password: '123456', createdAt: new Date() }
];

function LoadingScreen({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(6, 8, 15, 0.98)",
      backdropFilter: "blur(10px)",
      animation: "fadeOut 0.5s ease-out 1.0s forwards"
    }}>
      <div style={{ textAlign: "center", position: "relative" }}>
        {/* Rotating spinner */}
        <div style={{
          width: 80,
          height: 80,
          border: `3px solid ${PRIMARY_COLOR}15`,
          borderTop: `3px solid ${PRIMARY_COLOR}`,
          borderRadius: "50%",
          margin: "0 auto 32px",
          animation: "spin 2s linear infinite"
        }}/>
        
        {/* Neo Brutalism Text */}
        <div style={neoBrutalism({ 
          fontSize: 32, 
          color: PRIMARY_COLOR, 
          fontWeight: 700, 
          letterSpacing: "3px",
          marginBottom: 12,
          textShadow: `0 0 20px ${PRIMARY_COLOR}40`,
          textTransform: "uppercase"
        })}>
          CRYSO
        </div>
        
        {/* Subtitle */}
        <div style={neoBrutalism({ 
          fontSize: 11, 
          color: "rgba(255,255,255,.3)", 
          letterSpacing: "3px", 
          textTransform: "uppercase",
          fontWeight: 600
        })}>
          ▌ ▌ INITIALIZING ▌ ▌
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("arshawww");
  const [password, setPassword] = useState("123456");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate API call to NeonDB
    setTimeout(() => {
      try {
        if (isRegister) {
          // Create account
          if (!username || !email || !password) {
            throw new Error("All fields required");
          }
          if (UsersDB.find(u => u.username === username)) {
            throw new Error("Username already taken");
          }
          if (UsersDB.find(u => u.email === email)) {
            throw new Error("Email already registered");
          }
          
          const newUser = { 
            id: UsersDB.length + 1, 
            username, 
            email, 
            password,
            createdAt: new Date()
          };
          UsersDB.push(newUser);
          console.log("✅ Account created:", newUser);
          onLogin(newUser);
        } else {
          // Login
          const user = UsersDB.find(u => u.username === username && u.password === password);
          if (!user) {
            throw new Error("Invalid username or password");
          }
          console.log("✅ Login successful:", user);
          onLogin(user);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",background:"#0c0a0c"}}>
        <Threads
          color={[0.42745098039215684,0.3803921568627451,0.6196078431372549]}
          amplitude={1}
          distance={0.2}
          enableMouseInteraction
        />
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%, transparent, #0c0a0c 85%)",zIndex:1}}/>
      </div>
      <div style={{
        ...GLASS,
        width: "min(400px, 92vw)",
        padding: "40px 36px",
        zIndex: 1,
        animation: "slideIn .5s ease",
        background: "rgba(25, 18, 38, 0.30)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        borderTop: "1px solid rgba(255, 255, 255, 0.35)",
        borderRadius: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
      }}>
        <div style={mulish({fontSize:28,color:PRIMARY_COLOR,marginBottom:8,fontWeight:700,textAlign:"center"})}>Cryso</div>
        <div style={mulish({fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:30,textAlign:"center"})}>Crypto Intelligence Dashboard</div>
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}>
            <label style={mulish({fontSize:11,color:"rgba(255,255,255,.6)",display:"block",marginBottom:6,fontWeight:500})}>{isRegister ? "USERNAME" : "USERNAME"}</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => {setUsername(e.target.value); setError("");}} 
              placeholder={isRegister ? "choose a username" : "arshawww"} 
              disabled={loading} 
              style={{width:"100%",padding:"11px 13px",background:"rgba(109, 97, 158,.07)",border:`1px solid ${PRIMARY_COLOR}30`,borderRadius:8,color:"#fff",fontFamily:MULISH,fontSize:13,outline:"none",transition:"all .2s"}}
            />
          </div>
          
          {isRegister && (
            <div style={{marginBottom:14}}>
              <label style={mulish({fontSize:11,color:"rgba(255,255,255,.6)",display:"block",marginBottom:6,fontWeight:500})}>EMAIL</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="your@email.com" 
                disabled={loading}
                style={{width:"100%",padding:"11px 13px",background:"rgba(109, 97, 158,.07)",border:`1px solid ${PRIMARY_COLOR}30`,borderRadius:8,color:"#fff",fontFamily:MULISH,fontSize:13,outline:"none",transition:"all .2s"}}
              />
            </div>
          )}
          
          <div style={{marginBottom:24}}>
            <label style={mulish({fontSize:11,color:"rgba(255,255,255,.6)",display:"block",marginBottom:6,fontWeight:500})}>PASSWORD</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => {setPassword(e.target.value); setError("");}} 
              placeholder={isRegister ? "min 6 characters" : "••••••••"} 
              disabled={loading} 
              style={{width:"100%",padding:"11px 13px",background:"rgba(109, 97, 158,.07)",border:`1px solid ${PRIMARY_COLOR}30`,borderRadius:8,color:"#fff",fontFamily:MULISH,fontSize:13,outline:"none",transition:"all .2s"}}
            />
          </div>

          {error && <div style={mulish({fontSize:12,color:"#ff5555",marginBottom:16,textAlign:"center",fontWeight:500})}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              width:"100%",
              padding:"12px",
              background:PRIMARY_COLOR,
              color:"#fff",
              border:"none",
              borderRadius:8,
              fontFamily:MULISH,
              fontSize:14,
              fontWeight:600,
              cursor:loading?"not-allowed":"pointer",
              opacity:loading?0.6:1,
              transition:"all .3s",
              boxShadow:`0 0 20px ${PRIMARY_COLOR}40`
            }}
          >
            {loading ? "Processing..." : isRegister ? "CREATE ACCOUNT" : "LOGIN"}
          </button>
        </form>

        <div style={{textAlign:"center",marginTop:20}}>
          <button 
            onClick={() => {setIsRegister(!isRegister); setError(""); setPassword(""); setEmail(""); setUsername("");}} 
            style={{background:"none",border:"none",color:PRIMARY_COLOR,cursor:"pointer",fontFamily:MULISH,fontSize:12,textDecoration:"none",fontWeight:500}}
          >
            {isRegister ? "← Back to Login" : "Create New Account →"}
          </button>
        </div>

        <div style={mono({fontSize:10,color:"rgba(255,255,255,.3)",textAlign:"center",marginTop:20,borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:16})}>
          Demo Login:<br/>
          <span style={{color:PRIMARY_COLOR,fontWeight:600}}>arshawww</span> / <span style={{color:PRIMARY_COLOR,fontWeight:600}}>123456</span>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [ppm, setPpm] = useState(842);
  const [platCounts, setPlatCounts] = useState([72,36,17]);
  const [toastIdx, setToastIdx] = useState(0);
  const [toastVis, setToastVis] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [messages, setMessages] = useState([{type:"bot",text:"Hi! Ask about DOGE, PEPE, SHIB, WIF, NEIRO, FLOKI, BONK, or MOG!"}]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [messages]);

  useEffect(() => {
    const id = setInterval(() => {
      setPpm(v => Math.max(700, Math.min(1200, v + Math.round((Math.random()-0.48)*28))));
      const tw = 24000 + Math.round(Math.random()*8000);
      const rd = 11000 + Math.round(Math.random()*5000);
      const tg = 5000 + Math.round(Math.random()*3000);
      const tot = tw+rd+tg+1000;
      setPlatCounts([Math.round(tw/tot*100), Math.round(rd/tot*100), Math.round(tg/tot*100)]);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const show = () => {
      setToastIdx(i => (i+1) % TOASTS.length);
      setToastVis(true);
      setTimeout(() => setToastVis(false), 4200);
    };
    const t1 = setTimeout(show, 2500);
    const t2 = setInterval(show, 18000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, []);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, {type:"user",text:chatInput}]);
    const msg = chatInput.toLowerCase();
    let response = "Ask about specific coins like DOGE, PEPE, SHIB, WIF, NEIRO, FLOKI, BONK, or MOG!";
    
    if (msg.includes("doge")) response = "Dogecoin: A decentralized digital currency with strong community support.";
    else if (msg.includes("pepe")) response = "Pepe: A meme-based cryptocurrency launched on Solana.";
    else if (msg.includes("shib")) response = "Shiba Inu: An Ethereum-based meme token.";
    else if (msg.includes("wif")) response = "Dogwifhat: A Solana-based memecoin.";
    else if (msg.includes("price")) response = "Check the leaderboard for live prices!";
    else if (msg.includes("sentiment")) response = "Sentiment is GREED at 72/100. DOGE and PEPE in BREAKOUT.";
    
    setTimeout(() => {
      setMessages(prev => [...prev, {type:"bot",text:response}]);
    }, 400);
    setChatInput("");
  };

  const [tt, tb] = TOASTS[toastIdx];

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",background:"#0c0a0c"}}>
        <Threads
          color={[0.42745098039215684,0.3803921568627451,0.6196078431372549]}
          amplitude={1}
          distance={0.2}
          enableMouseInteraction
        />
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%, transparent, #0c0a0c 85%)",zIndex:1}}/>
      </div>
      <div style={{position:"relative",zIndex:1,display:"flex",height:"100vh",color:"#e2eaf5"}}>
        
        <aside style={{
          ...GLASS_SIDEBAR,
          width:240,
          minWidth:240,
          display:"flex",
          flexDirection:"column",
          borderRight:`1px solid ${PRIMARY_COLOR}1f`,
          position: isMobile ? "fixed" : "relative",
          left: isMobile && !sidebarOpen ? -240 : 0,
          height: "100%",
          zIndex: 100,
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {isMobile && sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)} 
              style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex: -1}}
            />
          )}
          <div style={{padding:"20px 15px 14px",borderBottom:`1px solid ${PRIMARY_COLOR}19`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={mulish({fontSize:20,letterSpacing:"1px",fontWeight:700,color:PRIMARY_COLOR})}>Cryso</div>
              <div style={mono({fontSize:7,color:`${PRIMARY_COLOR}59`,letterSpacing:"2px",marginTop:2})}>SOCIAL INTEL</div>
            </div>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{background:"none",border:"none",color:PRIMARY_COLOR,fontSize:20}}>×</button>
            )}
          </div>

          <nav style={{flex:1,padding:"8px 0"}}>
            {["Dashboard","Deep-Dive","Hype Map","Alerts"].map(label => (
              <div key={label} 
                className="nav-item"
                onClick={() => { setActiveNav(label); if(isMobile) setSidebarOpen(false); }} 
                style={{display:"flex",alignItems:"center",gap:8,padding:"12px 14px",cursor:"pointer",color:activeNav===label?PRIMARY_COLOR:"rgba(255,255,255,.3)",borderLeft:`2px solid ${activeNav===label?PRIMARY_COLOR:"transparent"}`,background:activeNav===label?`rgba(109, 97, 158, .05)`:"transparent"}}>
                <span style={{fontSize:12,width:16,textAlign:"center"}}>{activeNav===label?"◆":"◇"}</span>
                <span style={mono({fontSize:11, letterSpacing:"1px", fontWeight:activeNav===label?600:400})}>{label}</span>
              </div>
            ))}
          </nav>

          <div style={{padding:"10px 14px",borderTop:`1px solid ${PRIMARY_COLOR}19`}}>
            <div style={mulish({fontSize:11,color:"rgba(255,255,255,.6)",marginBottom:8,fontWeight:500})}>{user.username}</div>
            <div style={mono({fontSize:9,color:"rgba(255,255,255,.3)",marginBottom:10})}>{user.email}</div>
            <button onClick={onLogout} style={{width:"100%",padding:"9px",background:`rgba(109, 97, 158, 0.15)`,border:`1px solid ${PRIMARY_COLOR}50`,borderRadius:8,color:PRIMARY_COLOR,fontFamily:MULISH,fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:"0.5px",transition:"all 0.2s"}}>Sign Out</button>
          </div>
        </aside>

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <header style={{...GLASS_SIDEBAR,borderBottom:`1px solid ${PRIMARY_COLOR}19`,padding:isMobile?"12px 14px":"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} style={{background:"none",border:"none",color:PRIMARY_COLOR,fontSize:20,cursor:"pointer"}}>☰</button>
              )}
              <div style={mulish({fontSize:isMobile?16:18,color:"#fff",fontWeight:600})}>Command Center</div>
            </div>
            <div style={{display:"flex",gap:isMobile?12:24}}>
              {[{label:"PPM",val:ppm.toLocaleString()},{label:"Alerts",val:"3"},{label:"Mood",val:"GREED"}].map((s, idx) => (
                <div key={s.label} style={{display:(isMobile && idx > 0) ? "none" : "flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                  <span style={mono({fontSize:7,color:"rgba(255,255,255,.2)",letterSpacing:"1.5px",textTransform:"uppercase"})}>{s.label}</span>
                  <span style={mulish({fontSize:isMobile?14:16,color:PRIMARY_COLOR,fontWeight:600})}>{s.val}</span>
                </div>
              ))}
            </div>
          </header>

          <div style={{flex:1,overflowY:"auto",padding:isMobile?"14px":"18px 22px"}}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: isMobile ? 12 : 24,
              marginBottom: 24,
              paddingBottom: 20,
              borderBottom: "1px solid rgba(255,255,255,.06)"
            }}>
              {[{label:"Sentiment",val:"GREED",sub:"72/100"},{label:"Posts/Hour",val:"50.4K",sub:"▲+18%"},{label:"Breakouts",val:"4",sub:"▲+2 in 4H"},{label:"Crash Risk",val:"1",sub:"High"}].map((s,i) => (
                <div key={s.label} style={{
                  display:"flex",
                  flexDirection:"column",
                  gap:4,
                  padding: isMobile ? "0" : "0 12px",
                  borderLeft: (!isMobile && i > 0) ? "1px solid rgba(255,255,255,0.08)" : "none"
                }}>
                  <span style={mono({fontSize:8,color:"rgba(255,255,255,.3)",letterSpacing:"1px",textTransform:"uppercase"})}>{s.label}</span>
                  <span style={mulish({fontSize:isMobile?20:28,color:PRIMARY_COLOR,fontWeight:800,lineHeight:1})}>{s.val}</span>
                  <span style={mono({fontSize:10,color:"rgba(255,255,255,.45)"})}>{s.sub}</span>
                </div>
              ))}
            </div>

            {activeNav === "Dashboard" && (
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.7fr 1fr",gap:16}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{color:PRIMARY_COLOR,fontSize:8}}>●</span>
                    <span style={mulish({fontSize:11,color:PRIMARY_COLOR,fontWeight:600})}>Trending Coins</span>
                  </div>
                  <div style={{...GLASS, overflowX: "auto", position: "relative", width: "100%", border:`1px solid ${PRIMARY_COLOR}10`}}>
                    <div style={{
                      display:"grid",
                      gridTemplateColumns: isMobile ? "30px 1fr 60px 50px" : "30px 1fr 80px 60px 80px 100px",
                      gap:12,
                      padding:"10px 16px",
                      background:"rgba(255,255,255,.02)",
                      ...mono({fontSize:8,color:"rgba(255,255,255,.25)",textTransform:"uppercase",letterSpacing:"1px"}),
                      minWidth: isMobile ? "auto" : 600
                    }}>
                      {["#","Coin","Score","1H","Mentions","Phase"].filter((h, idx) => !isMobile || (idx !== 4 && idx !== 5)).map(h => <span key={h}>{h}</span>)}
                    </div>
                    {COINS.map(c => (
                      <div key={c.ticker} 
                        className="coin-row"
                        style={{
                        display:"grid",
                        gridTemplateColumns: isMobile ? "30px 1fr 60px 50px" : "30px 1fr 80px 60px 80px 100px",
                        gap:12,
                        alignItems:"center",
                        padding:"14px 16px",
                        borderBottom:"1px solid rgba(255,255,255,.04)",
                        minWidth: isMobile ? "auto" : 600,
                        transition: "background 0.2s",
                        cursor: "pointer"
                      }}>
                        <span style={mono({fontSize:11,color:"rgba(255,255,255,.15)"})}>{c.rank}</span>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:28,height:28,borderRadius:8,background:`${PRIMARY_COLOR}15`,display:"flex",alignItems:"center",justifyContent:"center", fontSize:10, color:PRIMARY_COLOR, fontWeight:700}}>{c.ticker[0]}</div>
                          <div><div style={mulish({fontSize:13,color:"#fff",fontWeight:600})}>{c.name}</div><div style={mono({fontSize:8,color:"rgba(255,255,255,.3)"})}>${c.ticker}</div></div>
                        </div>
                        <span style={mulish({fontSize:16,color:PRIMARY_COLOR,fontWeight:700})}>{c.score}</span>
                        <span style={mono({fontSize:11,color:c.delta.startsWith("+")?PRIMARY_COLOR:"#f43f5e",fontWeight:600})}>{c.delta}</span>
                        {!isMobile && <span style={mono({fontSize:11,color:"rgba(255,255,255,.4)"})}>{c.mentions}</span>}
                        {!isMobile && <span style={{...mono({fontSize:8,fontWeight:600}),padding:"4px 10px",borderRadius:4,background:PHASE_STYLE[c.phase].bg,color:PHASE_STYLE[c.phase].color,textAlign:"center",textTransform:"uppercase"}}>{c.phase}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{color:PRIMARY_COLOR,fontSize:8}}>●</span>
                      <span style={mulish({fontSize:11,color:PRIMARY_COLOR,fontWeight:600})}>Live Alerts</span>
                    </div>
                    <div style={GLASS}>
                      {ALERTS.map((a,i) => (
                        <div key={i} style={{display:"flex",gap:9,padding:"10px 14px",borderBottom:i<ALERTS.length-1?`1px solid rgba(255,255,255,.04)`:"none"}}>
                          <span style={{fontSize:13}}>●</span>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",gap:6}}>
                              <span style={mulish({fontSize:12,color:PRIMARY_COLOR,fontWeight:600})}>${a.coin}</span>
                              <span style={mono({fontSize:10,color:"rgba(255,255,255,.6)"})}>{a.action}</span>
                            </div>
                            <div style={{display:"flex",gap:6,alignItems:"center",marginTop:3}}>
                              <span style={{...mono({fontSize:7,fontWeight:500}),padding:"1px 5px",borderRadius:2,background:`${PRIMARY_COLOR}26`,color:PRIMARY_COLOR}}>{a.badge}</span>
                              <span style={mono({fontSize:7,color:"rgba(255,255,255,.2)"})}>{a.detail}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{color:PRIMARY_COLOR,fontSize:8}}>●</span>
                      <span style={mulish({fontSize:11,color:PRIMARY_COLOR,fontWeight:600})}>Platforms</span>
                    </div>
                    <div style={GLASS}>
                      <div style={{padding:"13px 14px",display:"flex",flexDirection:"column",gap:11}}>
                        {[{name:"Twitter (X)",pct:platCounts[0]},{name:"Reddit",pct:platCounts[1]},{name:"Telegram",pct:platCounts[2]},{name:"TikTok",pct:2.5}].map(p => (
                          <div key={p.name}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={mono({fontSize:10,color:"rgba(255,255,255,.44)"})}>{p.name}</span>
                            </div>
                            <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden"}}>
                              <div style={{width:`${p.pct}%`,height:"100%",background:PRIMARY_COLOR}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeNav === "Deep-Dive" && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{color:PRIMARY_COLOR,fontSize:8}}>●</span>
                  <span style={mulish({fontSize:11,color:PRIMARY_COLOR,fontWeight:600})}>Deep Dive Analysis</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                  {[{coin:"DOGE",sentiment:"Bullish",momentum:85},{coin:"PEPE",sentiment:"Mixed",momentum:72},{coin:"SHIB",sentiment:"Neutral",momentum:58},{coin:"WIF",sentiment:"Bullish",momentum:79}].map(item => (
                    <div key={item.coin} style={{...GLASS,padding:16}}>
                      <div style={mulish({fontSize:13,color:PRIMARY_COLOR,marginBottom:8,fontWeight:600})}>{item.coin}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        <div><div style={mono({fontSize:8,color:"rgba(255,255,255,.4)",marginBottom:4})}>Sentiment</div><div style={mulish({fontSize:12,color:"#fff",fontWeight:500})}>{item.sentiment}</div></div>
                        <div><div style={mono({fontSize:8,color:"rgba(255,255,255,.4)",marginBottom:4})}>Momentum</div><div style={{width:"100%",height:4,background:"rgba(255,255,255,.06)",borderRadius:2}}><div style={{width:`${item.momentum}%`,height:"100%",background:PRIMARY_COLOR}}/></div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeNav === "Hype Map" && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{color:PRIMARY_COLOR,fontSize:8}}>●</span>
                  <span style={mulish({fontSize:11,color:PRIMARY_COLOR,fontWeight:600})}>Hype Map - Social Distribution</span>
                </div>
                <div style={{...GLASS,padding:16}}>
                  {[{platform:"Twitter",percentage:45},{platform:"Reddit",percentage:28},{platform:"Telegram",percentage:18},{platform:"TikTok",percentage:9}].map((s,i) => (
                    <div key={i} style={{marginBottom:i<3?12:0,paddingBottom:i<3?12:0,borderBottom:i<3?`1px solid ${PRIMARY_COLOR}19`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={mulish({fontSize:11,color:"#fff",fontWeight:500})}>{s.platform}</span>
                        <span style={mono({fontSize:10,color:PRIMARY_COLOR,fontWeight:600})}>{s.percentage}%</span>
                      </div>
                      <div style={{width:"100%",height:6,background:"rgba(255,255,255,.06)",borderRadius:3}}><div style={{width:`${s.percentage}%`,height:"100%",background:PRIMARY_COLOR}}/></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeNav === "Alerts" && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{color:PRIMARY_COLOR,fontSize:8}}>●</span>
                  <span style={mulish({fontSize:11,color:PRIMARY_COLOR,fontWeight:600})}>All Critical Alerts</span>
                </div>
                <div style={GLASS}>
                  {ALERTS.map((a,i) => (
                    <div key={i} style={{display:"flex",gap:9,padding:"10px 14px",borderBottom:i<ALERTS.length-1?`1px solid rgba(255,255,255,.04)`:"none"}}>
                      <span style={{fontSize:13}}>●</span>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:6}}>
                          <span style={mulish({fontSize:12,color:PRIMARY_COLOR,fontWeight:600})}>${a.coin}</span>
                          <span style={mono({fontSize:10,color:"rgba(255,255,255,.6)"})}>{a.action}</span>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center",marginTop:3}}>
                          <span style={{...mono({fontSize:7,fontWeight:500}),padding:"1px 5px",borderRadius:2,background:`${PRIMARY_COLOR}26`,color:PRIMARY_COLOR}}>{a.badge}</span>
                          <span style={mono({fontSize:7,color:"rgba(255,255,255,.2)"})}>{a.detail}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{position:"fixed",bottom:isMobile?10:20,right:isMobile?10:20,zIndex:50}}>
        {chatOpen && (
          <div style={{
            ...GLASS,
            width: isMobile ? "calc(100vw - 20px)" : 320,
            height: isMobile ? 380 : 420,
            borderRadius: 14,
            display:"flex",
            flexDirection:"column",
            marginBottom:12
          }}>
            <div style={{padding:14,borderBottom:`1px solid ${PRIMARY_COLOR}19`,display:"flex",justifyContent:"space-between"}}>
              <div style={mulish({fontSize:14,color:"#fff",fontWeight:600})}>Crypto Assistant</div>
              <button onClick={() => setChatOpen(false)} style={{background:"none",border:"none",color:PRIMARY_COLOR,fontSize:16,cursor:"pointer"}}>×</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:10}}>
              {messages.map((msg,i) => (
                <div key={i} style={{display:"flex",justifyContent:msg.type==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:8,background:msg.type==="user"?PRIMARY_COLOR:`rgba(109, 97, 158, .1)`,color:msg.type==="user"?"#fff":"rgba(255,255,255,.8)",fontSize:12,fontFamily:MULISH}}>{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef}/>
            </div>
            <div style={{padding:10,borderTop:`1px solid ${PRIMARY_COLOR}19`,display:"flex",gap:8}}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key==="Enter" && handleChatSend()} placeholder="Ask..." style={{flex:1,padding:"8px 10px",background:`rgba(109, 97, 158, .08)`,border:`1px solid ${PRIMARY_COLOR}40`,borderRadius:6,color:"#fff",fontFamily:MULISH,fontSize:12,outline:"none"}}/>
              <button onClick={handleChatSend} style={{padding:"8px 12px",background:PRIMARY_COLOR,border:"none",borderRadius:6,cursor:"pointer",color:"#fff",fontWeight:600}}>Send</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} style={{width:isMobile?48:56,height:isMobile?48:56,borderRadius:"50%",background:PRIMARY_COLOR,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?20:24,color:"#fff",fontWeight:"bold",boxShadow:`0 0 20px ${PRIMARY_COLOR}80`}}>
          {chatOpen?"×":"◆"}
        </button>
      </div>

      {toastVis && <div style={{position:"fixed",bottom:isMobile?70:90,right:isMobile?10:20,maxWidth:isMobile?200:250,background:"rgba(6,8,18,.88)",border:`1px solid ${PRIMARY_COLOR}66`,borderRadius:12,padding:"12px 15px",animation:"toastIn .25s ease",zIndex:999}}>
        <div style={mulish({fontSize:12,color:PRIMARY_COLOR,marginBottom:3,fontWeight:600})}>{tt}</div>
        <div style={mono({fontSize:8,color:"rgba(255,255,255,.36)"})}>{tb}</div>
      </div>}
    </>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (userData) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setUser(userData);
      setIsLoggedIn(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <LoadingScreen isVisible={isLoading} />
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={() => { setIsLoggedIn(false); setUser(null); }} />
      )}
    </>
  );
}
