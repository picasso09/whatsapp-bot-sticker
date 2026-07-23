// Kalau kau Ada duit kau pake lah api key dari Chat AI lain kek gemini atau Chatgpt
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:2b';

module.exports = {
  // Contoh pemakaian: ".ai berapa 1+1 ?"
  triggers: ['.ai'],

  async handler(sock, msg, ctx) {
    const { from, args } = ctx;

    if (!args) {
      await sock.sendMessage(from, { text: 'Try Ask Something, jan suruh buat skripsi' }, { quoted: msg });
      return;
    }

    const status = await sock.sendMessage(from, { text: 'Thingking...' }, { quoted: msg });

    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: args,
          stream: false,
          think: false, // Disable Thinking, Biar fast Hasil Jawaban ( keakuratan berkurang ) kalau pake AI dari Serices Chat AI disable aja ini
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const answer = data.response?.trim() || 'Ollama gak ngasih jawaban buat itu.';

      await sock.sendMessage(from, { text: answer, edit: status.key });
    } catch (error) {
      console.error(error);
      await sock.sendMessage(from, {
        text: `❌ .\nDetail: ${error.message}\n\nPastikan Ollama jalan dan modelnya udah di-pull (ollama pull ${OLLAMA_MODEL}).`,
        edit: status.key,
      });
    }
  },
};