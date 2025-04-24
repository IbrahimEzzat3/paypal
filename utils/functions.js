require("dotenv").config();
const e = require("discord.js"),
  o = require(process.cwd() + "/config/messages.json"),
  s = require(process.cwd() + "/config/conf.json"),
  t = (t, r, m, i, n, d, l, c) =>
    new Promise((a, b) => {
      t.send(r, {
        embed: {
          color: e.resolveColor("f1645f"),
          title: m,
          description: i,
          fields: n,
          thumbnail: { url: l || "" },
          timestamp: s.embeds.main.timestamp ? new Date() : null,
          footer: { text: d || o.embeds.main.footer },
        },
        files: c,
      })
        .then((e) => {
          a(e);
        })
        .catch((e) => {
          b(e);
        });
    }),
  r = (t, r, m, i, n, d, l, c) =>
    new Promise((a, b) => {
      t.edit(r, {
        embed: {
          color: e.resolveColor("f1645f"),
          title: m,
          description: i,
          fields: n,
          thumbnail: { url: l || "" },
          timestamp: o.embeds.main.timestamp ? new Date() : null,
          footer: { text: d || o.embeds.main.footer },
        },
        files: c,
      })
        .then((e) => {
          a(e);
        })
        .catch((e) => {
          b(e);
        });
    }),
  m = (t, r, m, i) =>
    new Promise((n, d) => {
      t.send({
        embed: {
          color: e.resolveColor("E33B17"),
          title: r || o.embeds.error.title,
          description: m,
          footer: { text: i || "" },
          timestamp: new Date(),
        },
      })
        .then((e) => {
          n(e);
        })
        .catch((e) => {
          d(e);
        });
    }),
  i = (e, o) => {
    try {
      return e.roles.cache.some((e) => o.includes(e.name) || o.includes(e.id));
    } catch (e) {
      return debug(e.message), !1;
    }
  };
module.exports = { sendEmbed: t, editEmbed: r, sendError: m, hasRoles: i };
