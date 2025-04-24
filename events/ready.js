require("dotenv").config();
const e = require(process.cwd() + "/config/conf.json"),
  o = require("chalk");
module.exports = (l, s) => {
  console.log(o.yellow("=================================")),
    console.log(o.cyan(`    Logged in as ${l.user.tag}!`)),
    console.log(o.yellow("=================================")),
    l.user.setActivity("Server Link: ", {
      type: "https://discord.gg/evo" || "WATCHING",
    });
};
