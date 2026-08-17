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
  triggers: ['.dl', '.download', URL_REGEX],

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
        '--print', '%(title)s',
        '--print', 'after_move:filepath',
        '-o', outputTemplate,
        '--extractor-args', 'youtube:player_client=android',
        url,
      ], { maxBuffer: 1024 * 1024 * 50 });

      const outputLines = stdout.trim().split('\n');
      filePath = outputLines.pop();
      const mediatitle = outputLines.join('\n').trim() || 'Berhasil diunduh';

      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('File hasil download tidak ditemukan');
      }

      const videoBuffer = fs.readFileSync(filePath);

      await sock.sendMessage(from, {
        video: videoBuffer,
        caption: `${mediatitle}\n`,
      }, { quoted: msg });

      // fix invalid media key
      await sock.sendMessage(from, { delete: status.key });
    } catch (error) {
      // Full Log error into terminal
      console.error(error);
      // Cek apakah ada output stderr
      if (error.stderr) {
        // Split stderr
        const lines = error.stderr.split('\n');
        // Cari log mengandung kata "ERROR:"
        const exactError = lines.find(line => line.includes('ERROR:'));
        if (exactError) {
          errorMessage = exactError.trim(); // Scrape sebaris ERROR:
        } else {
          errorMessage = error.stderr.trim(); // Scrape All stderr kalau tulisan ERROR: gk jumpa
        }
      } else if (error.message) {
        // Fallback error from nodejs/baileys
        errorMessage = error.message;
      }
      // Kirim pesan error sudah bersih ke WA
      await sock.sendMessage(from, {
        text: `${errorMessage}`,
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