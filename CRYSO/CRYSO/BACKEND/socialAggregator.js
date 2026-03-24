/**
 * CRYSO — Social Aggregator
 * Combines data from Telegram and Reddit services to compute
 * unified coin scores, sentiment, phases, and alerts.
 */

const telegramService = require('./telegramService');
const redditService = require('./redditService');

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

function getCombinedHistory(coin) {
  const tState = telegramService.getRawState();
  const rState = redditService.getStats();
  
  const tHist = tState.mentionsHistory[coin] || [];
  const rHist = rState.mentionsHistory[coin] || [];
  
  return [...tHist, ...rHist];
}

function getCombinedPostTimestamps() {
  const tState = telegramService.getRawState();
  const rState = redditService.getStats();
  return [...tState.postTimestamps, ...(rState.postTimestamps || [])];
}

function computeScore(coin) {
  const history = getCombinedHistory(coin);
  const now = Date.now();
  const recent5m = history.filter(t => now - t < 5 * 60 * 1000).length;
  const recent1h = history.filter(t => now - t < 60 * 60 * 1000).length;
  const raw = Math.min(99, Math.round(recent5m * 3 + recent1h * 0.5));
  return Math.max(1, raw);
}

function computeDelta(coin) {
  const history = getCombinedHistory(coin);
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

function getStats() {
  const now = Date.now();
  const coins = Object.keys(COIN_KEYWORDS).map((ticker, i) => {
    const score = computeScore(ticker);
    const delta = computeDelta(ticker);
    const phase = computePhase(ticker);
    const history = getCombinedHistory(ticker);
    const mentions1h = history.filter(t => now - t < 60 * 60 * 1000).length;

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

  coins.sort((a, b) => b.score - a.score);
  coins.forEach((c, i) => { c.rank = i + 1; });

  const NAMES = { DOGE:'Dogecoin', PEPE:'Pepe', SHIB:'Shiba Inu', WIF:'Dogwifhat', NEIRO:'Neiro', FLOKI:'Floki', BONK:'Bonk', MOG:'Mog Coin' };
  coins.forEach(c => { c.name = NAMES[c.ticker] || c.ticker; });

  const combinedPosts = getCombinedPostTimestamps();
  const postsPH = combinedPosts.filter(t => now - t < 60 * 60 * 1000).length;
  const postsPM = combinedPosts.filter(t => now - t < 60 * 1000).length;
  const breakouts = coins.filter(c => c.phase === 'BREAKOUT').length;
  const crashRisks = coins.filter(c => c.phase === 'CRASH RISK').length;

  let totalMentions = 0;
  for (const t of Object.keys(COIN_KEYWORDS)) {
      totalMentions += getCombinedHistory(t).filter(ts => now - ts < 60 * 60 * 1000).length;
  }
  
  const sentiment = Math.min(100, Math.max(0, Math.round(50 + (breakouts - crashRisks) * 8 + Math.min(totalMentions / 100, 20))));

  const isLive = telegramService.isConnected() || redditService.getStats().connected;

  // Platform source breakdown
  const tTotal = telegramService.getRawState().totalPosts || 0;
  const rTotal = redditService.getStats().totalPosts || 0;
  const tPercent = (tTotal + rTotal) > 0 ? Math.round((tTotal / (tTotal + rTotal)) * 100) : 50;
  const rPercent = 100 - tPercent;

  return {
    live: isLive,
    telegramLive: telegramService.isConnected(),
    redditLive: redditService.getStats().connected,
    postsPerMinute: postsPM,
    postsPerHour: postsPH,
    totalPosts: tTotal + rTotal,
    sentiment,
    sentimentLabel: sentiment >= 70 ? 'GREED' : sentiment >= 45 ? 'NEUTRAL' : 'FEAR',
    breakouts,
    crashRisks,
    coins,
    platformSplit: {
        telegram: tPercent,
        reddit: rPercent,
        twitter: 0 // Mocked inside Dashboard currently, but this can feed true proportions
    }
  };
}

module.exports = { getStats };
