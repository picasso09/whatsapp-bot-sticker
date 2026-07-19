const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { resolveImageTarget } = require('../lib/helpers');

module.exports = {
  triggers: ['.stiker', '.sticker', '.s', '.tikel'],

  async handler(sock, msg, ctx) {
    const { from, jam, pushname } = ctx;
    const targetMsg = resolveImageTarget(msg, from);

    if (!targetMsg) {
      await sock.sendMessage(from, {
        text: 'fotonya mana?' }, {
        quoted: msg
      });
      return;
    }

    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
    const sticker = new Sticker(buffer, {
      pack: 'github.com/picasso09',
      author: `DVWORKSPACE-${jam}`,
      type: StickerTypes.FULL,
      quality: 100,
    });
    const stickerBuffer = await sticker.toBuffer();

    await sock.sendMessage(from, {
      sticker: stickerBuffer }, {
      quoted: msg
    });
    console.log(`💬 ${pushname} : Sticker sent!\n`);
  },
};
