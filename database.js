/**
 * Database Manager - إدارة قاعدة البيانات
 * PostgreSQL via pg (node-postgres)
 * جداول: users, subscriptions, sessions, plans
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('railway.internal')
        ? { rejectUnauthorized: false }
        : false,
});

// ===================== Helper =====================

async function query(sql, params = []) {
    const res = await pool.query(sql, params);
    return res;
}

async function get(sql, params = []) {
    const res = await pool.query(sql, params);
    return res.rows[0] || null;
}

async function all(sql, params = []) {
    const res = await pool.query(sql, params);
    return res.rows;
}

async function run(sql, params = []) {
    const res = await pool.query(sql, params);
    return { changes: res.rowCount };
}

// ===================== Init =====================

async function initDatabase() {
    // إنشاء الجداول
    await query(`
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_ar TEXT NOT NULL,
            duration_days INTEGER NOT NULL,
            price REAL NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            license_key TEXT UNIQUE,
            max_devices INTEGER NOT NULL DEFAULT 1,
            is_blocked INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            notes TEXT DEFAULT ''
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plan_id TEXT NOT NULL REFERENCES plans(id),
            start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            end_date TIMESTAMPTZ NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            device_id TEXT NOT NULL,
            device_info TEXT DEFAULT '',
            ip_address TEXT DEFAULT '',
            last_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            is_active INTEGER NOT NULL DEFAULT 1
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            details TEXT DEFAULT '',
            ip_address TEXT DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    // فهارس
    await query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active, end_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id)');

    // إضافة الباقات الافتراضية
    const planCount = await get('SELECT COUNT(*) as c FROM plans');
    if (!planCount || parseInt(planCount.c) === 0) {
        await run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES ($1, $2, $3, $4, $5)',
            ['plan_1d', '1 Day', 'يوم واحد', 1, 0]);
        await run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES ($1, $2, $3, $4, $5)',
            ['plan_1m', '1 Month', 'شهر واحد', 30, 0]);
        await run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES ($1, $2, $3, $4, $5)',
            ['plan_3m', '3 Months', '3 أشهر', 90, 0]);
        await run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES ($1, $2, $3, $4, $5)',
            ['plan_7m', '7 Months', '7 أشهر', 210, 0]);
        await run('INSERT INTO plans (id, name, name_ar, duration_days, price) VALUES ($1, $2, $3, $4, $5)',
            ['plan_1y', '1 Year', 'سنة كاملة', 365, 0]);
    }

    console.log('[DB] قاعدة البيانات جاهزة (PostgreSQL)');
}

// ===================== Users =====================

async function createUser(username, password, maxDevices = 1, notes = '') {
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 12);
    const licenseKey = generateLicenseKey();

    try {
        await run(`INSERT INTO users (id, username, password_hash, license_key, max_devices, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, username.trim(), passwordHash, licenseKey, maxDevices, notes]);

        logActivity(id, 'USER_CREATED', `تم إنشاء المستخدم: ${username}`);
        return { success: true, userId: id, licenseKey };
    } catch (err) {
        if (err.message && (err.message.includes('unique') || err.message.includes('duplicate'))) {
            return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
        }
        return { success: false, error: err.message };
    }
}

async function getUser(userId) {
    return get('SELECT * FROM users WHERE id = $1', [userId]);
}

async function getUserByUsername(username) {
    return get('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
}

async function getAllUsers() {
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

async function updateUser(userId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.max_devices !== undefined) {
        fields.push(`max_devices = $${paramIndex++}`);
        values.push(updates.max_devices);
    }
    if (updates.is_blocked !== undefined) {
        fields.push(`is_blocked = $${paramIndex++}`);
        values.push(updates.is_blocked ? 1 : 0);
    }
    if (updates.password) {
        fields.push(`password_hash = $${paramIndex++}`);
        values.push(bcrypt.hashSync(updates.password, 12));
    }
    if (updates.notes !== undefined) {
        fields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
    }

    if (fields.length === 0) return { success: false, error: 'لا توجد تحديثات' };

    fields.push('updated_at = NOW()');
    values.push(userId);

    await run(`UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    logActivity(userId, 'USER_UPDATED', JSON.stringify(updates));
    return { success: true };
}

async function deleteUser(userId) {
    const user = await getUser(userId);
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    await run('DELETE FROM sessions WHERE user_id = $1', [userId]);
    await run('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
    await run('DELETE FROM users WHERE id = $1', [userId]);
    logActivity(null, 'USER_DELETED', `تم حذف: ${user.username}`);
    return { success: true };
}

async function blockUser(userId, block = true) {
    await run('UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2',
        [block ? 1 : 0, userId]);
    if (block) {
        await run('UPDATE sessions SET is_active = 0 WHERE user_id = $1', [userId]);
    }
    logActivity(userId, block ? 'USER_BLOCKED' : 'USER_UNBLOCKED', '');
    return { success: true };
}

// ===================== Subscriptions =====================

async function createSubscription(userId, planId) {
    const plan = await get('SELECT * FROM plans WHERE id = $1', [planId]);
    if (!plan) return { success: false, error: 'الباقة غير موجودة' };

    await run('UPDATE subscriptions SET is_active = 0 WHERE user_id = $1', [userId]);

    const id = uuidv4();
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();

    await run(`INSERT INTO subscriptions (id, user_id, plan_id, start_date, end_date, is_active)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [id, userId, planId, startDate, endDate]);

    logActivity(userId, 'SUBSCRIPTION_CREATED', `باقة: ${plan.name_ar} | ينتهي: ${endDate}`);
    return { success: true, subscriptionId: id, endDate };
}

async function getActiveSubscription(userId) {
    return get(`
        SELECT s.*, p.name as plan_name, p.name_ar as plan_name_ar, p.duration_days
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.user_id = $1 AND s.is_active = 1 AND s.end_date > NOW()
        ORDER BY s.end_date DESC
        LIMIT 1
    `, [userId]);
}

async function checkSubscriptionValid(userId) {
    const sub = await getActiveSubscription(userId);
    if (!sub) return { valid: false, reason: 'لا يوجد اشتراك فعّال' };

    const now = new Date();
    const endDate = new Date(sub.end_date);
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    return { valid: true, subscription: sub, daysLeft, endDate: sub.end_date };
}

async function cleanExpiredSubscriptions() {
    const result = await run(`
        UPDATE subscriptions SET is_active = 0
        WHERE is_active = 1 AND end_date <= NOW()
    `);
    if (result.changes > 0) console.log(`[DB] تم إلغاء ${result.changes} اشتراك منتهي`);
    return result.changes;
}

// ===================== Sessions =====================

async function createSession(userId, token, deviceId, deviceInfo = '', ipAddress = '') {
    const user = await getUser(userId);
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    const activeCount = await get(
        'SELECT COUNT(*) as c FROM sessions WHERE user_id = $1 AND is_active = 1', [userId]
    );

    if (activeCount && parseInt(activeCount.c) >= user.max_devices) {
        const oldest = await get(
            'SELECT id FROM sessions WHERE user_id = $1 AND is_active = 1 ORDER BY last_check ASC LIMIT 1',
            [userId]
        );
        if (oldest) await run('DELETE FROM sessions WHERE id = $1', [oldest.id]);
    }

    const id = uuidv4();
    await run(`INSERT INTO sessions (id, user_id, token, device_id, device_info, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, userId, token, deviceId, deviceInfo, ipAddress]);

    logActivity(userId, 'SESSION_CREATED', `جهاز: ${deviceInfo} | IP: ${ipAddress}`);
    return { success: true, sessionId: id };
}

async function validateSession(token) {
    const session = await get(`
        SELECT s.*, u.username, u.is_blocked, u.max_devices
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = $1 AND s.is_active = 1
    `, [token]);

    if (!session) return { valid: false, reason: 'جلسة غير صالحة' };
    if (session.is_blocked) return { valid: false, reason: 'الحساب محظور' };

    await run('UPDATE sessions SET last_check = NOW() WHERE id = $1', [session.id]);
    return { valid: true, session };
}

async function getActiveSessionCount(userId) {
    const r = await get('SELECT COUNT(*) as c FROM sessions WHERE user_id = $1 AND is_active = 1', [userId]);
    return r ? parseInt(r.c) : 0;
}

async function killSession(sessionId) {
    await run('UPDATE sessions SET is_active = 0 WHERE id = $1', [sessionId]);
    return { success: true };
}

async function killAllUserSessions(userId) {
    await run('UPDATE sessions SET is_active = 0 WHERE user_id = $1', [userId]);
    return { success: true };
}

async function killSessionByToken(token) {
    await run('UPDATE sessions SET is_active = 0 WHERE token = $1', [token]);
    return { success: true };
}

async function cleanStaleSessions() {
    const result = await run(`
        UPDATE sessions SET is_active = 0
        WHERE is_active = 1 AND last_check < NOW() - INTERVAL '48 hours'
    `);
    if (result.changes > 0) console.log(`[DB] تم إلغاء ${result.changes} جلسة قديمة`);
    return result.changes;
}

// ===================== License Verification =====================

async function getUserByLicenseKey(licenseKey) {
    return get('SELECT * FROM users WHERE license_key = $1', [licenseKey]);
}

async function verifyLicense(licenseKey) {
    const user = await getUserByLicenseKey(licenseKey);
    if (!user) return { valid: false, reason: 'مفتاح الترخيص غير صالح' };
    if (user.is_blocked) return { valid: false, reason: 'الحساب محظور' };

    const sub = await checkSubscriptionValid(user.id);
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

async function getAllPlans() {
    return all('SELECT * FROM plans WHERE is_active = 1 ORDER BY duration_days ASC');
}

async function getPlan(planId) {
    return get('SELECT * FROM plans WHERE id = $1', [planId]);
}

// ===================== Activity Log =====================

function logActivity(userId, action, details = '', ipAddress = '') {
    // fire-and-forget — لا ننتظر النتيجة
    run(`INSERT INTO activity_log (user_id, action, details, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [userId, action, details, ipAddress]).catch(() => {});
}

async function getActivityLog(limit = 100) {
    return all(`
        SELECT a.*, u.username
        FROM activity_log a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT $1
    `, [limit]);
}

// ===================== Stats =====================

async function getStats() {
    const [totalUsers, activeUsers, blockedUsers, activeSubscriptions, activeSessions] = await Promise.all([
        get('SELECT COUNT(*) as c FROM users'),
        get('SELECT COUNT(*) as c FROM users WHERE is_blocked = 0'),
        get('SELECT COUNT(*) as c FROM users WHERE is_blocked = 1'),
        get("SELECT COUNT(*) as c FROM subscriptions WHERE is_active = 1 AND end_date > NOW()"),
        get('SELECT COUNT(*) as c FROM sessions WHERE is_active = 1'),
    ]);
    return {
        totalUsers: parseInt((totalUsers || { c: 0 }).c),
        activeUsers: parseInt((activeUsers || { c: 0 }).c),
        blockedUsers: parseInt((blockedUsers || { c: 0 }).c),
        activeSubscriptions: parseInt((activeSubscriptions || { c: 0 }).c),
        activeSessions: parseInt((activeSessions || { c: 0 }).c),
    };
}

module.exports = {
    initDatabase,
    createUser, getUser, getUserByUsername, getAllUsers, updateUser, deleteUser, blockUser,
    createSubscription, getActiveSubscription, checkSubscriptionValid, cleanExpiredSubscriptions,
    createSession, validateSession, getActiveSessionCount, killSession, killAllUserSessions, killSessionByToken, cleanStaleSessions,
    getUserByLicenseKey, verifyLicense,
    getAllPlans, getPlan,
    logActivity, getActivityLog,
    getStats,
};
