<div align="center">
  <img src="docs/images/initial_state_1774295856270.png" alt="CRYSO Dashboard" width="800">

  # 🚀 CRYSO — Intelligence & Trend Prediction Dashboard

  **Devthon 1.0 Hackathon Submission**  
  **Track 1: Crypto & Trend Intelligence**

  <br />
  
  ![React](https://img.shields.io/badge/React.js-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Telegram MTProto](https://img.shields.io/badge/GramJS-%232CA5E0.svg?style=for-the-badge&logo=telegram&logoColor=white)
</div>

---

## 📑 Table of Contents
- [✨ Problem Statement](#-problem-statement)
- [🎯 Requirements & Expected Outcome](#-requirements--expected-outcome)
- [🌟 Key Features](#-key-features)
- [📊 Pitch Deck (PowerPoint)](#-pitch-deck-powerpoint)
- [🌍 Working Model](#-working-model)
- [🏗️ System Architecture](#-system-architecture)
- [🛠️ Tech Stack](#-tech-stack)
- [🗄️ Database Schema](#-database-schema)
- [⚡ Real-Time Communication](#-real-time-communication)
- [🎨 UI & UX Design](#-ui--ux-design)
- [🚀 Getting Started](#-getting-started)
- [🔑 Environment Variables](#-environment-variables)
- [🧠 How It Works](#-how-it-works)
- [📡 API Reference](#-api-reference)
- [📸 Screenshots](#-screenshots)
- [🏆 What Makes CRYSO Stand Out](#-what-makes-cryso-stand-out)
- [📄 License](#-license)

---

## ✨ Problem Statement
**Meme Coin Trend Prediction using Social Media Analytics**  
Building a system that analyzes social media trends and predicts the potential growth of meme coins using ultra-fast, real-time data from global communities.

## 🎯 Requirements & Expected Outcome
- **Integrate APIs** from social platforms (Telegram, Reddit, Twitter/X equivalents).
- **Perform Sentiment Analysis** and real-time trend tracking.
- **Identify Spikes** in mentions, engagement, and hype cycles on subreddits and crypto-hubs.
- **Predict** potential upward/downward movement of meme coins.
- **Display Insights** using live updating dashboards and alerts.
- **Expected Outcome:** A flawless predictive tool that helps identify trending meme coins based solely on social signals and big-data analytics.

---

## 🌟 Key Features
- **⚡ Supercharged Multi-Platform Streams:** Blends raw data from 13 top Telegram Crypto channels and 6 major subreddits.
- **📈 Velocity Scoring Engine:** Calculates momentum from `1` to `99` by weighing recent 5-minute spikes against hours of timeline data.
- **🚨 Hype Alerts & Radar:** Dashboard components light up vividly when a coin shifts into "Breakout" or "Crash Risk" phases.
- [🤖 Built-in AI Chatbot](#-built-in-ai-chatbot)
- **💾 Historical Data Layer:** Automatically inserts snapshots of global market emotion directly into NeonDB every 60 seconds.

---

## 📊 Pitch Deck (PowerPoint)
Download and view the official presentation slide deck for the CRYSO project here:

👉 **[Download CRYSO_Presentation.pptx](docs/CRYSO_Presentation.pptx)**

---

## 🌍 Working Model
The platform is fully containerized and hosted live on Render's cloud infrastructure. You can view the live functioning model of CRYSO here:

👉 **[Live Demo: https://cryso-frontend.onrender.com](https://cryso-frontend.onrender.com)**

*(Note: The Render backend free-tier occasionally spins down when inactive. If the Dashboard says "Initializing" for a long time, the server is waking up! Give it ~30 seconds and the live social connection will commence automatically.)*

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              React.js + Glassmorphism               │   │
│   │                 (Live Dashboard)                    │   │
│   └───────────────┬──────────────────────┬──────────────┘   │
│                   │                      │                  │
│   [ HTTP Polling ]│                      │[ REST JSON ]     │
└───────────────────┼──────────────────────┼──────────────────┘
                    │                      │
┌───────────────────▼──────────────────────▼──────────────────┐
│                   SERVER (Node.js/Express)                  │
│   ┌──────────────────┐  ┌────────────────┐  ┌───────────┐   │
│   │ telegramService  │  │ redditService  │  │  auth.js  │   │
│   │  (MTProto Hub)   │  │  (HTTP Poll)   │  │ (Auth DB) │   │
│   └────────┬─────────┘  └───────┬────────┘  └───────────┘   │
│            │                    │                           │
│   ┌────────▼────────────────────▼───────────────────────┐   │
│   │    socialAggregator.js (Data Merge & Algorithyms)   │   │
│   └────────────────────────┬────────────────────────────┘   │
│                            │                                │
│   ┌────────────────────────▼────────────────────────────┐   │
│   │   dbStorage.js (Background Persistence Worker)      │   │
│   └────────────────────────┬────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────┘
                             │
                  ┌──────────▼────────────┐
                  │ NeonDB (PostgreSQL)   │
                  │  • users              │
                  │  • social_stats       │
                  └───────────────────────┘
```

---

## 🛠️ Tech Stack
- **Frontend**
  - **React.js**: For highly componentized state rendering.
  - **CSS3 Glassmorphism**: For a futuristic visual aesthetic.
- **Backend**
  - **Node.js + Express**: To handle hundreds of async polling events.
  - **GramJS / Axios**: For Telegram MTProto and Reddit HTTP connections.
- **Database**
  - **NeonDB**: A totally serverless PostgreSQL cloud instance for reliable state storage.
- **Security**
  - **JWT & bcrypt**: For modern and impenetrable user route hashing.

---

## 🗄️ Database Schema

```sql
-- Core users platform table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Historic live data storage
CREATE TABLE social_stats (
  id SERIAL PRIMARY KEY,
  coin_ticker VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL,
  mentions INTEGER NOT NULL,
  phase VARCHAR(50) NOT NULL,
  sentiment INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚡ Real-Time Communication
The backend utilizes a **Headless MTProto stream** (via GramJS) to silently listen to the world's most active and private Telegram crypto channels. There is no web-hook limit. Any message pushed to the Telegram network instantly hits the Node.js event loop, where it's parsed for keywords and added to a 1-hour array buffer in computer memory to dictate immediate real-world momentum. 

## 🎨 UI & UX Design
Inspired by neon-brutalism and contemporary synthwave styling, CRYSO features:
- A live **WebGL Dither** interactive background that traces cursor movement.
- True **Glassmorphism** overlays wrapped in bright neon borders.
- Floating "toast" alerts on the bottom right when the servers detect major momentum shifting.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+`
- A Telegram Phone Number/App ID (for authentication)
- NeonDB PostgreSQL Database

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/AbdulArshath007/Cryso-MemeCoinRadar.git
cd Cryso-MemeCoinRadar
```

**2. Setup Backend Server**
```bash
cd BACKEND
npm install
node auth.js  # Authenticate the server natively with Telegram
npm start     # Starts on port 5000
```

**3. Setup Frontend Dashboard**
```bash
cd ../frontend
npm install
npm start     # Starts React locally on port 3000
```

---

## 🔑 Environment Variables
Create a `.env` file in the `BACKEND` directory:

```env
PORT=5000
DATABASE_URL=postgresql://[NEON_USER]:[NEON_PASSWORD]@ep-...neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_token_key_here
TELEGRAM_APP_ID=[APP_ID]
TELEGRAM_API_HASH=[API_HASH]
TELEGRAM_SESSION=[OUTPUT_FROM_AUTH_JS]
REDDIT_API_KEY=[REDDIT_BEARER_TOKEN]
```

---

## 🧠 How It Works

1. **Passive Ingestion**: `telegramService` and `redditService` quietly harvest text from public channels and subreddits without rate-limiting themselves.
2. **Analysis Pipeline**: The payload is cross-referenced with crypto keyword dictionaries.
3. **Weight Algorithym**: A mention made in the last 5 minutes holds exactly **x3** the mathematical weight of a mention from 45 minutes ago, immediately identifying emerging breakouts before they hit charts.
4. **Data Delivery**: Front-end grabs these numbers every 5 seconds, displaying "CRASH RISK" or "EMERGING" tags based strictly on the aggregated velocity score.

---

## 📡 API Reference

**`GET /api/social/stats`**  
Returns the blended momentum scores calculating Fear & Greed across the ecosystem.

```json
{
  "live": true,
  "postsPerMinute": 89,
  "sentiment": 77,
  "sentimentLabel": "GREED",
  "coins": [
    {
      "rank": 1,
      "ticker": "PEPE",
      "score": 98,
      "delta": "+33",
      "phase": "BREAKOUT",
      "mentions": "1.8K"
    }
  ],
  "platformSplit": {
    "telegram": 60,
    "twitter": 0,
    "reddit": 40
  }
}
```

---

## 📸 Screenshots

### The Command Center
<div align="center">
  <img src="docs/images/chat_open_1774295873879.png" alt="Command Center overlay" width="800">
</div>

### Deep Dive Trend Velocity
<div align="center">
  <img src="docs/images/trending_response_1774295918575.png" alt="Hype Phase Analysis" width="800">
</div>

### Embedded Live Bot Intelligence
<div align="center">
  <img src="docs/images/doge_response_1774295961854.png" alt="Smart AI Bot answering queries" width="800">
</div>

---

## 🏆 What Makes CRYSO Stand Out
Unlike traditional crypto dashboards that rely purely on trailing price charts, **CRYSO structurally predicts future volume**.
- **100% Social Indexing:** Pulling thousands of organic discussions across Reddit and Telegram directly into our scoring matrix in absolute real-time.
- **Glassmorphism Meets Speed:** A breathtaking web experience powered by deep React component architecture and ultra-fast Node.js event polling.
- **Cloud-Native Automation:** Completely automated container deployment on Render seamlessly integrated with a highly robust serverless NeonDB PostgreSQL database.

---

## 📄 License
This architecture is licensed under the MIT License - designed and explicitly built for the **Devthon 1.0 Hackathon**.

<br />

<div align="center">
  <b>Built with ❤️ using React, Node.js, Express, NeonDB, and a lot of ☕</b>
</div>
