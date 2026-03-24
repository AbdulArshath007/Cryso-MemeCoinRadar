/**
 * CRYSO — Telegram One-Time Auth Setup
 * Run this ONCE: node auth.js
 * It will ask for your phone number + Telegram OTP, then save your session to .env
 */

require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const path = require('path');

const API_ID = parseInt(process.env.TELEGRAM_APP_ID || '32502338');
const API_HASH = process.env.TELEGRAM_API_HASH || '4a2378f4749620d9e1c67f997619934c';

(async () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   CRYSO — Telegram Auth Setup          ║');
  console.log('╚════════════════════════════════════════╝\n');

  const existingSession = process.env.TELEGRAM_SESSION || '';
  if (existingSession && existingSession.length > 20) {
    console.log('✅ Session already exists in .env! You\'re already authenticated.');
    console.log('   Delete TELEGRAM_SESSION from .env and re-run if you want to re-auth.\n');
    process.exit(0);
  }

  const client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => {
      const phone = await input.text('📱 Enter your Telegram phone number (with country code, e.g. +919876543210): ');
      return phone.trim();
    },
    password: async () => {
      const pw = await input.text('🔒 2FA Password (press Enter if none): ');
      return pw.trim();
    },
    phoneCode: async () => {
      const code = await input.text('📨 Enter the OTP code Telegram sent you: ');
      return code.trim();
    },
    onError: (err) => {
      console.error('❌ Auth error:', err.message);
    },
  });

  const sessionString = client.session.save();

  console.log('\n✅ Authentication successful!\n');
  console.log('💾 Saving session to .env...\n');

  // Read existing .env
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    envContent = '';
  }

  // Remove old TELEGRAM lines
  const lines = envContent.split('\n').filter(l =>
    !l.startsWith('TELEGRAM_APP_ID') &&
    !l.startsWith('TELEGRAM_API_HASH') &&
    !l.startsWith('TELEGRAM_SESSION')
  );

  lines.push(`TELEGRAM_APP_ID=${API_ID}`);
  lines.push(`TELEGRAM_API_HASH=${API_HASH}`);
  lines.push(`TELEGRAM_SESSION=${sessionString}`);

  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

  console.log('╔════════════════════════════════════════╗');
  console.log('║   🎉 Setup Complete!                    ║');
  console.log('║                                        ║');
  console.log('║   Now run: npm start                   ║');
  console.log('║   Your dashboard will go LIVE!         ║');
  console.log('╚════════════════════════════════════════╝\n');

  await client.disconnect();
  process.exit(0);
})();
