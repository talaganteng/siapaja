const mysql = require('mysql2/promise');

async function insertData() {
    try {
        console.log('Connecting to TiDB...');
        const conn = await mysql.createConnection({
            host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
            port: 4000,
            user: 'MBnjyDAqyUp1LxV.root',
            password: 'HNAtpvbQDgDciM5y',
            database: 'siapaja',
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });
        
        console.log('Inserting new vendor and items...');
        
        await conn.query("INSERT IGNORE INTO users (id, name, email, password, role) VALUES (3, 'Apple Rental ID', 'applerental@example.com', 'hashedpassword', 'Vendor');");
        await conn.query("INSERT IGNORE INTO vendor_profiles (id, user_id, name, description, rating) VALUES (2, 3, 'Apple Rental ID', 'Spesialis penyewaan perangkat Apple original dan terbaru.', 4.9);");
        
        await conn.query(`
            INSERT INTO items (vendor_id, name, description, price_per_day, location, image_url, rating, reviews_count) 
            VALUES (
                2, 
                'iPhone 17 Pro Max 512GB - Titanium', 
                'Smartphone flagship terbaru dari Apple dengan chip A19 Pro, layar Super Retina XDR 6.9 inci, dan sistem kamera Pro revolusioner. Sangat cocok untuk pembuatan konten, vlogging, atau pemakaian sehari-hari selama liburan.', 
                450000.00, 
                'Jakarta Pusat', 
                'https://images.unsplash.com/photo-1695048132961-d703135fc7dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 
                5.0, 
                12
            )
        `);
        
        await conn.query(`
            INSERT INTO items (vendor_id, name, description, price_per_day, location, image_url, rating, reviews_count) 
            VALUES (
                2, 
                'MacBook Pro 16-inch M3 Max (36GB RAM)', 
                'Laptop profesional bertenaga monster dengan chip M3 Max. Dirancang untuk pekerjaan berat seperti video editing 8K, rendering 3D, dan kompilasi kode skala besar. Layar Liquid Retina XDR yang memukau.', 
                850000.00, 
                'Tangerang Selatan', 
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 
                4.8, 
                35
            )
        `);
        
        console.log('Data inserted successfully!');
        await conn.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
}
insertData();
