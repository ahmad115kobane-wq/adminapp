/**
 * Database Manager - إدارة قاعدة البيانات
 * sql.js (SQLite نقي بـ JavaScript — بدون compilation)
 * جداول: users, subscriptions, sessions, plans
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'apptv.db');

// توليد مفتاح ترخيص فريد
function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 4; i++) {
        let seg = '';
        for (let j = 0; j < 4; j++) {
            seg += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(seg);
    }
    return segments.join('-');
}

let db = null;
let saveTimer = null;

// ===================== Core DB =====================

function saveToDisk() {
    if (!db) return;
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (e) {
        console.error('[DB] خطأ في الحفظ:', e.message);
    }
}

// حفظ مؤجل (كل 2 ثانية كحد أقصى لتجنب الكتابة المتكررة)
function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveToDisk();
        saveTimer = null;
    }, 2000);
}

function run(sql, params = []) {
    db.run(sql, params);
    scheduleSave();
    return { changes: db.getRowsModified() };
}

function get(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}

function all(sql, params = []) {
    const results = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// ===================== Init =====================

async function initDatabase() {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    const SQL = await initSqlJs();

    // تحميل قاعدة بيانات موجودة أو إنشاء جديدة
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');

    // إنشاء الجداول
    db.run(`
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_ar TEXT NOT NULL,
            duration_days INTEGER NOT NULL,
            price REAL NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            license_key TEXT UNIQUE,
            max_devices INTEGER NOT NULL DEFAULT 1,
            is_blocked INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            notes TEXT DEFAULT ''
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            plan_id TEXT NOT NULL,
            start_date TEXT NOT NULL DEFAULT (datetime('now')),
            end_date TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (plan_id) REFERENCES plans(id)
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            device_id TEXT NOT NULL,
            device_info TEXT DEFAULT '',
            ip_address TEXT DEFAULT '',
            last_check TEXT NOT NULL DEFAULT (datetime('now')),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            is_active INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            action TEXT NOT NULL,
            details TEXT DEFAULT '',
            ip_address TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    // Migration: إضافة license_key للقواعد القديمة
    try { db.run('ALTER TABLE users ADD COLUMN license_key TEXT'); } catch(e) {}

    // توليد مفاتيح للمستخدمين بدون مفتاح
    try {
        const usersNoKey = all("SELECT id FROM users WHERE license_key IS NULL OR license_key = ''");
        for (const u of usersNoKey) {
            run('UPDATE users SET license_key = ? WHERE id = ?', [generateLicenseKey(), u.id]);
        }
    } catch(e) { console.log('[DB] Migration note:', e.message); }

    // فهارس
    try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_license ON users(license_key)'); } catch(e) {}
    db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    db.run('CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active, end_date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)');
    db.run('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id)');

    // إضافة الباقات الافتراضية
    const planCount = get('SELECT COUNT(*) as c FROM plans');
    if (!planCount || planCount.c === 0) {
        run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES (?, ?, ?, ?, ?)',
            ['plan_1d', '1 Day', 'يوم واحد', 1, 0]);
        run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES (?, ?, ?, ?, ?)',
            ['plan_1m', '1 Month', 'شهر واحد', 30, 0]);
        run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES (?, ?, ?, ?, ?)',
            ['plan_3m', '3 Months', '3 أشهر', 90, 0]);
        run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES (?, ?, ?, ?, ?)',
            ['plan_7m', '7 Months', '7 أشهر', 210, 0]);
        run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES (?, ?, ?, ?, ?)',
            ['plan_1y', '1 Year', 'سنة كاملة', 365, 0]);
    }

    saveToDisk();
    console.log('[DB] قاعدة البيانات جاهزة');
    return db;
}

// ===================== Users =====================

function createUser(username, password, maxDevices = 1, notes = '') {
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 12);
    const licenseKey = generateLicenseKey();

    try {
        run(`INSERT INTO users (id, username, password_hash, license_key, max_devices, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, username.trim(), passwordHash, licenseKey, maxDevices, notes]);

        logActivity(id, 'USER_CREATED', `تم إنشاء المستخدم: ${username}`);
        return { success: true, userId: id, licenseKey };
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
            return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
        }
        return { success: false, error: err.message };
    }
}

function getUser(userId) {
    return get('SELECT * FROM users WHERE id = ?', [userId]);
}

function getUserByUsername(username) {
    return get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username]);
}

function getAllUsers() {
    return all(`
        SELECT u.*,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.is_active = 1) as active_devices,
            (SELECT sub.end_date FROM subscriptions sub WHERE sub.user_id = u.id AND sub.is_active = 1
             ORDER BY sub.end_date DESC LIMIT 1) as subscription_end,
            (SELECT p.name_ar FROM subscriptions sub
             JOIN plans p ON sub.plan_id = p.id
             WHERE sub.user_id = u.id AND sub.is_active = 1
             ORDER BY sub.end_date DESC LIMIT 1) as plan_name
        FROM users u
        ORDER BY u.created_at DESC
    `);
}

function updateUser(userId, updates) {
    const fields = [];
    const values = [];

    if (updates.max_devices !== undefined) {
        fields.push('max_devices = ?');
        values.push(updates.max_devices);
    }
    if (updates.is_blocked !== undefined) {
        fields.push('is_blocked = ?');
        values.push(updates.is_blocked ? 1 : 0);
    }
    if (updates.password) {
        fields.push('password_hash = ?');
        values.push(bcrypt.hashSync(updates.password, 12));
    }
    if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
    }

    if (fields.length === 0) return { success: false, error: 'لا توجد تحديثات' };

    fields.push("updated_at = datetime('now')");
    values.push(userId);

    run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    logActivity(userId, 'USER_UPDATED', JSON.stringify(updates));
    return { success: true };
}

function deleteUser(userId) {
    const user = getUser(userId);
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    run('DELETE FROM sessions WHERE user_id = ?', [userId]);
    run('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
    run('DELETE FROM users WHERE id = ?', [userId]);
    logActivity(null, 'USER_DELETED', `تم حذف: ${user.username}`);
    return { success: true };
}

function blockUser(userId, block = true) {
    run("UPDATE users SET is_blocked = ?, updated_at = datetime('now') WHERE id = ?",
        [block ? 1 : 0, userId]);
    if (block) {
        run('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [userId]);
    }
    logActivity(userId, block ? 'USER_BLOCKED' : 'USER_UNBLOCKED', '');
    return { success: true };
}

// ===================== Subscriptions =====================

function createSubscription(userId, planId) {
    const plan = get('SELECT * FROM plans WHERE id = ?', [planId]);
    if (!plan) return { success: false, error: 'الباقة غير موجودة' };

    run('UPDATE subscriptions SET is_active = 0 WHERE user_id = ?', [userId]);

    const id = uuidv4();
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();

    run(`INSERT INTO subscriptions (id, user_id, plan_id, start_date, end_date, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, userId, planId, startDate, endDate]);

    logActivity(userId, 'SUBSCRIPTION_CREATED', `باقة: ${plan.name_ar} | ينتهي: ${endDate}`);
    return { success: true, subscriptionId: id, endDate };
}

function getActiveSubscription(userId) {
    return get(`
        SELECT s.*, p.name as plan_name, p.name_ar as plan_name_ar, p.duration_days
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.user_id = ? AND s.is_active = 1 AND s.end_date > datetime('now')
        ORDER BY s.end_date DESC
        LIMIT 1
    `, [userId]);
}

function checkSubscriptionValid(userId) {
    const sub = getActiveSubscription(userId);
    if (!sub) return { valid: false, reason: 'لا يوجد اشتراك فعّال' };

    const now = new Date();
    const endDate = new Date(sub.end_date);
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    return { valid: true, subscription: sub, daysLeft, endDate: sub.end_date };
}

function cleanExpiredSubscriptions() {
    const result = run(`
        UPDATE subscriptions SET is_active = 0
        WHERE is_active = 1 AND end_date <= datetime('now')
    `);
    if (result.changes > 0) console.log(`[DB] تم إلغاء ${result.changes} اشتراك منتهي`);
    return result.changes;
}

// ===================== Sessions =====================

function createSession(userId, token, deviceId, deviceInfo = '', ipAddress = '') {
    const user = getUser(userId);
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    const activeCount = get(
        'SELECT COUNT(*) as c FROM sessions WHERE user_id = ? AND is_active = 1', [userId]
    );

    if (activeCount && activeCount.c >= user.max_devices) {
        const oldest = get(
            'SELECT id FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY last_check ASC LIMIT 1',
            [userId]
        );
        if (oldest) run('DELETE FROM sessions WHERE id = ?', [oldest.id]);
    }

    const id = uuidv4();
    run(`INSERT INTO sessions (id, user_id, token, device_id, device_info, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, token, deviceId, deviceInfo, ipAddress]);

    logActivity(userId, 'SESSION_CREATED', `جهاز: ${deviceInfo} | IP: ${ipAddress}`);
    return { success: true, sessionId: id };
}

function validateSession(token) {
    const session = get(`
        SELECT s.*, u.username, u.is_blocked, u.max_devices
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.is_active = 1
    `, [token]);

    if (!session) return { valid: false, reason: 'جلسة غير صالحة' };
    if (session.is_blocked) return { valid: false, reason: 'الحساب محظور' };

    run("UPDATE sessions SET last_check = datetime('now') WHERE id = ?", [session.id]);
    return { valid: true, session };
}

function getActiveSessionCount(userId) {
    const r = get('SELECT COUNT(*) as c FROM sessions WHERE user_id = ? AND is_active = 1', [userId]);
    return r ? r.c : 0;
}

function killSession(sessionId) {
    run('UPDATE sessions SET is_active = 0 WHERE id = ?', [sessionId]);
    return { success: true };
}

function killAllUserSessions(userId) {
    run('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [userId]);
    return { success: true };
}

function killSessionByToken(token) {
    run('UPDATE sessions SET is_active = 0 WHERE token = ?', [token]);
    return { success: true };
}

function cleanStaleSessions() {
    const result = run(`
        UPDATE sessions SET is_active = 0
        WHERE is_active = 1 AND last_check < datetime('now', '-48 hours')
    `);
    if (result.changes > 0) console.log(`[DB] تم إلغاء ${result.changes} جلسة قديمة`);
    return result.changes;
}

// ===================== License Verification =====================

function getUserByLicenseKey(licenseKey) {
    return get('SELECT * FROM users WHERE license_key = ?', [licenseKey]);
}

function verifyLicense(licenseKey) {
    const user = getUserByLicenseKey(licenseKey);
    if (!user) return { valid: false, reason: 'مفتاح الترخيص غير صالح' };
    if (user.is_blocked) return { valid: false, reason: 'الحساب محظور' };

    const sub = checkSubscriptionValid(user.id);
    if (!sub.valid) return { valid: false, reason: sub.reason };

    return {
        valid: true,
        username: user.username,
        plan: sub.subscription.plan_name_ar,
        daysLeft: sub.daysLeft,
        endDate: sub.endDate,
        maxDevices: user.max_devices
    };
}

// ===================== Plans =====================

function getAllPlans() {
    return all('SELECT * FROM plans WHERE is_active = 1 ORDER BY duration_days ASC');
}

function getPlan(planId) {
    return get('SELECT * FROM plans WHERE id = ?', [planId]);
}

// ===================== Activity Log =====================

function logActivity(userId, action, details = '', ipAddress = '') {
    try {
        run(`INSERT INTO activity_log (user_id, action, details, ip_address)
             VALUES (?, ?, ?, ?)`,
            [userId, action, details, ipAddress]);
    } catch (e) {
        // silent
    }
}

function getActivityLog(limit = 100) {
    return all(`
        SELECT a.*, u.username
        FROM activity_log a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ?
    `, [limit]);
}

// ===================== Stats =====================

function getStats() {
    return {
        totalUsers: (get('SELECT COUNT(*) as c FROM users') || { c: 0 }).c,
        activeUsers: (get('SELECT COUNT(*) as c FROM users WHERE is_blocked = 0') || { c: 0 }).c,
        blockedUsers: (get('SELECT COUNT(*) as c FROM users WHERE is_blocked = 1') || { c: 0 }).c,
        activeSubscriptions: (get(
            "SELECT COUNT(*) as c FROM subscriptions WHERE is_active = 1 AND end_date > datetime('now')"
        ) || { c: 0 }).c,
        activeSessions: (get('SELECT COUNT(*) as c FROM sessions WHERE is_active = 1') || { c: 0 }).c,
    };
}

module.exports = {
    initDatabase, saveToDisk,
    createUser, getUser, getUserByUsername, getAllUsers, updateUser, deleteUser, blockUser,
    createSubscription, getActiveSubscription, checkSubscriptionValid, cleanExpiredSubscriptions,
    createSession, validateSession, getActiveSessionCount, killSession, killAllUserSessions, killSessionByToken, cleanStaleSessions,
    getUserByLicenseKey, verifyLicense,
    getAllPlans, getPlan,
    logActivity, getActivityLog,
    getStats,
};
