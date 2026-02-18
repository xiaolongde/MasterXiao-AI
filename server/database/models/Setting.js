/**
 * 系统配置模型
 */
import { queryAll, queryOne, execute } from '../index.js';

export const Setting = {
    /**
     * 获取配置项
     */
    get(key) {
        const result = queryOne('SELECT * FROM settings WHERE key = ?', [key]);
        return result?.value || null;
    },

    /**
     * 设置配置项
     */
    set(key, value, description = '') {
        const existing = queryOne('SELECT * FROM settings WHERE key = ?', [key]);
        
        if (existing) {
            execute(
                'UPDATE settings SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
                [value, description || existing.description, key]
            );
        } else {
            execute(
                'INSERT INTO settings (key, value, description) VALUES (?, ?, ?)',
                [key, value, description]
            );
        }

        return { key, value, description };
    },

    /**
     * 删除配置项
     */
    delete(key) {
        return execute('DELETE FROM settings WHERE key = ?', [key]);
    },

    /**
     * 获取所有配置项
     */
    getAll() {
        return queryAll('SELECT * FROM settings ORDER BY key');
    },

    /**
     * 批量设置配置项
     */
    setMany(settings) {
        const results = [];
        for (const [key, value] of Object.entries(settings)) {
            results.push(this.set(key, value));
        }
        return results;
    },

    /**
     * 获取配置项并解析为对象
     */
    getAsObject() {
        const settings = this.getAll();
        const result = {};
        for (const setting of settings) {
            try {
                result[setting.key] = JSON.parse(setting.value);
            } catch {
                result[setting.key] = setting.value;
            }
        }
        return result;
    }
};

export default Setting;
