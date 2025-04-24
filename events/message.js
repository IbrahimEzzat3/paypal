require("dotenv").config();
const e = require(process.cwd() + "/config/conf.json");
module.exports = (t, n) => {
  if ("dm" === n.channel.type) return;
  if (n.author.bot) return;
  if (!n.content.startsWith(e.prefix)) return;
  let i = n.content.slice(e.prefix.length).trim().split(/ +/g),
    r = i.shift().toLowerCase(),
    s =
      t.commands.get(r) ||
      t.commands
        .filter((e) => e.info.aliases)
        .find((e) => e.info.aliases.includes(r));
  s && s.run(t, n, i);
};
