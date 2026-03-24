import { useEffect, useRef, useState, useCallback } from "react";
import Dither from "./components/Dither/Dither";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, YAxis, BarChart, Bar, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const REACT_ENV_URL = process.env.REACT_APP_API_URL;
const BASE_URL = REACT_ENV_URL ? (REACT_ENV_URL.endsWith('/') ? REACT_ENV_URL.slice(0, -1) : REACT_ENV_URL) : 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

const MULISH = "'Mulish', sans-serif";
const MONO = "'Courier New', monospace";
const PRIMARY_COLOR = "#FF0090";

// Neo Brutalism Font for Loading
const NEO_FONT = "'JetBrains Mono', 'Courier New', monospace";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; background: #06080f; }
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-thumb { background: rgba(255, 0, 144, 0.25); }
  @keyframes ldot { 0%,100% { opacity:1; box-shadow:0 0 5px #FF0090; } 50% { opacity:.3; } }
  @keyframes toastIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; } }
  @keyframes slideIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes chatPopup {
    0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
`;

const GLASS = { background: "rgba(255,255,255,.055)", backdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.25)" };
const GLASS_SIDEBAR = { background: "rgba(6,8,18,.52)", backdropFilter: "blur(40px)" };
const PHASE_STYLE = { "BREAKOUT": { bg:`rgba(255, 0, 144, .1)`, color:PRIMARY_COLOR }, "ACCUMULATION": { bg:`rgba(255, 0, 144, .08)`, color:PRIMARY_COLOR }, "FADING": { bg:`rgba(255, 0, 144, .08)`, color:PRIMARY_COLOR }, "CRASH RISK": { bg:`rgba(255, 0, 144, .1)`, color:PRIMARY_COLOR }, "EMERGING": { bg:`rgba(255, 0, 144, .1)`, color:PRIMARY_COLOR } };

const COINS_FALLBACK = [
  {rank:1,name:"Dogecoin",ticker:"DOGE",score:91,delta:"+12",mentions:"28.4K",phase:"BREAKOUT"},
  {rank:2,name:"Pepe",ticker:"PEPE",score:84,delta:"+8",mentions:"19.1K",phase:"BREAKOUT"},
  {rank:3,name:"Shiba Inu",ticker:"SHIB",score:78,delta:"+5",mentions:"15.3K",phase:"ACCUMULATION"},
  {rank:4,name:"Dogwifhat",ticker:"WIF",score:72,delta:"+14",mentions:"11.8K",phase:"BREAKOUT"},
  {rank:5,name:"Neiro",ticker:"NEIRO",score:65,delta:"+21",mentions:"9.2K",phase:"EMERGING"},
  {rank:6,name:"Floki",ticker:"FLOKI",score:58,delta:"+3",mentions:"7.6K",phase:"ACCUMULATION"},
  {rank:7,name:"Bonk",ticker:"BONK",score:52,delta:"-4",mentions:"6.1K",phase:"FADING"},
  {rank:8,name:"Mog Coin",ticker:"MOG",score:21,delta:"-22",mentions:"1.4K",phase:"CRASH RISK"},
];

const ALERTS_FALLBACK = [
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

// Auth is now fully handled by the Node/NeonDB backend



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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!username || !email || !password) throw new Error("All fields required");
        
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        
        console.log("✅ Account created in NeonDB:", data.user);
        localStorage.setItem('cryso_token', data.token);
        onLogin(data.user);
      } else {
        if (!username || !password) throw new Error("Username and password required");
        
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        
        console.log("✅ Login successful:", data.user);
        localStorage.setItem('cryso_token', data.token);
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{...GLASS,width:420,padding:40,zIndex:1,animation:"slideIn .5s ease"}}>
        <div style={mulish({fontSize:28,color:PRIMARY_COLOR,marginBottom:8,fontWeight:700,textAlign:"center"})}>Cryso</div>
        <div style={mulish({fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:30,textAlign:"center"})}>Crypto Intelligence Dashboard</div>
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}>
            <label style={mulish({fontSize:11,color:"rgba(255,255,255,.6)",display:"block",marginBottom:6,fontWeight:500})}>{isRegister ? "USERNAME" : "USERNAME"}</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => {setUsername(e.target.value); setError("");}} 
              placeholder={isRegister ? "choose a username" : "your username"} 
              disabled={loading} 
              style={{width:"100%",padding:"11px 13px",background:"rgba(255,0,144,.07)",border:`1px solid ${PRIMARY_COLOR}30`,borderRadius:8,color:"#fff",fontFamily:MULISH,fontSize:13,outline:"none",transition:"all .2s"}}
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
                style={{width:"100%",padding:"11px 13px",background:"rgba(255,0,144,.07)",border:`1px solid ${PRIMARY_COLOR}30`,borderRadius:8,color:"#fff",fontFamily:MULISH,fontSize:13,outline:"none",transition:"all .2s"}}
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
              style={{width:"100%",padding:"11px 13px",background:"rgba(255,0,144,.07)",border:`1px solid ${PRIMARY_COLOR}30`,borderRadius:8,color:"#fff",fontFamily:MULISH,fontSize:13,outline:"none",transition:"all .2s"}}
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

      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  
  // Live Data State
  const [isLive, setIsLive] = useState(false);
  const [coins, setCoins] = useState(COINS_FALLBACK);
  const [alerts, setAlerts] = useState(ALERTS_FALLBACK);
  const [stats, setStats] = useState({
    postsPerMinute: 842,
    postsPerHour: 50400,
    sentiment: 72,
    sentimentLabel: "GREED",
    breakouts: 4,
    crashRisks: 1
  });

  const [platCounts, setPlatCounts] = useState([72,36,17]);
  const [lineData, setLineData] = useState(
    Array.from({length: 20}).map((_, i) => ({
      time: new Date(Date.now() - (20-i)*5000).toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}),
      score: 60 + Math.random()*15
    }))
  );
  const [toastIdx, setToastIdx] = useState(0);
  const [toastVis, setToastVis] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{type:"bot",text:"Hi! I'm your AI assistant. Ask me anything!"}]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [messages]);

  // Fetch live Telegram Data
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/social/stats`).catch(() => null),
          fetch(`${API_URL}/social/alerts`).catch(() => null)
        ]);

        if (statsRes && statsRes.ok) {
          const data = await statsRes.json();
          setIsLive(data.live);
          if (data.live) {
            setCoins(data.coins);
            setStats({
              postsPerMinute: data.postsPerMinute,
              postsPerHour: data.postsPerHour,
              sentiment: data.sentiment,
              sentimentLabel: data.sentimentLabel,
              breakouts: data.breakouts,
              crashRisks: data.crashRisks
            });
            setLineData(prev => {
              const now = new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
              const updated = [...prev, { time: now, score: data.sentiment }];
              return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
            });
          } else {
            setCoins(COINS_FALLBACK); // Fallback if backend connected but Telegram not authorized
          }
        }
        
        if (alertsRes && alertsRes.ok) {
          const alertData = await alertsRes.json();
          if (alertData.length > 0) {
            setAlerts(alertData.slice(0, 5)); // show top 5 live alerts
          } else {
            setAlerts(ALERTS_FALLBACK);
          }
        }
      } catch (e) {
        setIsLive(false);
        setCoins(COINS_FALLBACK);
      }
    };

    fetchLiveStats(); // initial fetch
    const id = setInterval(fetchLiveStats, 5000); // Poll every 5 seconds
    return () => clearInterval(id);
  }, []);

  // Platform simulation (Telegram ratio goes up when live)
  useEffect(() => {
    const id = setInterval(() => {
      const tw = 24000 + Math.round(Math.random()*8000);
      const rd = 11000 + Math.round(Math.random()*5000);
      const tg = isLive ? (15000 + Math.round(Math.random()*10000)) : (5000 + Math.round(Math.random()*3000));
      const tot = tw+rd+tg+1000;
      setPlatCounts([Math.round(tw/tot*100), Math.round(rd/tot*100), Math.round(tg/tot*100)]);
    }, 3200);
    return () => clearInterval(id);
  }, [isLive]);

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

  const smartCryptoReply = useCallback((input) => {
    const q = input.toLowerCase();
    if (q.match(/\b(doge|dogecoin)\b/)) return "🐕 **Dogecoin (DOGE)** is currently BREAKOUT phase with a score of 91. It has 28.4K mentions in the last hour with a +12 delta. X and Reddit are buzzing — influencer with 2.1M followers just tweeted about it. High momentum play right now!";
    if (q.match(/\b(pepe)\b/)) return "🐸 **PEPE** is showing BREAKOUT signals (score: 84, +8 delta, 19.1K mentions), BUT our ML model flags a >74% **crash risk** probability. This is a CRITICAL alert — exercise extreme caution before entering. The hype may be manufactured.";
    if (q.match(/\b(shib|shiba)\b/)) return "🐶 **Shiba Inu (SHIB)** is in ACCUMULATION phase (score: 78, +5 delta, 15.3K mentions). Sentiment has flipped from 0.6 → 2.1 — a healthy accumulation signal. No immediate crash indicators, but watch DOGE for correlation.";
    if (q.match(/\b(wif|dogwifhat)\b/)) return "🎩 **Dogwifhat (WIF)** is BREAKOUT territory (score: 72, +14 delta, 11.8K mentions). An influencer with 2.3M followers just surged mentions — HIGH alert. If this sustains over the next 2 hours, expect a major price movement.";
    if (q.match(/\b(bonk)\b/)) return "🔨 **BONK** is FADING (score: 52, -4 delta, 6.1K mentions). Momentum is declining. Unless a catalyst drops in the next few hours, this looks like an exit point rather than an entry.";
    if (q.match(/\b(mog|mog coin)\b/)) return "⚠️ **Mog Coin (MOG)** is in CRASH RISK territory — score only 21, -22 delta, only 1.4K mentions. This is the most bearish coin on the board right now. Avoid entry, consider exit if holding.";
    if (q.match(/\b(neiro)\b/)) return "⚡ **NEIRO** is EMERGING (score: 65, +21 delta, 9.2K mentions). It's spreading across 3 platforms — early signal. The +21 delta is notable. This could be the next breakout, but still early — watch for confirmation.";
    if (q.match(/\b(floki)\b/)) return "🧙 **FLOKI** is in ACCUMULATION (score: 58, +3 delta, 7.6K mentions). Steady accumulation, no hype spike yet. Consider watching for a breakout catalyst.";
    if (q.match(/\b(top|best|trending|hottest|which coin)\b/)) return "🔥 **Top Trending Right Now:**\n1. 🥇 DOGE — Score 91, BREAKOUT (+12 delta)\n2. 🥈 PEPE — Score 84, BREAKOUT (⚠️ crash risk ML flag)\n3. 🥉 SHIB — Score 78, ACCUMULATION\n4. WIF — Score 72, BREAKOUT (influencer surge)\n5. NEIRO — Score 65, EMERGING\n\nDOGE is the strongest momentum play right now!";
    if (q.match(/\b(crash|risky|avoid|dangerous)\b/)) return "🚨 **Crash Risk Coins Right Now:**\n• **PEPE** — ML model >74% crash confidence (CRITICAL)\n• **MOG** — Score 21, -22 delta (CRASH RISK phase)\n\nStay away from these unless you have a very short-term exit strategy. The rest of the board is mostly bullish.";
    if (q.match(/\b(sentiment|mood|market|overall)\b/)) return "📊 **Overall Market Sentiment: GREED (72/100)**\n\n• Posts/Hour: 50.4K (▲+18%)\n• Breakouts: 4 coins (+2 in last 4H)\n• Crash Risks: 1 high-confidence flag\n• Platform split: Twitter 45%, Reddit 28%, Telegram 18%\n\nThe market is in greed territory — momentum is strong but stay alert for reversals.";
    if (q.match(/\b(alert|alerts|warning)\b/)) return "🔔 **Active Alerts:**\n• [CRITICAL] PEPE — Crash Risk >74% ML confidence\n• [HIGH] DOGE — Spike +340%, X + Reddit activity\n• [HIGH] WIF — Influencer Surge, 2.3M follower account\n• [MEDIUM] NEIRO — Emerging across 3 platforms\n• [MEDIUM] SHIB — Sentiment flip 0.6 → 2.1\n\nCheck the Alerts tab for full details.";
    if (q.match(/\b(twitter|reddit|telegram|platform)\b/)) return "📱 **Platform Breakdown (Live):**\n• Twitter (X): ~45% of volume — major driver\n• Reddit: ~28% — strong community activity\n• Telegram: ~18% — whale group signals\n• TikTok: ~9% — retail FOMO zone\n\nTwitter is the leading indicator. When Twitter moves first, price typically follows within 1-4 hours.";
    if (q.match(/\b(buy|should i buy|invest|entry)\b/)) return "💡 **Cryso is an intelligence tool, not financial advice.** That said, based on current signals:\n\n✅ Strong momentum: DOGE, WIF\n⚡ Early entry opportunity: NEIRO (watch for confirmation)\n⚠️ High risk/high reward: PEPE (but crash flag active)\n❌ Avoid: MOG, be cautious of BONK\n\nAlways DYOR and manage your risk!";
    if (q.match(/\b(help|what can you|features|commands)\b/)) return "🤖 **I can help you with:**\n• Coin analysis (ask about DOGE, PEPE, SHIB, WIF, etc.)\n• Market sentiment & overall mood\n• Active alerts & crash risk warnings\n• Platform breakdown (Twitter, Reddit, Telegram)\n• Buy/sell signals (not financial advice!)\n• Trending coins right now\n\nJust ask naturally — e.g. \"What's happening with DOGE?\" or \"Which coins should I avoid?\"";
    
    // Greeting check moved to the bottom so "Hi, what about DOGE?" isn't swallowed by the greeting response!
    if (q.match(/^(hi|hello|hey|sup|what'?s up|greet)\b/)) return "Hey! 👋 I'm your Cryso crypto intelligence assistant. Ask me about trending coins, market sentiment, alerts, or anything crypto!";
    
    const cryptoTerms = q.match(/\b(crypto|coin|token|blockchain|defi|nft|price|pump|dump)\b/);
    if (cryptoTerms) return "Great question about crypto! Based on current Cryso data, the market is in GREED mode (72/100) with 4 active breakouts. DOGE leads with 91/100 sentiment score. Want specific analysis on any coin? Just ask — DOGE, PEPE, SHIB, WIF, NEIRO, FLOKI, BONK, or MOG!";
    return "I'm your Cryso crypto intelligence assistant! I specialize in meme coin sentiment analysis. Try asking:\n• \"What's trending right now?\"\n• \"Tell me about DOGE\"\n• \"Which coins are crash risks?\"\n• \"What's the overall market sentiment?\"";
  }, []);

  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || isTyping) return;
    const userText = chatInput;
    setMessages(prev => [...prev, {type:"user", text:userText}]);
    setChatInput("");
    setIsTyping(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const apiMessages = [
        { role: "system", content: "You are a helpful crypto intelligence assistant for the Cryso platform specializing in meme coin sentiment analysis." },
        ...messages.map(m => ({ role: m.type === "bot" ? "assistant" : "user", content: m.text })),
        { role: "user", content: userText }
      ];
      const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gemma3:1b", messages: apiMessages, stream: false }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      setMessages(prev => [...prev, {type:"bot", text:data.message.content}]);
    } catch (err) {
      // Fallback to built-in smart crypto intelligence
      await new Promise(r => setTimeout(r, 600 + Math.random()*800));
      const reply = smartCryptoReply(userText);
      setMessages(prev => [...prev, {type:"bot", text:reply}]);
    } finally {
      setIsTyping(false);
    }
  }, [chatInput, isTyping, messages, smartCryptoReply]);

  const [tt, tb] = TOASTS[toastIdx];

  return (
    <>
      <div style={{position:"relative",zIndex:1,display:"flex",height:"100vh",color:"#e2eaf5"}}>
        
        <aside style={{...GLASS_SIDEBAR,width:240,minWidth:240,display:"flex",flexDirection:"column",borderRight:`1px solid ${PRIMARY_COLOR}1f`}}>
          <div style={{padding:"18px 15px 14px",borderBottom:`1px solid ${PRIMARY_COLOR}19`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:PRIMARY_COLOR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff",fontWeight:"bold"}}>C</div>
            <div>
              <div style={mulish({fontSize:17,letterSpacing:".5px",fontWeight:600,color:PRIMARY_COLOR})}>Cryso</div>
              <div style={mono({fontSize:7,color:`${PRIMARY_COLOR}59`,letterSpacing:"2px",marginTop:2})}>SOCIAL INTEL</div>
            </div>
          </div>

          <nav style={{flex:1,padding:"8px 0"}}>
            {["Dashboard","Deep-Dive","Hype Map","Alerts"].map(label => (
              <div key={label} onClick={() => setActiveNav(label)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",color:activeNav===label?PRIMARY_COLOR:"rgba(255,255,255,.3)",borderLeft:`2px solid ${activeNav===label?PRIMARY_COLOR:"transparent"}`,background:activeNav===label?`rgba(255, 0, 144, .05)`:"transparent",transition:"all .15s"}}>
                <span style={{fontSize:12,width:16,textAlign:"center"}}>●</span>
                <span style={mono({fontSize:11})}>{label}</span>
              </div>
            ))}
          </nav>

          <div style={{padding:"10px 14px",borderTop:`1px solid ${PRIMARY_COLOR}19`}}>
            <div style={mulish({fontSize:11,color:"rgba(255,255,255,.6)",marginBottom:8,fontWeight:500})}>{user.username}</div>
            <div style={mono({fontSize:9,color:"rgba(255,255,255,.3)",marginBottom:10})}>{user.email}</div>
            <button onClick={onLogout} style={{width:"100%",padding:"8px",background:`rgba(255, 0, 144, .15)`,border:`1px solid ${PRIMARY_COLOR}40`,borderRadius:6,color:PRIMARY_COLOR,fontFamily:MULISH,fontSize:11,fontWeight:600,cursor:"pointer"}}>Logout</button>
          </div>
        </aside>

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <header style={{...GLASS_SIDEBAR,borderBottom:`1px solid ${PRIMARY_COLOR}19`,padding:"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={mulish({fontSize:18,color:"#fff",fontWeight:600})}>Command Center</div>
              {isLive ? (
                <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0, 255, 144, 0.1)",padding:"4px 10px",borderRadius:20,border:"1px solid rgba(0, 255, 144, 0.3)"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#00FF90",boxShadow:"0 0 8px #00FF90",animation:"ldot 1.5s infinite"}}/>
                  <span style={mono({fontSize:9,color:"#00FF90",fontWeight:600,letterSpacing:"1px"})}>SOCIAL LIVE</span>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255, 255, 255, 0.05)",padding:"4px 10px",borderRadius:20,border:"1px solid rgba(255, 255, 255, 0.1)"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#666"}}/>
                  <span style={mono({fontSize:9,color:"#999",fontWeight:600,letterSpacing:"1px"})}>STANDBY</span>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:24}}>
              {[{label:"Posts/Min",val:stats.postsPerMinute.toLocaleString()},{label:"Alerts",val:alerts.length.toString()},{label:"Mood",val:stats.sentimentLabel}].map(s => (
                <div key={s.label} style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                  <span style={mono({fontSize:7,color:"rgba(255,255,255,.2)",letterSpacing:"1.5px",textTransform:"uppercase"})}>{s.label}</span>
                  <span style={mulish({fontSize:16,color:PRIMARY_COLOR,fontWeight:600})}>{s.val}</span>
                </div>
              ))}
            </div>
          </header>

          <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
            <div style={{display:"flex",gap:28,marginBottom:18,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              {[{label:"Sentiment",val:stats.sentimentLabel,sub:`${stats.sentiment}/100`},{label:"Posts/Hour",val:isLive ? stats.postsPerHour.toLocaleString() : "50.4K",sub:"Live Total"},{label:"Breakouts",val:stats.breakouts.toString(),sub:`Total Active`},{label:"Crash Risk",val:stats.crashRisks.toString(),sub:stats.crashRisks > 0 ? "High" : "Low"}].map((s,i) => (
                <div key={s.label} style={{display:"flex",alignItems:"center",gap:28}}>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <span style={mono({fontSize:7,color:"rgba(255,255,255,.22)",textTransform:"uppercase"})}>{s.label}</span>
                    <span style={mulish({fontSize:26,color:PRIMARY_COLOR,fontWeight:700})}>{s.val}</span>
                    <span style={mono({fontSize:9,color:"rgba(255,255,255,.4)"})}>{s.sub}</span>
                  </div>
                  {i<3 && <div style={{width:1,background:"rgba(255,255,255,.07)",height:60}}/>}
                </div>
              ))}
            </div>

            {activeNav === "Dashboard" && (
              <div style={{display:"grid",gridTemplateColumns:"1.7fr 1fr",gap:16}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{color:PRIMARY_COLOR,fontSize:8}}>●</span>
                    <span style={mulish({fontSize:11,color:PRIMARY_COLOR,fontWeight:600})}>Trending Coins {isLive && "(LIVE)"}</span>
                  </div>
                  <div style={GLASS}>
                    <div style={{display:"grid",gridTemplateColumns:"22px 1fr 74px 46px 68px 94px",gap:6,padding:"6px 14px",background:"rgba(0,0,0,.16)",...mono({fontSize:7,color:"rgba(255,255,255,.16)",textTransform:"uppercase"})}}>
                      {["#","Coin","Score","1H","Mentions","Phase"].map(h => <span key={h}>{h}</span>)}
                    </div>
                    {coins.map(c => (
                      <div key={c.ticker} style={{display:"grid",gridTemplateColumns:"22px 1fr 74px 46px 68px 94px",gap:6,alignItems:"center",padding:"9px 14px",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                        <span style={mono({fontSize:9,color:"rgba(255,255,255,.16)"})}>{c.rank}</span>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <div style={{width:26,height:26,borderRadius:"50%",background:`${PRIMARY_COLOR}14`,display:"flex",alignItems:"center",justifyContent:"center"}}>●</div>
                          <div><div style={mulish({fontSize:12,color:"#fff",fontWeight:500})}>{c.name}</div><div style={mono({fontSize:8,color:"rgba(255,255,255,.24)"})}>${c.ticker}</div></div>
                        </div>
                        <span style={mulish({fontSize:15,color:PRIMARY_COLOR,fontWeight:600})}>{c.score}</span>
                        <span style={mono({fontSize:10,color:c.delta.startsWith("+")?PRIMARY_COLOR:"rgba(255,255,255,.5)"})}>{c.delta}</span>
                        <span style={mono({fontSize:9,color:"rgba(255,255,255,.26)"})}>{c.mentions}</span>
                        <span style={{...mono({fontSize:7,fontWeight:500}),padding:"2px 7px",borderRadius:3,background:PHASE_STYLE[c.phase].bg,color:PHASE_STYLE[c.phase].color}}>{c.phase}</span>
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
                      {alerts.map((a,i) => (
                        <div key={i} style={{display:"flex",gap:9,padding:"10px 14px",borderBottom:i<alerts.length-1?`1px solid rgba(255,255,255,.04)`:"none"}}>
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
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{...GLASS,padding:16}}>
                  <div style={mulish({fontSize:13,color:PRIMARY_COLOR,marginBottom:12,fontWeight:600})}>Live Market Sentiment Trend (Area Graph)</div>
                  <div style={{width:"100%",height:150}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lineData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" tick={{fontSize:9,fill:"rgba(255,255,255,.3)"}} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis hide={true} domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip contentStyle={{background:"rgba(6,8,15,.9)",border:`1px solid ${PRIMARY_COLOR}40`,borderRadius:8}} itemStyle={{color:PRIMARY_COLOR}} />
                        <Area type="monotone" dataKey="score" stroke={PRIMARY_COLOR} fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div style={{...GLASS,padding:16}}>
                    <div style={mulish({fontSize:13,color:PRIMARY_COLOR,marginBottom:12,fontWeight:600})}>Live Top Momentum (Bar Graph)</div>
                    <div style={{width:"100%",height:140}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={coins.slice(0, 4).map(c => ({ name: c.ticker, val: c.score }))}>
                          <XAxis dataKey="name" tick={{fontSize:9,fill:"rgba(255,255,255,.5)"}} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill:"rgba(255,0,144,.1)"}} contentStyle={{background:"rgba(6,8,15,.9)",border:`1px solid ${PRIMARY_COLOR}`,borderRadius:8}} />
                          <Bar dataKey="val" fill={PRIMARY_COLOR} radius={[4,4,0,0]} isAnimationActive={true} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div style={{...GLASS,padding:16}}>
                    <div style={mulish({fontSize:13,color:PRIMARY_COLOR,marginBottom:12,fontWeight:600})}>Live Hype Distribution (Pie Chart)</div>
                    <div style={{width:"100%",height:140}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={[{n:"Twitter",v:platCounts[0]||45},{n:"Reddit",v:platCounts[1]||28},{n:"Telegram",v:platCounts[2]||18},{n:"TikTok",v:10}]} 
                            dataKey="v" nameKey="n" cx="50%" cy="50%" innerRadius={34} outerRadius={54} paddingAngle={4}
                            isAnimationActive={true}
                          >
                            <Cell fill="#FF0090"/>
                            <Cell fill="#CC0073"/>
                            <Cell fill="#990056"/>
                            <Cell fill="#66003A"/>
                          </Pie>
                          <Tooltip contentStyle={{background:"rgba(6,8,15,.9)",border:`1px solid ${PRIMARY_COLOR}`,borderRadius:8}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
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
                  {(alerts.length > 0 ? alerts : ALERTS_FALLBACK).map((a,i) => (
                    <div key={i} style={{display:"flex",gap:9,padding:"10px 14px",borderBottom:i<alerts.length-1?`1px solid rgba(255,255,255,.04)`:"none"}}>
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

      <div style={{position:"fixed",bottom:20,right:20,zIndex:50}}>
        {chatOpen && (
          <div style={{...GLASS,width:320,height:420,borderRadius:14,display:"flex",flexDirection:"column",marginBottom:12, animation:"chatPopup 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"}}>
            <div style={{padding:14,borderBottom:`1px solid ${PRIMARY_COLOR}19`,display:"flex",justifyContent:"space-between"}}>
              <div style={mulish({fontSize:14,color:"#fff",fontWeight:600})}>Crypto Assistant</div>
              <button onClick={() => setChatOpen(false)} style={{background:"none",border:"none",color:PRIMARY_COLOR,fontSize:16,cursor:"pointer"}}>×</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:10}}>
              {messages.map((msg,i) => (
                <div key={i} style={{display:"flex",justifyContent:msg.type==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:8,background:msg.type==="user"?PRIMARY_COLOR:`rgba(255, 0, 144, .1)`,color:msg.type==="user"?"#fff":"rgba(255,255,255,.8)",fontSize:12,fontFamily:MULISH,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div style={{display:"flex",justifyContent:"flex-start"}}>
                  <div style={{padding:"8px 12px",borderRadius:8,background:`rgba(255,0,144,.1)`,color:`${PRIMARY_COLOR}99`,fontSize:12,fontFamily:MULISH,fontStyle:"italic"}}>Typing...</div>
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>
            <div style={{padding:10,borderTop:`1px solid ${PRIMARY_COLOR}19`,display:"flex",gap:8}}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key==="Enter" && handleChatSend()} placeholder="Ask..." style={{flex:1,padding:"8px 10px",background:`rgba(255, 0, 144, .08)`,border:`1px solid ${PRIMARY_COLOR}40`,borderRadius:6,color:"#fff",fontFamily:MULISH,fontSize:12,outline:"none"}}/>
              <button onClick={handleChatSend} style={{padding:"8px 12px",background:PRIMARY_COLOR,border:"none",borderRadius:6,cursor:"pointer",color:"#fff",fontWeight:600}}>Send</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} style={{width:56,height:56,borderRadius:"50%",background:PRIMARY_COLOR,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontWeight:"bold",boxShadow:`0 0 20px ${PRIMARY_COLOR}80`}}>
          {chatOpen?"×":"◆"}
        </button>
      </div>

      {toastVis && <div style={{position:"fixed",bottom:90,right:20,maxWidth:250,background:"rgba(6,8,18,.88)",border:`1px solid ${PRIMARY_COLOR}66`,borderRadius:12,padding:"12px 15px",animation:"toastIn .25s ease",zIndex:999}}>
        <div style={mulish({fontSize:13,color:PRIMARY_COLOR,marginBottom:3,fontWeight:600})}>{tt}</div>
        <div style={mono({fontSize:9,color:"rgba(255,255,255,.36)"})}>{tb}</div>
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
      {/* Dither background — full viewport, behind everything */}
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 0 }}>
        <Dither
          waveColor={[1, 0, 0.5333333333333333]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.5}
          colorNum={14}
          pixelSize={1}
          waveAmplitude={0.2}
          waveFrequency={1.5}
          waveSpeed={0.03}
        />
      </div>
      <LoadingScreen isVisible={isLoading} />
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={() => { setIsLoggedIn(false); setUser(null); }} />
      )}
    </>
  );
}
