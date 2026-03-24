/**
 * IPTV Backend Server - سيرفر إدارة الاشتراكات
 * Express + PostgreSQL + JWT + Security
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./database');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ===================== Security Middleware =====================

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting - حماية من هجمات brute force
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 10,
    message: { success: false, error: 'محاولات كثيرة. انتظر 15 دقيقة.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // دقيقة
    max: 120,
    message: { success: false, error: 'طلبات كثيرة. انتظر قليلاً.' },
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { success: false, error: 'طلبات كثيرة.' },
});

const licenseLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, error: 'محاولات كثيرة. انتظر 15 دقيقة.' },
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/license', licenseLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api', apiLimiter);

// ===================== Admin Dashboard =====================

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ===================== Helper Middleware =====================

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

// middleware للتحقق من token المستخدم
async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (!token) {
        return res.status(401).json({ success: false, error: 'مطلوب تسجيل الدخول' });
    }
    const result = await auth.verify(token, getClientIp(req));
    if (!result.valid) {
        return res.status(401).json({ success: false, error: result.reason });
    }
    req.userId = result.userId;
    req.username = result.username;
    req.daysLeft = result.daysLeft;
    next();
}

// middleware للتحقق من مفتاح الأدمن
function requireAdmin(req, res, next) {
    const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
    if (!adminKey || !auth.verifyAdmin(adminKey)) {
        db.logActivity(null, 'ADMIN_AUTH_FAIL', `IP: ${getClientIp(req)}`, getClientIp(req));
        return res.status(403).json({ success: false, error: 'غير مصرح' });
    }
    next();
}

// ===================== Auth Routes =====================

// تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, device_id, device_info } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'أدخل اسم المستخدم وكلمة المرور' });
        }
        const deviceId = device_id || require('crypto').randomBytes(16).toString('hex');
        const result = await auth.login(
            username, password, deviceId,
            device_info || req.headers['user-agent'] || '',
            getClientIp(req)
        );
        if (!result.success) {
            return res.status(401).json(result);
        }
        res.json(result);
    } catch (e) {
        console.error('[LOGIN]', e.message);
        res.status(500).json({ success: false, error: 'خطأ في الخادم' });
    }
});

// التحقق من الجلسة (كل 24 ساعة)
app.get('/api/auth/verify', requireAuth, (req, res) => {
    res.json({
        success: true,
        valid: true,
        username: req.username,
        daysLeft: req.daysLeft,
    });
});

// تسجيل الخروج
app.post('/api/auth/logout', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) await auth.logout(token);
    res.json({ success: true });
});

// ===================== Admin Routes =====================

// إحصائيات
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json({ success: true, stats });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// قائمة المستخدمين
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await db.getAllUsers();
        // لا نرسل password_hash
        const safeUsers = users.map(u => {
            const { password_hash, ...safe } = u;
            return safe;
        });
        res.json({ success: true, users: safeUsers });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// إنشاء مستخدم جديد
app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const { username, password, max_devices, plan_id, notes } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'أدخل اسم المستخدم وكلمة المرور' });
        }
        if (username.length < 3) {
            return res.status(400).json({ success: false, error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' });
        }
        if (password.length < 4) {
            return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' });
        }

        const userResult = await db.createUser(username, password, max_devices || 1, notes || '');
        if (!userResult.success) {
            return res.status(400).json(userResult);
        }

        // إنشاء اشتراك إذا تم تحديد باقة
        if (plan_id) {
            const subResult = await db.createSubscription(userResult.userId, plan_id);
            if (!subResult.success) {
                return res.status(400).json({ success: true, userId: userResult.userId, licenseKey: userResult.licenseKey, warning: subResult.error });
            }
            return res.json({ success: true, userId: userResult.userId, licenseKey: userResult.licenseKey, subscription: subResult });
        }

        res.json({ success: true, userId: userResult.userId, licenseKey: userResult.licenseKey });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// تحديث مستخدم
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.updateUser(id, req.body);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// حذف مستخدم
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const result = await db.deleteUser(req.params.id);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// حظر / إلغاء حظر
app.post('/api/admin/users/:id/block', requireAdmin, async (req, res) => {
    try {
        const result = await db.blockUser(req.params.id, true);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
app.post('/api/admin/users/:id/unblock', requireAdmin, async (req, res) => {
    try {
        const result = await db.blockUser(req.params.id, false);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// إنشاء اشتراك لمستخدم
app.post('/api/admin/users/:id/subscribe', requireAdmin, async (req, res) => {
    try {
        const { plan_id } = req.body;
        if (!plan_id) {
            return res.status(400).json({ success: false, error: 'حدد الباقة' });
        }
        const result = await db.createSubscription(req.params.id, plan_id);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// قطع اتصال مستخدم (كل أجهزته)
app.post('/api/admin/users/:id/kick', requireAdmin, async (req, res) => {
    try {
        const result = await db.killAllUserSessions(req.params.id);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// قائمة الباقات
app.get('/api/admin/plans', requireAdmin, async (req, res) => {
    try {
        const plans = await db.getAllPlans();
        res.json({ success: true, plans });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// سجل النشاط
app.get('/api/admin/activity', requireAdmin, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const log = await db.getActivityLog(limit);
        res.json({ success: true, log });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// مفتاح الأدمن (للعرض في الكونسول فقط)
app.get('/api/admin/key', (req, res) => {
    // لا نعرض المفتاح عبر API أبداً
    res.status(403).json({ success: false, error: 'المفتاح يظهر فقط في الكونسول عند أول تشغيل' });
});

// ===================== License Verification (for agent servers) =====================

app.post('/api/license/verify', async (req, res) => {
    try {
        const { license_key, server_info } = req.body;
        if (!license_key) {
            return res.status(400).json({ success: false, error: 'مفتاح الترخيص مطلوب' });
        }
        const result = await db.verifyLicense(license_key);
        db.logActivity(null, 'LICENSE_CHECK',
            `Key: ${license_key.substring(0, 9)}... | Valid: ${result.valid} | IP: ${getClientIp(req)} | ${server_info || ''}`,
            getClientIp(req));
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/license/auth', async (req, res) => {
    try {
        const { username, password, server_info } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' });
        }
        const user = await db.getUserByUsername(username);
        if (!user) {
            db.logActivity(null, 'LICENSE_AUTH_FAIL', `User: ${username} | Not found | IP: ${getClientIp(req)}`, getClientIp(req));
            return res.json({ success: true, valid: false, reason: 'اسم المستخدم أو كلمة المرور خاطئة' });
        }
        const bcrypt = require('bcryptjs');
        if (!bcrypt.compareSync(password, user.password_hash)) {
            db.logActivity(user.id, 'LICENSE_AUTH_FAIL', `User: ${username} | Wrong password | IP: ${getClientIp(req)}`, getClientIp(req));
            return res.json({ success: true, valid: false, reason: 'اسم المستخدم أو كلمة المرور خاطئة' });
        }
        if (user.is_blocked) {
            db.logActivity(user.id, 'LICENSE_AUTH_BLOCKED', `User: ${username} | IP: ${getClientIp(req)}`, getClientIp(req));
            return res.json({ success: true, valid: false, reason: 'الحساب محظور' });
        }
        const sub = await db.checkSubscriptionValid(user.id);
        if (!sub.valid) {
            db.logActivity(user.id, 'LICENSE_AUTH_EXPIRED', `User: ${username} | ${sub.reason} | IP: ${getClientIp(req)}`, getClientIp(req));
            return res.json({ success: true, valid: false, reason: sub.reason });
        }
        db.logActivity(user.id, 'LICENSE_AUTH_OK', `User: ${username} | Plan: ${sub.subscription.plan_name_ar} | IP: ${getClientIp(req)} | ${server_info || ''}`, getClientIp(req));
        res.json({
            success: true,
            valid: true,
            username: user.username,
            plan: sub.subscription.plan_name_ar,
            daysLeft: sub.daysLeft,
            endDate: sub.endDate,
            maxDevices: user.max_devices
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ===================== Health Check =====================

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'running', time: new Date().toISOString() });
});

// ===================== Cleanup Scheduler =====================

function startCleanupScheduler() {
    // كل ساعة: تنظيف الاشتراكات المنتهية والجلسات القديمة
    setInterval(async () => {
        try {
            await db.cleanExpiredSubscriptions();
            await db.cleanStaleSessions();
        } catch (e) {
            console.error('[CLEANUP] خطأ:', e.message);
        }
    }, 60 * 60 * 1000);

    // تنظيف أولي عند البدء
    setTimeout(async () => {
        try {
            await db.cleanExpiredSubscriptions();
            await db.cleanStaleSessions();
        } catch (e) {
            console.error('[CLEANUP] خطأ أولي:', e.message);
        }
    }, 5000);
}

// ===================== Start Server =====================

async function start() {
    await db.initDatabase();

    app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(50));
        console.log(`[BACKEND] سيرفر الاشتراكات يعمل على المنفذ ${PORT}`);
        console.log(`[BACKEND] API: http://0.0.0.0:${PORT}/api`);
        console.log(`[ADMIN] مفتاح الأدمن: ${auth.getAdminSecret()}`);
        console.log('='.repeat(50));
    });

    startCleanupScheduler();
}

start();
