const fs = require("node:fs/promises");
const path = require("node:path");
const dns = require("node:dns");
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set your Supabase Postgres connection string.");
}

const useSsl = process.env.DB_SSL !== "false";
const forceIpv4 = process.env.DB_FORCE_IPV4 === "true";

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  // Render can fail to reach IPv6-only routes; forcing IPv4 avoids ENETUNREACH.
  ...(forceIpv4
    ? {
        lookup(hostname, options, callback) {
          return dns.lookup(hostname, { ...options, family: 4 }, callback);
        },
      }
    : {}),
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
