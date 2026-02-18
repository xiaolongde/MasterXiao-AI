import { initDatabase, execute, queryAll } from './server/database/index.js';

async function test() {
    const db = await initDatabase();
    
    // 检查表结构
    const cols = db.exec('PRAGMA table_info(xhs_menus)');
    console.log('Table columns:', cols[0].values.map(r => r[1]));
    
    // 测试直接用 db.run 插入
    try {
        db.run("INSERT INTO xhs_menus (name, description, status, created_at, updated_at) VALUES ('direct_test', 'direct_desc', 1, '2025-01-01', '2025-01-01')");
        console.log('db.run INSERT OK');
    } catch(e) {
        console.error('db.run INSERT FAIL:', e.message);
    }

    // 测试通过 execute 函数插入
    try {
        const result = execute(
            'INSERT INTO xhs_menus (name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            ['exec_test', 'exec_desc', 1, '2025-01-01', '2025-01-01']
        );
        console.log('execute INSERT OK, id:', result.lastInsertRowid);
    } catch(e) {
        console.error('execute INSERT FAIL:', e.message);
    }

    // 查询结果
    const rows = queryAll('SELECT * FROM xhs_menus');
    console.log('All rows:', rows);

    process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
