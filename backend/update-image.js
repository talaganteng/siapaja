const mysql = require('mysql2/promise');

async function updateData() {
    try {
        const conn = await mysql.createConnection({
            host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
            port: 4000,
            user: 'MBnjyDAqyUp1LxV.root',
            password: 'HNAtpvbQDgDciM5y',
            database: 'siapaja',
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });
        
        await conn.query(`
            UPDATE items 
            SET image_url = 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
            WHERE name LIKE '%iPhone 17%'
        `);
        
        console.log('Image updated!');
        await conn.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
}
updateData();
