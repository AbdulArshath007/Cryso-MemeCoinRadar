/**
 * CRYSO — NeonDB Storage Service
 * Periodically saves real-time social metrics to the database for historical and AI tracking.
 */

const socialAggregator = require('./socialAggregator');

let storageInterval = null;

async function saveStats(pool) {
  try {
    const stats = socialAggregator.getStats();
    if (!stats.live) return; // Only save if we have live data flowing

    // We only care about saving the coin stats
    const coins = stats.coins;
    const sentiment = stats.sentiment;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const coin of coins) {
        // stats.mentions is formatted like "1.2K", so we use mentionsRaw
        await client.query(
          `INSERT INTO social_stats (coin_ticker, score, mentions, phase, sentiment) 
           VALUES ($1, $2, $3, $4, $5)`,
          [coin.ticker, coin.score, coin.mentionsRaw, coin.phase, sentiment]
        );
      }

      await client.query('COMMIT');
      console.log(`[DB] Saved ${coins.length} coin metrics to NeonDB ✔️`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to save stats to DB:', err.message);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Storage Service Error:', e.message);
  }
}

async function start(pool, intervalMs = 60000) {
  if (storageInterval) return;
  
  console.log(`💾 Data Storage Service started. Saving to NeonDB every ${intervalMs / 1000}s`);

  // Initial save after a short delay to allow API connections
  setTimeout(() => saveStats(pool), 5000);

  storageInterval = setInterval(() => saveStats(pool), intervalMs);
}

module.exports = { start };
