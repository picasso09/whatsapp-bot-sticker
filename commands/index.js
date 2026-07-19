const fs = require('fs');
const path = require('path');

// Handler commands
function loadCommands() {
  const map = new Map();
  const files = fs.readdirSync(__dirname).filter((f) => f !== 'index.js' && f.endsWith('.js'));

  for (const file of files) {
    const command = require(path.join(__dirname, file));

    if (!command.triggers || !command.handler) {
      console.warn(`[commands] "${file}" skip: needed export { triggers, handler }`);
      continue;
    }

    for (const trigger of command.triggers) {
      map.set(trigger.toLowerCase(), command.handler);
    }
  }

  return map;
}

module.exports = { loadCommands };