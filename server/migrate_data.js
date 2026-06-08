const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

async function migrate() {
    console.log('Starting migration...');
    const dbPath = path.join(__dirname, 'db.json');
    if (!fs.existsSync(dbPath)) {
        console.error('db.json not found!');
        return;
    }

    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Migrate Users
    if (db.users && db.users.length > 0) {
        console.log(`Migrating ${db.users.length} users...`);
        const { error } = await supabase.from('users').upsert(db.users);
        if (error) console.error('Error migrating users:', error.message);
    }

    // Migrate Products
    if (db.products && db.products.length > 0) {
        console.log(`Migrating ${db.products.length} products...`);
        const { error } = await supabase.from('products').upsert(db.products);
        if (error) console.error('Error migrating products:', error.message);
    }

    // Migrate Orders
    if (db.orders && db.orders.length > 0) {
        console.log(`Migrating ${db.orders.length} orders...`);
        const { error } = await supabase.from('orders').upsert(db.orders);
        if (error) console.error('Error migrating orders:', error.message);
    }

    console.log('Migration finished!');
}

migrate();
