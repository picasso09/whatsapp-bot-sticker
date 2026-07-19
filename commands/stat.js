const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { stdin } = require('process');

module.exports = {
  triggers: ['.stat'],
  async handler(sock, msg, ctx) {
    const { from, pushname } = ctx;
    try {
      // Neofetch
      const { stdout } = await exec('neofetch --stdout');
      const resultNeo = String(stdout).trim();
      await sock.sendMessage(from, {
        text: resultNeo }, {
        quoted: msg
      });

    } catch (errNeo) {
      console.log(`💬 ${pushname} Warn: neofetch gagal, try pake fastfetch`);
      try {
        // fastfetch
        const { stdout: stdoutFast } = await exec('fastfetch --pipe -l none | grep -v "\\[40m" | grep -v "\\[100m"');
        const resultFast = String(stdoutFast).trim();
        await sock.sendMessage(from, {
          text: resultFast }, {
          quoted: msg
        });

      } catch (errFast) {
        // Both Failed
        console.error(`💬 ${pushname} Error: stat failed:`, errFast);
        await sock.sendMessage(from, {
          text: `Error: exec neofetch and fastfetch coba cek server package lupa install paling` }, {
          quoted: msg
        });
      }
    }
  }
};