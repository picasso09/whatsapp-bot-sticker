// Ambil teks dari berbagai jenis pesan (text biasa, caption gambar, dll)
function getMessageText(msg) {
  const m = msg.message;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  );
}

// Cari gambar Termasuk dari pesan itu sendiri, atau dari pesan yang di-reply/quote
function resolveImageTarget(msg, from) {
  if (msg.message.imageMessage) {
    return msg;
  }

  const ctx = msg.message.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;

  if (quoted?.imageMessage) {
    return {
      key: {
        remoteJid: from,
        id: ctx.stanzaId,
        participant: ctx.participant,
      },
      message: quoted,
    };
  }

  return null;
}

function aboutClient(sock) {
  const info = sock.user;
  console.log(
    '\nAbout Client :' +
    '\n  - Username : ' + (info?.name || '-') +
    '\n  - Phone    : ' + (info?.id?.split(':')[0] || '-') +
    '\n'
  );
}

module.exports = { getMessageText, resolveImageTarget, aboutClient };
