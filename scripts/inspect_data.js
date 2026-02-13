const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        await client.connect();

        console.log("--- DATA INSPECTION ---\n");

        // 1. Count Sales
        const salesCount = await client.query('SELECT count(*) FROM sales');
        console.log(`Total Sales: ${salesCount.rows[0].count}`);

        if (salesCount.rows[0].count > 0) {
            console.log("Last 5 Sales:");
            const lastSales = await client.query(`
                SELECT id, created_at, total_amount, status 
                FROM sales 
                ORDER BY created_at DESC 
                LIMIT 5
            `);
            lastSales.rows.forEach(r => console.log(` - [${r.created_at}] ID: ${r.id}, Amount: ${r.total_amount}, Status: ${r.status}`));
        }
        console.log("\n");

        // 2. Count Products
        const productsCount = await client.query('SELECT count(*) FROM products');
        console.log(`Total Products: ${productsCount.rows[0].count}`);

        if (productsCount.rows[0].count > 0) {
            console.log("Last 5 Products Created:");
            const lastProducts = await client.query(`
                SELECT id, name, created_at, category 
                FROM products 
                ORDER BY created_at DESC 
                LIMIT 5
            `);
            lastProducts.rows.forEach(r => console.log(` - [${r.created_at}] ${r.name} (${r.category})`));
        }

    } catch (err) {
        console.error("Inspection failed:", err);
    } finally {
        await client.end();
    }
}

inspect();
