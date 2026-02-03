const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function getShop() {
    try {
        await client.connect();
        const res = await client.query('SELECT id, name FROM shops LIMIT 1');
        if (res.rows.length > 0) {
            console.log(`SHOP_ID: ${res.rows[0].id}`);
            console.log(`SHOP_NAME: ${res.rows[0].name}`);
        } else {
            console.log("No shops found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

getShop();
