
import "dotenv/config";
import { createClient } from "@libsql/client";

async function checkDb() {
  const url = process.env.TURSO_URL || "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || "";
  
  const client = createClient({ url, authToken });
  
  try {
    console.log("Initializing tables...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        photo TEXT,
        terms_accepted BOOLEAN DEFAULT FALSE
      )
    `);
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pending_sessions (
        token TEXT PRIMARY KEY,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS oauth_states (
        state TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables:", tables.rows.map(r => r.name));
    
    if (tables.rows.some(r => r.name === 'oauth_states')) {
      const count = await client.execute("SELECT COUNT(*) as count FROM oauth_states");
      console.log("Total states in DB:", count.rows[0].count);
      
      const states = await client.execute("SELECT * FROM oauth_states ORDER BY created_at DESC LIMIT 10");
      console.log("Recent states:", states.rows);
      
      // Check for any state created in the last 5 minutes
      const recent = await client.execute("SELECT * FROM oauth_states WHERE created_at > datetime('now', '-5 minutes')");
      console.log("States created in last 5 mins:", recent.rows.length);
    } else {
      console.log("oauth_states table does not exist!");
    }
  } catch (err) {
    console.error("Error checking DB:", err);
  }
}

checkDb();
