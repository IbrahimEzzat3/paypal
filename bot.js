require("dotenv").config();
const e = require("discord.js"),
  o = require("chalk"),
  n = require("path"),
  s = require("fs");
function t(e) {
  console.log(o.red(e)), process.exit(1);
}
console.log(o.yellow("Starting bot...")),
  (() => {
    try {
      require(process.cwd() + "/config/conf.json"),
        require(process.cwd() + "/config/messages.json");
    } catch (e) {
      return (
        console.log(e.message),
        t("Invalid config file(s)! The bot will not start.")
      );
    }
    const i = require(process.cwd() + "/config/conf.json");
    if (!process.env.TOKEN)
      return t(
        `   ${process.env.TOKEN}
Missing bot token! Remember to change the token in the config.`
      );
    let l = new e.Client();
    (l.commands = new e.Collection()),
      s.readdir(n.join(__dirname, "/commands"), (e, n) => {
        e && console.log(e), console.log(o.yellow("Loading commands..."));
        let s = n.filter((e) => "js" === e.split(".").pop());
        s.length <= 0
          ? console.log(o.red("No commands were found!"))
          : s.forEach((e) => {
              let n = require(process.cwd() + `/commands/${e}`);
              console.log(o.green(`Attempting to load: ${e}`)),
                l.commands.set(n.info.name, n);
            });
      }),
      s.readdir(n.join(__dirname, "/events"), (e, n) => {
        e && console.log(e), console.log(o.yellow("Loading events..."));
        let s = n.filter((e) => "js" === e.split(".").pop());
        s.length <= 0
          ? console.log(o.red("No events were found!"))
          : s.forEach((e) => {
              console.log(o.green(`Attempting to load: ${e}`)),
                l.on(
                  e.split(".")[0],
                  require(process.cwd() + `/events/${e}`).bind(null, l)
                );
            });
      }),
      l
        .login(process.env.TOKEN)
        .catch(() =>
          t(
            "Please make sure you have the correct token set in the config file."
          )
        );
    const c = require("sqlite"),
      r = require("sqlite3");
    (async () => {
      (l.sql = await c.open({
        filename: process.cwd() + "/storage/invoices.sqlite",
        driver: r.Database,
      })),
        await l.sql.exec(
          "CREATE TABLE IF NOT EXISTS invoices (channel TEXT, message TEXT, invoice, lastCheck TEXT)"
        );
    })();
  })();
