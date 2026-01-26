const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        await client.connect();
        console.log("Connected to database...");

        // 1. Insert Shop
        console.log("Seeding Shop...");
        // Check if shop exists first to avoid duplicates if run multiple times
        const shopRes = await client.query(`
            INSERT INTO shops (name, address, phone) 
            VALUES ('Main Street Chicken', '123 Main St, Singapore', '+65 9123 4567') 
            ON CONFLICT DO NOTHING
            RETURNING id;
        `);

        let shopId;
        if (shopRes.rows.length > 0) {
            shopId = shopRes.rows[0].id;
            console.log("Created Shop:", shopId);
        } else {
            const existing = await client.query("SELECT id FROM shops WHERE name = 'Main Street Chicken' LIMIT 1");
            shopId = existing.rows[0].id;
            console.log("Using existing Shop:", shopId);
        }

        // 2. Insert Products
        console.log("Seeding Products...");
        const products = [
            { name: "Whole Chicken", category: "Raw", price: 15.00 },
            { name: "Chicken Breast (1kg)", category: "Parts", price: 18.50 },
            { name: "Chicken Wings (1kg)", category: "Parts", price: 12.00 },
            { name: "Drumsticks (1kg)", category: "Parts", price: 11.00 },
            { name: "Spicy Marinade", category: "Condiments", price: 5.00 }
        ];

        for (const p of products) {
            await client.query(`
                INSERT INTO products (name, category, base_price, is_active)
                VALUES ($1, $2, $3, true)
            `, [p.name, p.category, p.price]);
        }
        console.log(`Seeded ${products.length} products.`);

        // 3. Insert Inventory for the Shop
        console.log("Seeding Inventory...");
        const allProducts = await client.query("SELECT id FROM products");

        for (const prod of allProducts.rows) {
            await client.query(`
                INSERT INTO inventory (shop_id, product_id, quantity)
                VALUES ($1, $2, 100)
                ON CONFLICT (shop_id, product_id) DO UPDATE SET quantity = 100
            `, [shopId, prod.id]);
        }
        console.log("Inventory initialized.");

    } catch (err) {
        console.error("Seed failed:", err);
    } finally {
        await client.end();
    }
}

seed();
