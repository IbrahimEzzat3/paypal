require("dotenv").config();
const e = require(process.cwd() + "/utils/paypal.js"),
  i = require(process.cwd() + "/utils/functions.js"),
  a = require(process.cwd() + "/config/messages.json"),
  n = require(process.cwd() + "/config/conf.json");
module.exports = async (t, s, c) => {
  if (!c.bot && s.message.author.id === t.user.id)
    try {
      let o = await t.sql.get("SELECT * FROM invoices WHERE message = ?", [
        s.message.id,
      ]);
      if (!o || "✅" !== s.emoji.name) return;
      if (
        (await s.users.remove(c),
        process.env.INVOICE_CHECK_TIME_LIMIT > 0 &&
          Math.floor((Date.now() - parseInt(o.lastCheck)) / 1e3) <= 0)
      )
        return i
          .sendError(
            s.message.channel,
            "",
            `Please wait \`${Math.floor(
              (Date.now() - parseInt(o.lastCheck)) / 1e3
            )}\` seconds before trying again`
          )
          .then((e) => e.delete({ timeout: 1e4 }));
      let l = await e.getInvoiceInfo(o.invoice);
      if (!l) return i.sendError(s.message.channel, "Invoice not found!");
      let m = l.invoice;
      function r(e) {
        return e
          .replace("%invNumber%", m.detail.invoice_number)
          .replace("%amountDue%", m.due_amount.value)
          .replace("%total%", m.amount.value)
          .replace("%currencyCode%", m.amount.currency_code)
          .replace("%paymentLink%", m.detail.metadata.recipient_view_url)
          .replace("%invStatus%", m.status)
          .replace("%invId%", m.id)
          .replace("%item%", m.items[0].name);
      }
      if (
        (t.sql.run("UPDATE invoices SET lastCheck = ? WHERE message = ?", [
          Date.now(),
          s.message.id,
        ]),
        "PAID" === m.status)
      ) {
        let e = r(a.invoiceCheck.paid.title),
          n = r(a.invoiceCheck.paid.description),
          c = a.invoiceCheck.paid.fields.map((e) => ({
            name: r(e.name),
            value: r(e.value),
            inline: e.inline || !1,
          })),
          o = r(a.invoiceCheck.paid.footer);
        await s.message.delete(),
          await i.sendEmbed(s.message.channel, "", e, n, c, o),
          t.sql.run("DELETE FROM invoices WHERE message = ?", [s.message.id]);
      } else if ("PARTIALLY_PAID" === m.status) {
        let e = r(a.invoiceCheck.partialPayment.title),
          n = r(a.invoiceCheck.partialPayment.description),
          t = a.invoiceCheck.partialPayment.fields.map((e) => ({
            name: r(e.name),
            value: r(e.value),
            inline: e.inline || !1,
          })),
          c = r(a.invoiceCheck.partialPayment.footer);
        await i.editEmbed(s.message, "", e, n, t, c, "attachment://qr.png");
      } else {
        let e = r(a.invoiceCheck.unpaid.title),
          n = r(a.invoiceCheck.unpaid.description),
          t = a.invoiceCheck.unpaid.fields.map((e) => ({
            name: r(e.name),
            value: r(e.value),
            inline: e.inline || !1,
          })),
          c = r(a.invoiceCheck.unpaid.footer);
        i.sendEmbed(s.message.channel, "", e, n, t, c).then((e) =>
          e.delete({ timeout: 1e4 })
        );
      }
    } catch (e) {
      console.error(e);
    }
};
