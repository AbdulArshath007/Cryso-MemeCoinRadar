/**
 * CRYSO — Reddit Real-Time Intelligence Service
 * Uses Reddit API to monitor public crypto subreddits
 * and track live coin mentions, sentiment, and post velocity.
 */

const axios = require('axios');

const API_KEY = process.env.REDDIT_API_KEY || '1eX4kLszDEpXd5aihKPyFsK7iCwuFw';

// ── Public crypto Subreddits to monitor ───────────────────────────────
const SUBREDDITS = 'CryptoCurrency+SatoshiStreetBets+dogecoin+CryptoMoonShots+pepecoin+shibarmy';

// ── Coin keyword maps ────────────────────────────────────────────────────────
const COIN_KEYWORDS = {
  DOGE:  ['doge', 'dogecoin'],
  PEPE:  ['pepe', 'pepecoin'],
  SHIB:  ['shib', 'shiba', 'shibainu'],
  WIF:   ['wif', 'dogwifhat'],
  NEIRO: ['neiro'],
  FLOKI: ['floki', 'flokiinu'],
  BONK:  ['bonk'],
  MOG:   ['mog', 'mogcoin'],
};

// ── Live in-memory state ─────────────────────────────────────────────────────
const state = {
  connected: false,
  mentions: { DOGE:0, PEPE:0, SHIB:0, WIF:0, NEIRO:0, FLOKI:0, BONK:0, MOG:0 },
  mentionsHistory: { DOGE:[], PEPE:[], SHIB:[], WIF:[], NEIRO:[], FLOKI:[], BONK:[], MOG:[] },
  postTimestamps: [],
  totalPosts: 0,
  lastUpdate: null,
  lastPostSeen: null,
  pollingInterval: null
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function countMentions(title, text) {
  const content = (title + ' ' + text).toLowerCase();
  const found = {};
  for (const [coin, keywords] of Object.entries(COIN_KEYWORDS)) {
    if (keywords.some(kw => content.includes(kw))) {
      found[coin] = (found[coin] || 0) + 1;
    }
  }
  return found;
}

function purgeOldData() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000; // keep 2 hours
  for (const coin of Object.keys(state.mentionsHistory)) {
    state.mentionsHistory[coin] = state.mentionsHistory[coin].filter(t => t > cutoff);
  }
  state.postTimestamps = state.postTimestamps.filter(t => t > cutoff);
}

// ── Polling logic ────────────────────────────────────────────────────────────
async function pollReddit() {
  if (!API_KEY) return;

  try {
    const response = await axios.get(`https://oauth.reddit.com/r/${SUBREDDITS}/new?limit=25`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'CrysoDashboard/1.0.0'
      }
    });

    const posts = response.data?.data?.children || [];
    if (posts.length > 0) {
      state.connected = true;
      state.lastUpdate = new Date().toISOString();

      let newPostsFound = 0;
      
      // Process newest first to oldest to handle 'before' effectively, or just process all new ones
      for (const post of posts) {
        const data = post.data;
        // Check if we already processed this post
        if (state.lastPostSeen && data.created_utc <= state.lastPostSeen) {
          continue;
        }

        newPostsFound++;
        const now = Date.now();
        state.postTimestamps.push(now);
        state.totalPosts++;

        const found = countMentions(data.title || '', data.selftext || '');
        for (const [coin, count] of Object.entries(found)) {
          state.mentions[coin] = (state.mentions[coin] || 0) + count;
          for (let i = 0; i < count; i++) state.mentionsHistory[coin].push(now);
        }
      }

      if (posts[0]?.data?.created_utc && posts[0].data.created_utc > (state.lastPostSeen || 0)) {
         state.lastPostSeen = posts[0].data.created_utc;
      }
      
      console.log(`[Reddit] Polled ${SUBREDDITS}. Found ${newPostsFound} new posts.`);
    }
  } catch (err) {
    console.error('❌ Reddit polling failed:', err.response?.data || err.message);
    state.connected = false; // Mark true only on successful polls
  }
}

// ── Main connect function ────────────────────────────────────────────────────
async function connect() {
  if (!API_KEY) {
    console.log('⚠️  No Reddit API Key found. Reddit live data disabled.');
    return false;
  }

  console.log('✅ Reddit Service started polling');
  
  // Initial poll
  await pollReddit();
  
  // Poll every 30 seconds (within rate limits)
  if (!state.pollingInterval) {
    state.pollingInterval = setInterval(() => {
      pollReddit();
      purgeOldData();
    }, 30000);
  }
  
  return true;
}

function getStats() {
  return {
    connected: state.connected,
    lastUpdate: state.lastUpdate,
    totalPosts: state.totalPosts,
    postTimestamps: state.postTimestamps,
    mentionsHistory: state.mentionsHistory
  };
}

module.exports = { connect, getStats };
