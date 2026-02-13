const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanup() {
    try {
        await client.connect();

        console.log("--- CLEANING UP SALES DATA ---\n");

        // 1. Delete associated items first (if cascade is not set, but better safe)
        const deleteItems = await client.query('DELETE FROM sale_items');
        console.log(`Deleted ${deleteItems.rowCount} sale items.`);

        // 2. Delete sales
        const deleteSales = await client.query('DELETE FROM sales');
        console.log(`Deleted ${deleteSales.rowCount} sales transactions.`);

        console.log("\nCleanup Complete. Products and Shop settings are PRESERVED.");

    } catch (err) {
        console.error("Cleanup failed:", err);
    } finally {
        await client.end();
    }
}

cleanup();
