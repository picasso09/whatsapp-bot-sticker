const { execFile } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');

const execFileAsync = util.promisify(execFile);

const DOWNLOAD_DIR = path.join(__dirname, '..', 'downloads');

// Domain Allow
const ALLOWED_DOMAINS = [
  'tiktok\\.com',
  'youtube\\.com', 'youtu\\.be',
  'facebook\\.com', 'fb\\.com', 'fb\\.watch',
  'instagram\\.com',
  'twitter\\.com', 'x\\.com',
];

const URL_REGEX = new RegExp(
  `(https?://(?:[a-zA-Z0-9-]+\\.)?(?:${ALLOWED_DOMAINS.join('|')})[^\\s]+)`,
  'i'
);

const FORMAT = 'bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/best[ext=mp4][vcodec^=avc1]/best[ext=mp4]/best';

module.exports = {
  // Wajib pakai prefix + link, contoh: ".dl https://youtu.be/xxxx"
  triggers: ['.dl', '.download'],

  async handler(sock, msg, ctx) {
    const { from, args } = ctx;

    const match = args && args.match(URL_REGEX);
    if (!match) {
      await sock.sendMessage(from, { text: 'Link-nya mana? Contoh: .dl https://...' }, { quoted: msg });
      return;
    }

    const url = match[1];
    const status = await sock.sendMessage(from, { text: '🔄 Sedang mengunduh...' }, { quoted: msg });

    let filePath;
    try {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

      const outputTemplate = path.join(DOWNLOAD_DIR, '%(id)s.%(ext)s');

      // execFile (bukan exec) sengaja dipakai supaya url gak lewat shell sama sekali
      const { stdout } = await execFileAsync('yt-dlp', [
        '-f', FORMAT,
        '--merge-output-format', 'mp4',
        '--restrict-filenames',
        '--no-playlist',
        '--print', 'after_move:filepath',
        '-o', outputTemplate,
        '--extractor-args', 'youtube:player_client=android',
        url,
      ], { maxBuffer: 1024 * 1024 * 50 });

      filePath = stdout.trim().split('\n').pop();

      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('File hasil download tidak ditemukan');
      }

      const videoBuffer = fs.readFileSync(filePath);

      await sock.sendMessage(from, {
        video: videoBuffer,
        caption: 'Video berhasil diunduh.',
      }, { quoted: msg });

      await sock.sendMessage(from, { edit: status.key });
    } catch (error) {
      console.error(error);
      await sock.sendMessage(from, {
        text: `❌ Gagal memproses media.\nDetail: ${error.message}`,
        edit: status.key,
      });
    } finally {
      // Bersihkan file dari server (menuhin server / spek kentang njir)
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};