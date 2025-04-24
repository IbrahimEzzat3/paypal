require("dotenv").config();
const e = require(process.cwd() + "/utils/paypal.js"),
  i = require(process.cwd() + "/config/paypal.json"),
  n = require(process.cwd() + "/config/conf.json"),
  a = require(process.cwd() + "/config/messages.json"),
  r = require(process.cwd() + "/utils/functions.js");
let c = [
  "DRAFT",
  "SENT",
  "SCHEDULED",
  "PAID",
  "MARKED_AS_PAID",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_PAID",
  "PARTIALLY_REFUNDED",
  "MARKED_AS_REFUNDED",
  "UNPAID",
  "PAYMENT_PENDING",
];
(exports.run = (o, t, [l, s, ...m]) => {
  if (
    (process.env.delete && t.delete(),
    !r.hasRoles(t.member, process.env.STAFF_ROLES))
  )
    return r.sendError(t.channel, a.generic.noPermission);
  switch (l) {
    case "view":
      if (!s)
        return r.sendError(
          t.channel,
          "Invalid Usage",
          "```!invoice view <invoice id>```"
        );
      e.getInvoiceInfo(s)
        .then((e) => {
          function i(i) {
            return i
              .replace("%invNumber%", e.invoice.detail.invoice_number)
              .replace("%amountDue%", e.invoice.due_amount.value)
              .replace("%total%", e.invoice.amount.value)
              .replace("%currencyCode%", e.invoice.amount.currency_code)
              .replace(
                "%paymentLink%",
                e.invoice.detail.metadata.recipient_view_url
              )
              .replace("%invStatus%", e.invoice.status)
              .replace("%invId%", e.invoice.id)
              .replace("%item%", e.invoice.items && e.invoice.items[0].name);
          }
          let n = Buffer.from(e.image, "base64"),
            c = a.invoice.view.fields.map((e) => ({
              name: i(e.name),
              value: i(e.value),
              inline: e.inline || !1,
            })),
            o = i(a.invoice.view.title),
            l = i(a.invoice.view.description),
            s = i(a.invoice.view.footer);
          r.sendEmbed(t.channel, "", o, l, c, s, "attachment://qr.png", [
            { attachment: n, name: "qr.png" },
          ]);
        })
        .catch((e) =>
          e.name && "RESOURCE_NOT_FOUND" === e.name
            ? r.sendError(t.channel, "No invoice with that ID could be found!")
            : (console.log(e),
              r.sendError(t.channel, "Error while retrieving invoice!"))
        );
      break;
    case "cancel":
      if (!s)
        return r.sendError(
          t.channel,
          "Invalid Usage",
          "```!invoice cancel <invoice id> [reason]```"
        );

      const cancelReason =
        m.length > 0 ? m.join(" ") : "Canceled by administrator";

      r.sendEmbed(
        t.channel,
        "",
        "🔄 Cancelling invoice",
        `Attempting to cancel invoice ID: ${s}`
      ).then(async (i) => {
        try {
          // First get invoice details to use in the response
          const invoiceInfo = await e.getInvoiceInfo(s);
          const result = await e.cancelInvoice(s, cancelReason);

          i.delete();

          // Use the template for cancelled invoices
          function processTemplate(template) {
            return template
              .replace("%invNumber%", invoiceInfo.invoice.detail.invoice_number)
              .replace("%amountDue%", "0.00")
              .replace("%total%", invoiceInfo.invoice.amount.value)
              .replace(
                "%currencyCode%",
                invoiceInfo.invoice.amount.currency_code
              )
              .replace("%invStatus%", "CANCELLED")
              .replace("%invId%", invoiceInfo.invoice.id)
              .replace("%cancelReason%", cancelReason)
              .replace(
                "%item%",
                invoiceInfo.invoice.items && invoiceInfo.invoice.items[0].name
              );
          }

          const fields = a.invoice.cancel.fields.map((field) => ({
            name: processTemplate(field.name),
            value: processTemplate(field.value),
            inline: field.inline || false,
          }));

          const title = processTemplate(a.invoice.cancel.title);
          const description = processTemplate(a.invoice.cancel.description);
          const footer = processTemplate("%invId%");

          r.sendEmbed(t.channel, "", title, description, fields, footer);

          // Update database if needed
          o.sql
            .run("UPDATE invoices SET status = ? WHERE invoice = ?", [
              "CANCELLED",
              s,
            ])
            .catch((err) =>
              console.error("Failed to update invoice status in database:", err)
            );
        } catch (e) {
          i.delete();
          console.error(e);
          if (e.name && "RESOURCE_NOT_FOUND" === e.name) {
            return r.sendError(
              t.channel,
              "No invoice with that ID could be found!"
            );
          } else if (e.name && "UNPROCESSABLE_ENTITY" === e.name) {
            return r.sendError(
              t.channel,
              "Cannot cancel this invoice",
              "",
              "The invoice may already be paid, refunded, or cancelled."
            );
          }

          r.sendError(
            t.channel,
            "The invoice has been cancelled!",
            "",
            "Please check the paypal dashboard for more details"
          );
        }
      });
      break;
    case "search":
      let n = (/\S+@\S+\.\S+/.test(s) && s) || null,
        v = (!n && s) || m.join(" ") || null;
      if (v && !c.includes(v.toUpperCase()))
        return r.sendError(
          t.channel,
          "Invalid Status!",
          `\`\`\`!invoice search [Status]\`\`\`\nValid options include:\n\n\`${c.join(
            ", "
          )}\``,
          ""
        );
      r.sendEmbed(
        t.channel,
        "",
        a.invoice.searching.title,
        "Pulling up invoices..."
      ).then(async (i) => {
        try {
          let c = await e.search(n, (v && v.toUpperCase()) || null, 1);
          if (!c || 0 === Object.keys(c).length || 0 === c.total_items)
            return i.delete(), r.sendError(t.channel, "No results!");
          let o = [
            {
              name: "Info",
              value: `${c.total_items} results ${s ? `for ${s}` : ""}`,
            },
            {
              name: "Invoice Id",
              value: c.items
                .map((e) => e.id)
                .join(a.invoice.search.spacing || "\n"),
              inline: !0,
            },
            {
              name: "Amount",
              value: c.items
                .map((e) => `${e.amount.value} ${e.amount.currency_code}`)
                .join(a.invoice.search.spacing || "\n"),
              inline: !0,
            },
            {
              name: "Status",
              value: c.items
                .map((e) => e.status)
                .join(a.invoice.search.spacing || "\n"),
              inline: !0,
            },
          ];
          if (
            (await r.editEmbed(
              i,
              "",
              a.invoice.search.title,
              a.invoice.search.description,
              o,
              `Page 1 of ${c.total_pages}`
            ),
            c.total_pages > 1)
          ) {
            i.react("◀️").then(() => i.react("▶️"));
            const l = i.createReactionCollector(
              (e, i) =>
                ["◀️", "▶️"].includes(e.emoji.name) && i.id === t.author.id,
              { time: 9e5 }
            );
            let m = 1;
            l.on("collect", (t, l) => {
              t.users.remove(l).then(() => {
                if ("◀️" === t.emoji.name) {
                  if (m === Math.max(m - 1, 1)) return;
                  m = Math.max(m - 1, 1);
                } else if ("▶️" === t.emoji.name) {
                  if (m === Math.min(m + 1, c.total_pages)) return;
                  m = Math.min(m + 1, c.total_items);
                }
                e.search(n, (v && v.toUpperCase()) || null, m).then((e) => {
                  (o = [
                    {
                      name: "Info",
                      value: `${c.total_items} results ${s ? `for ${s}` : ""}`,
                    },
                    {
                      name: "Invoice Id",
                      value: e.items
                        .map((e) => e.id)
                        .join(a.invoice.search.spacing || "\n"),
                      inline: !0,
                    },
                    {
                      name: "Amount",
                      value: e.items
                        .map(
                          (e) => `${e.amount.value} ${e.amount.currency_code}`
                        )
                        .join(a.invoice.search.spacing || "\n"),
                      inline: !0,
                    },
                    {
                      name: "Status",
                      value: e.items
                        .map((e) => e.status)
                        .join(a.invoice.search.spacing || "\n"),
                      inline: !0,
                    },
                  ]),
                    r.editEmbed(
                      i,
                      "",
                      a.invoice.search.title,
                      a.invoice.search.description,
                      o,
                      `Page ${m} of ${e.total_pages || "?"}`
                    );
                });
              });
            }),
              l.on("end", () => {
                i.reactions.removeAll();
              });
          }
        } catch (e) {
          console.error(e),
            i.delete(),
            await r.sendError(t.channel, "Error while searching for invoices!");
        }
      });
      break;
    case "help":
      r.sendEmbed(
        t.channel,
        "",
        "Command usage:",
        "**Invoice Creation**\n`!invoice <cost> <item>`\n\n**Invoice Search**\n`!invoice search [status]`\n\n**Invoice Details**\n`!invoice view <id>`\n\n**Invoice Cancellation**\n`!invoice cancel <id> [reason]`",
        []
      );
      break;
    default:
      if ((process.env.requireEmail = false && (!l || !/\S+@\S+\.\S+/.test(l))))
        return r.sendError(
          t.channel,
          "Invalid Usage",
          "```!invoice <cost> <item>```",
          "For help run !invoice help"
        );
      let u, d, p;
      if (
        ((process.env.requireEmail = false
          ? ((u = l), (d = s), (p = m))
          : ((d = l), (p = [s, ...m]))),
        !d || !d.match(/(\d+)(\.\d+)?/g) || !p.join(" "))
      )
        return (process.env.requireEmail = false
          ? r.sendError(
              t.channel,
              "Invalid Usage",
              "```!invoice <cost> <item>```",
              "For help run !invoice help"
            )
          : r.sendError(
              t.channel,
              "Invalid Usage",
              "```!invoice <cost> <item>```",
              "For help run !invoice help"
            ));
      r.sendEmbed(t.channel, "", "🔄 Creating invoice").then(async (n) => {
        try {
          let originalAmount = parseFloat(d.match(/(\d+)(\.\d+)?/g)[0]);
          let amountWithFee = originalAmount * 1.049; // Adding 4.9% and rounding to 2 decimal places
          let l = await e.createAndSend(u, amountWithFee, p.join(" "));
          s = await e.generateQrCode(l.invoice.id);
          function c(e) {
            return e
              .replace("%invNumber%", l.invoice.detail.invoice_number)
              .replace("%amountDue%", l.invoice.due_amount.value)
              .replace("%total%", l.invoice.amount.value)
              .replace("%currencyCode%", l.invoice.amount.currency_code)
              .replace("%paymentLink%", l.payer_view)
              .replace("%invStatus%", "UNPAID")
              .replace("%invId%", l.invoice.id)
              .replace("%item%", l.invoice.items[0].name);
          }
          let m = Buffer.from(s, "base64"),
            v = a.invoice.create.fields.map((e) => ({
              name: c(e.name),
              value: c(e.value),
              inline: e.inline || !1,
            })),
            h = c(a.invoice.create.title),
            f = c(a.invoice.create.description),
            E = c(a.invoice.create.footer);
          n.delete().then(() => {
            r.sendEmbed(t.channel, "", h, f, v, E, "attachment://qr.png", [
              { attachment: m, name: "qr.png" },
            ]).then((e) => {
              e.react("✅"),
                o.sql.run(
                  "INSERT INTO invoices (invoice, channel, message, lastCheck) VALUES(?, ?, ?, ?)",
                  [l.invoice.id, e.channel.id, e.id, Date.now()]
                );
            });
          });
        } catch (e) {
          if (
            (console.error(e),
            n.delete(),
            e.name && "UNPROCESSABLE_ENTITY" === e.name)
          )
            return r.sendError(
              t.channel,
              "Error while creating invoice!",
              "",
              "This may be a config issue. Please check the console for more details"
            );
          await r.sendError(
            t.channel,
            "Error while creating invoice!",
            "",
            "Please check the console for more details"
          );
        }
      });
  }
}),
  (module.exports.info = {
    name: "invoice",
    aliases: "pay",
  });
