const fs = require('fs');
const path = require('path');

// Handler commands
function loadCommands() {
  const list = [];
  const files = fs.readdirSync(__dirname).filter((f) => f !== 'index.js' && f.endsWith('.js'));

  for (const file of files) {
    const command = require(path.join(__dirname, file));

    if (!command.triggers || !command.handler) {
      console.warn(`[commands] "${file}" skip: needed export { triggers, handler }`);
      continue;
    }

    list.push(command);
  }

  return list;
}

// Baca Pesan dari prefix dilanjutkan dengan argumen selanjutnya
// .dl https:// dengan regex
function resolveCommand(commandList, body) {
  const lower = body.toLowerCase();

  for (const command of commandList) {
    for (const trigger of command.triggers) {
        if (trigger instanceof RegExp) {
        if (trigger.test(body)) {
          return { handler: command.handler, args: body }; 
        }
        continue;
      }
      const t = trigger.toLowerCase();

      if (lower === t) {
        return { handler: command.handler, args: '' };
      }
      if (lower.startsWith(`${t} `)) {
        return { handler: command.handler, args: body.slice(trigger.length).trim() };
      }
    }
  }

  return null;
}

module.exports = { loadCommands, resolveCommand };