const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set your Supabase Postgres connection string.");
}

const useSsl = process.env.DB_SSL !== "false";

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initDatabase() {
  const schemaPath = path.join(process.cwd(), "data", "questionnaires.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf-8");
  await pool.query(schemaSql);
}

module.exports = { pool, query, initDatabase };
