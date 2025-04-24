module.exports = (e, s) => {
  e.sql.run("DELETE FROM invoices WHERE message = ?", [s.id]);
};
