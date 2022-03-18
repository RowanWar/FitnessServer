const { Pool } = require("pg");
// const config = require("config");

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: "postgres",
  password: "Heinz99",
  database: "fitnessdb",
});

module.exports = pool;
