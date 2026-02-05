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

        const sqlPath = path.join(__dirname, '../fix_user_profiles_rls.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Running RLS fix for user_profiles...");
        await client.query(sql);

        console.log("RLS policies applied successfully!");
    } catch (err) {
        console.error("RLS fix failed:", err);
    } finally {
        await client.end();
    }
}

runUpdate();
