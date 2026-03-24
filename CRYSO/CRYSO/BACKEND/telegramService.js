/**
 * CRYSO — Telegram Real-Time Intelligence Service
 * Uses GramJS (MTProto) to monitor public crypto Telegram channels
 * and track live coin mentions, sentiment, and post velocity.
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');

const API_ID = parseInt(process.env.TELEGRAM_APP_ID || '32502338');
const API_HASH = process.env.TELEGRAM_API_HASH || '4a2378f4749620d9e1c67f997619934c';
const SESSION_STRING = process.env.TELEGRAM_SESSION || '';

// ── Public crypto Telegram channels to monitor ─────────────────────────────
const CHANNELS = [
  'CryptosNewsOfficial',
  'Bitcoin',
  'ethereum',
  'CryptoComOfficial',
  'DogecoinOfficialCommunity',
  'ShibaInuCoin',
  'pepecoinofficial',
  'floki_inu',
  'bonk_official',
  'WhaleAlertCrypto',
  'CryptoBullUpdates',
  'crypto_signals_official',
  'MemeCoinsAlerts',
];

// ── Coin keyword maps ────────────────────────────────────────────────────────
const COIN_KEYWORDS = {
  DOGE:  ['doge', 'dogecoin', '$doge'],
  PEPE:  ['pepe', '$pepe', 'pepecoin'],
  SHIB:  ['shib', 'shiba', 'shibainu', '$shib'],
  WIF:   ['wif', 'dogwifhat', '$wif', 'dogwif'],
  NEIRO: ['neiro', '$neiro'],
  FLOKI: ['floki', '$floki', 'flokiinu'],
  BONK:  ['bonk', '$bonk'],
  MOG:   ['mog', '$mog', 'mogcoin'],
};

// ── Live in-memory state ─────────────────────────────────────────────────────
const state = {
  connected: false,
  mentions: { DOGE:0, PEPE:0, SHIB:0, WIF:0, NEIRO:0, FLOKI:0, BONK:0, MOG:0 },
  mentionsHistory: { DOGE:[], PEPE:[], SHIB:[], WIF:[], NEIRO:[], FLOKI:[], BONK:[], MOG:[] },
  postsPerMinute: 0,
  totalPosts: 0,
  postTimestamps: [],
  alertsTriggered: [],
  lastUpdate: null,
};

// Spike detection thresholds (mentions in last 5 min)
const SPIKE_THRESHOLD = { DOGE:15, PEPE:12, SHIB:10, WIF:8, NEIRO:5, FLOKI:5, BONK:5, MOG:3 };

// ── Helpers ──────────────────────────────────────────────────────────────────
function countMentions(text) {
  const lower = text.toLowerCase();
  const found = {};
  for (const [coin, keywords] of Object.entries(COIN_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      found[coin] = (found[coin] || 0) + 1;
    }
  }
  return found;
}

function computeScore(coin) {
  const history = state.mentionsHistory[coin];
  const now = Date.now();
  const recent5m = history.filter(t => now - t < 5 * 60 * 1000).length;
  const recent1h = history.filter(t => now - t < 60 * 60 * 1000).length;
  // Score: base off 5-min velocity, capped at 99
  const raw = Math.min(99, Math.round(recent5m * 4 + recent1h * 0.5));
  return Math.max(1, raw);
}

function computeDelta(coin) {
  const history = state.mentionsHistory[coin];
  const now = Date.now();
  const lastHour = history.filter(t => now - t < 60 * 60 * 1000).length;
  const prevHour = history.filter(t => now - t >= 60 * 60 * 1000 && now - t < 120 * 60 * 1000).length;
  if (prevHour === 0) return lastHour > 0 ? `+${lastHour * 10}` : '0';
  const pct = Math.round(((lastHour - prevHour) / Math.max(prevHour, 1)) * 100);
  return pct >= 0 ? `+${pct}` : `${pct}`;
}

function computePhase(coin) {
  const score = computeScore(coin);
  const delta = parseInt(computeDelta(coin)) || 0;
  if (score >= 75 && delta > 0) return 'BREAKOUT';
  if (score >= 50 && delta >= 0) return 'ACCUMULATION';
  if (score >= 30 && delta < 0) return 'FADING';
  if (score < 25) return 'CRASH RISK';
  return 'EMERGING';
}

function checkSpikes() {
  const now = Date.now();
  const newAlerts = [];
  for (const coin of Object.keys(COIN_KEYWORDS)) {
    const count5m = state.mentionsHistory[coin].filter(t => now - t < 5 * 60 * 1000).length;
    if (count5m >= SPIKE_THRESHOLD[coin]) {
      const existing = state.alertsTriggered.find(a => a.coin === coin && now - a.at < 10 * 60 * 1000);
      if (!existing) {
        const alert = {
          coin,
          action: `Spike +${count5m} mentions/5min`,
          badge: count5m >= SPIKE_THRESHOLD[coin] * 2 ? 'CRITICAL' : 'HIGH',
          detail: `Telegram surge`,
          at: now,
        };
        newAlerts.push(alert);
        console.log(`🚨 Alert triggered: ${coin} spike — ${count5m} mentions in 5min`);
      }
    }
  }
  state.alertsTriggered = [...state.alertsTriggered.filter(a => now - a.at < 30 * 60 * 1000), ...newAlerts];
}

function purgeOldData() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000; // keep 2 hours
  for (const coin of Object.keys(state.mentionsHistory)) {
    state.mentionsHistory[coin] = state.mentionsHistory[coin].filter(t => t > cutoff);
  }
  state.postTimestamps = state.postTimestamps.filter(t => t > cutoff);
}

// ── Compute posts/min from timestamps ────────────────────────────────────────
function computePPM() {
  const now = Date.now();
  const recent = state.postTimestamps.filter(t => now - t < 60 * 1000).length;
  state.postsPerMinute = recent;
}

// ── Main connect function ─────────────────────────────────────────────────────
let client = null;

async function connect() {
  if (!SESSION_STRING || SESSION_STRING.length < 20) {
    console.log('⚠️  No Telegram session found. Telegram live data disabled.');
    console.log('   Run `node auth.js` in the BACKEND folder to authenticate.\n');
    return false;
  }

  try {
    client = new TelegramClient(
      new StringSession(SESSION_STRING),
      API_ID,
      API_HASH,
      { connectionRetries: 5, retryDelay: 3000, autoReconnect: true }
    );

    await client.connect();
    state.connected = true;
    console.log('✅ Telegram connected as user account');

    // Subscribe to new messages from monitored channels
    client.addEventHandler(async (event) => {
      try {
        const message = event.message;
        if (!message || !message.text) return;

        const now = Date.now();
        state.postTimestamps.push(now);
        state.totalPosts++;
        state.lastUpdate = new Date().toISOString();

        // Count coin mentions
        const found = countMentions(message.text);
        for (const [coin, count] of Object.entries(found)) {
          state.mentions[coin] = (state.mentions[coin] || 0) + count;
          for (let i = 0; i < count; i++) state.mentionsHistory[coin].push(now);
        }

        computePPM();
        checkSpikes();
      } catch (err) {
        // Silent — don't crash on individual message errors
      }
    }, new NewMessage({ chats: CHANNELS }));

    // Periodic cleanup
    setInterval(purgeOldData, 10 * 60 * 1000);
    setInterval(computePPM, 5000);

    console.log(`📡 Monitoring ${CHANNELS.length} Telegram channels for crypto activity...`);
    return true;
  } catch (err) {
    console.error('❌ Telegram connection failed:', err.message);
    state.connected = false;
    return false;
  }
}

// ── Public API (used by server.js) ───────────────────────────────────────────
function getStats() {
  const now = Date.now();
  const coins = Object.keys(COIN_KEYWORDS).map((ticker, i) => {
    const score = computeScore(ticker);
    const delta = computeDelta(ticker);
    const phase = computePhase(ticker);
    const mentions1h = state.mentionsHistory[ticker].filter(t => now - t < 60 * 60 * 1000).length;

    return {
      rank: i + 1,
      ticker,
      score,
      delta,
      phase,
      mentions: mentions1h > 0 ? `${(mentions1h / 1000).toFixed(1)}K` : '0',
      mentionsRaw: mentions1h,
    };
  });

  // Sort by score descending, re-rank
  coins.sort((a, b) => b.score - a.score);
  coins.forEach((c, i) => { c.rank = i + 1; });

  // Add coin names
  const NAMES = { DOGE:'Dogecoin', PEPE:'Pepe', SHIB:'Shiba Inu', WIF:'Dogwifhat', NEIRO:'Neiro', FLOKI:'Floki', BONK:'Bonk', MOG:'Mog Coin' };
  coins.forEach(c => { c.name = NAMES[c.ticker] || c.ticker; });

  const postsPH = state.postTimestamps.filter(t => now - t < 60 * 60 * 1000).length;
  const breakouts = coins.filter(c => c.phase === 'BREAKOUT').length;
  const crashRisks = coins.filter(c => c.phase === 'CRASH RISK').length;

  // Overall sentiment score (0-100)
  const totalMentions = Object.values(state.mentionsHistory).reduce((s, h) => s + h.filter(t => now - t < 60 * 60 * 1000).length, 0);
  const sentiment = Math.min(100, Math.max(0, Math.round(50 + (breakouts - crashRisks) * 8 + Math.min(totalMentions / 100, 20))));

  return {
    live: state.connected,
    lastUpdate: state.lastUpdate,
    postsPerMinute: state.postsPerMinute,
    postsPerHour: postsPH,
    totalPosts: state.totalPosts,
    sentiment,
    sentimentLabel: sentiment >= 70 ? 'GREED' : sentiment >= 45 ? 'NEUTRAL' : 'FEAR',
    breakouts,
    crashRisks,
    coins,
  };
}

function getAlerts() {
  return state.alertsTriggered.slice().reverse().slice(0, 10);
}

function isConnected() {
  return state.connected;
}

// Export raw state for aggregation
function getRawState() {
  return {
    postTimestamps: state.postTimestamps,
    totalPosts: state.totalPosts,
    mentionsHistory: state.mentionsHistory,
  };
}

module.exports = { connect, getStats, getAlerts, isConnected, getRawState };
