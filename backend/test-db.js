const mysql = require('mysql2/promise');
const fs = require('fs');

async function test() {
    try {
        console.log('Connecting to TiDB...');
        const conn = await mysql.createConnection({
            host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
            port: 4000,
            user: 'MBnjyDAqyUp1LxV.root',
            password: 'HNAtpvbQDgDciM5y',
            database: 'test',
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });
        console.log('Connected! Creating tables...');
        
        const sql = fs.readFileSync('database.sql', 'utf8');
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (let stmt of statements) {
            await conn.query(stmt);
        }
        
        console.log('Tables created successfully!');
        await conn.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
