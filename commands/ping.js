module.exports = {
  triggers: ['.ping'],

  async handler(sock, msg, ctx) {
    const { from } = ctx;

    const startTime = Date.now();
    const send = await sock.sendMessage(from, {
      text: 'pinging...'}, {
      quoted: msg
    });

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Kasih jeda selama 1 detik sebelum edit tuh pesan
    await new Promise(resolve => setTimeout(resolve, 1000));  // 1000ms (1 detik)
    await sock.sendMessage(from, {
      text: `latency: ${latency}ms`,
      edit: send.key,
    });
  },
};