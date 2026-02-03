const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Load env validation
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function runUpdate() {
    try {
        await client.connect();
        console.log("Connected to database...");

        const sqlPath = path.join(__dirname, '../update_inventory_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Running schema update for inventory...");
        await client.query(sql);

        console.log("Schema updated successfully!");
    } catch (err) {
        console.error("Schema update failed:", err);
    } finally {
        await client.end();
    }
}

runUpdate();
