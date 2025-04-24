module.exports = async (e, s) => {
  try {
    if (!["MESSAGE_REACTION_ADD"].includes(s.t)) return;
    let a = e.channels.cache.get(s.d.channel_id);
    if (
      !a ||
      "dm" === a.type ||
      !s.d.emoji.name ||
      e.user.id === e.users.cache.get(s.d.user_id) ||
      a.messages.cache.has(s.d.message_id || s.d.id)
    )
      return;
    let c = await a.messages.fetch(s.d.message_id);
    if (!(await e.sql.get("SELECT * FROM invoices WHERE message = ?", [c.id])))
      return;
    if (!c.reactions.cache.get(s.d.emoji.name)) return;
    c.reactions.cache
      .get(s.d.emoji.name)
      .users.cache.set(s.d.user_id, e.users.cache.get(s.d.user_id)),
      "MESSAGE_REACTION_ADD" === s.t &&
        e.emit(
          "messageReactionAdd",
          c.reactions.cache.get(s.d.emoji.name),
          e.users.cache.get(s.d.user_id)
        );
  } catch (e) {
    console.error(e);
  }
};
