require("dotenv").config();
("use strict");
const { URLSearchParams: e } = require("url"),
  n = require(process.cwd() + "/config/paypal.json"),
  t = require("node-fetch"),
  i = true ? "https://api.paypal.com/v2" : "https://api.sandbox.paypal.com/v2";
let a = null;
function o() {
  const i = new e();
  return (
    i.append("grant_type", "client_credentials"),
    t(
      true
        ? "https://api.paypal.com/v1/oauth2/token/"
        : "https://api.sandbox.paypal.com/v1/oauth2/token/",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${
                process.env.CLIENT_ID ||
                "AYNRc7RnsU0VOLZwXkxj1Q5ezcGYL-Wt9LHZZo27_5iWRsNjIZxTFkK3f2z39Fi0cFsFBfow0YvaCRBm"
              }:${
                process.env.CLIENT_SECRET ||
                "EBrm8MtZmITLUVZtEV2GxXwN7ELskY6YTiNahnSHpHh54dzQ8B240wn8iAOSd3XVHCD1_qLsPd9dhTWK"
              }`
            ).toString("base64"),
        },
        body: i,
      }
    ).then(async (e) => {
      let n = await e.json();
      if (!e.ok) throw `Could not authenticate: ${e.statusText}`;
      a = n.access_token;
    })
  );
}
function r(e) {
  return s(null, `${i}/invoicing/invoices/${e}/generate-qr-code`, {
    method: "POST",
  })
    .then((e) => e.text())
    .then((e) => {
      let n = "",
        t = [];
      for (let i = 0; i < e.length; i++)
        "\n" === e[i]
          ? ((n = n.replace("\r", "")) && t.push(n), (n = ""))
          : (n += e[i]);
      return t.splice(0, 3), t[0];
    });
}
const s = (e, n, i) =>
    new Promise(function (r, c) {
      (i = {
        ...i,
        headers: {
          Authorization: `Bearer ${a}`,
          "Content-Type": "application/json",
        },
      }),
        t(n, i).then(async (t) => {
          try {
            let a = await t.status;
            if (t.ok) return r(t);
            let l = await t.json();
            return 401 === a
              ? e
                ? c(Error(t.statusText))
                : (await o(), r(s(!0, n, i)))
              : c(l || Error(t.statusText));
          } catch (e) {
            return c(e);
          }
        });
    }),
  c = (e, n, t) =>
    new Promise((a, o) => {
      s(
        null,
        `${i}/invoicing/search-invoices?page=${t}&page_size=10&total_required=true`,
        {
          method: "POST",
          body: JSON.stringify({ recipient_email: e, status: [n] }),
        }
      )
        .then((e) => e.json())
        .then((e) => {
          a(e);
        })
        .catch((e) => {
          o(e);
        });
    }),
  l = (e) =>
    new Promise((n, t) => {
      r(e)
        .then((a) => {
          s(null, `${i}/invoicing/invoices/${e}`, { method: "GET" })
            .then((e) => e.json())
            .then((e) => {
              n({ invoice: e, image: a });
            })
            .catch((e) => {
              t(e);
            });
        })
        .catch((e) => {
          t(e);
        });
    }),
  u = async (e, t, a) => {
    let o = await s(null, `${i}/invoicing/invoices`, {
        method: "POST",
        body: JSON.stringify({
          invoicer: {
            business_name: "Evo Graph",
            website: "www.discord.gg/evo, www.evograph.shop/", // Array of websites
            logo_url:
              "https://res.cloudinary.com/dxfyhkj2l/image/upload/v1740257266/books/q80wgg59bd1k3leznykk.png",
            additional_notes: process.env.additionalNotes || "",
          },
          detail: {
            note: process.env.note || "",
            terms_and_conditions: process.env.termsAndConditions || "",
            currency_code: process.env.currencyCode || "USD",
          },
          items: [
            {
              name: a,
              unit_amount: {
                currency_code: process.env.currencyCode || "USD",
                value: t,
              },
              quantity: 1,
            },
          ],
          ...(false
            ? { primary_recipients: [{ billing_info: { email_address: e } }] }
            : {}),
          // configuration: {
          //   partial_payment: {
          //     allow_partial_payment: process.env.minimumAmount,
          //     ...(process.env.minimumAmount
          //       ? {
          //           minimum_amount_due: {
          //             currency_code: process.env.currencyCode || "USD",
          //             value: Math.max(
          //               t * parseFloat(process.env.percent),
          //               0
          //             ).toFixed(2),
          //           },
          //         }
          //       : {}),
          //   },
          // },
        }),
      }),
      r = await o.json(),
      c = await s(null, r.href, { method: r.method }),
      l = await c.json(),
      u = await s(null, l.links.find((e) => "send" === e.rel).href, {
        method: l.links.find((e) => "send" === e.rel).method,
        body: JSON.stringify({ send_to_recipient: !1 }),
      });
    return { invoice: l, payer_view: (await u.json()).href };
  };
const cancelInvoice = (invoiceId, cancelReason = "Canceled by merchant") => {
  return new Promise((resolve, reject) => {
    s(null, `${i}/invoicing/invoices/${invoiceId}/cancel`, {
      method: "POST",
      body: JSON.stringify({
        subject: "Invoice Canceled",
        note: cancelReason,
        send_to_recipient: true,
        additional_recipients: [],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = {
  createAndSend: u,
  getInvoiceInfo: l,
  generateQrCode: r,
  search: c,
  cancelInvoice: cancelInvoice,
};
