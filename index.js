const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const Spinnies = require('spinnies');
const moment = require('moment-timezone');

const { getMessageText, aboutClient } = require('./lib/helpers');
const { loadCommands } = require('./commands');

// atur moment ke indonesia
moment.locale('id');

const spinnies = new Spinnies();
const commands = loadCommands();

console.log('Simple WhatsApp Bot Sticker by picasso09 (Baileys Edition)');
console.log(`Loaded ${commands.size} command(s): ${[...commands.keys()].join(', ')}\n`);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  spinnies.add('Connecting', { text: 'Opening WhatsApp Web' });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      spinnies.add('generateQr', { text: 'Generating QR Code' });
      console.log('[!] Scan QR Code Bellow');
      qrcode.generate(qr, { small: true });
      spinnies.succeed('generateQr', { text: 'QR Code Generated' });
      spinnies.update('Connecting', { text: 'Waiting to scan' });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode
        : undefined;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Client disconnected. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
      else console.log('Client was logged out, Reason : ', lastDisconnect?.error?.message);
    } else if (connection === 'open') {
      spinnies.succeed('Connecting', { text: 'Connected!', successColor: 'greenBright' });
      aboutClient(sock);
      console.log('Incoming Messages : \n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message) return;
    
    const from = msg.key.remoteJid;
    if (from === 'status@broadcast') return; // Skip read status Content Only See Main chat
    const body = getMessageText(msg);
    const pushname = msg.pushName || 'Unknown';
    const jam = moment().tz('Asia/Jakarta').format('dddd DD-MM-YYYY HH:mm:ss');

    console.log(`💬 ${pushname} : ${body}\n`);

    const handler = commands.get(body.toLowerCase());
    if (!handler) return;

    try {
      await handler(sock, msg, { from, body, pushname, jam });
    } catch (error) {
      console.error(error);
    }
  });

  return sock;
}

startBot().catch((err) => console.error('Fatal error:', err));