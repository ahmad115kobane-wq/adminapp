/**
 * Auth Manager - نظام المصادقة والتحقق
 * JWT + bcrypt + device tracking
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./database');

// مفتاح سري قوي - يُولَّد تلقائياً عند أول تشغيل
const SECRET_PATH = require('path').join(__dirname, 'data', '.secret');
let JWT_SECRET;

function getSecret() {
    if (JWT_SECRET) return JWT_SECRET;
    // أولوية لمتغير البيئة (Railway)
    if (process.env.JWT_SECRET) {
        JWT_SECRET = process.env.JWT_SECRET;
        return JWT_SECRET;
    }
    const fs = require('fs');
    try {
        if (fs.existsSync(SECRET_PATH)) {
            JWT_SECRET = fs.readFileSync(SECRET_PATH, 'utf8').trim();
        } else {
            fs.mkdirSync(require('path').join(__dirname, 'data'), { recursive: true });
            JWT_SECRET = crypto.randomBytes(64).toString('hex');
            fs.writeFileSync(SECRET_PATH, JWT_SECRET);
        }
    } catch (e) {
        JWT_SECRET = crypto.randomBytes(64).toString('hex');
    }
    return JWT_SECRET;
}

// مفتاح سري للأدمن
const ADMIN_SECRET_PATH = require('path').join(__dirname, 'data', '.admin_secret');
let ADMIN_SECRET;

function getAdminSecret() {
    if (ADMIN_SECRET) return ADMIN_SECRET;
    // أولوية لمتغير البيئة (Railway)
    if (process.env.ADMIN_SECRET) {
        ADMIN_SECRET = process.env.ADMIN_SECRET;
        return ADMIN_SECRET;
    }
    const fs = require('fs');
    try {
        if (fs.existsSync(ADMIN_SECRET_PATH)) {
            ADMIN_SECRET = fs.readFileSync(ADMIN_SECRET_PATH, 'utf8').trim();
        } else {
            fs.mkdirSync(require('path').join(__dirname, 'data'), { recursive: true });
            ADMIN_SECRET = crypto.randomBytes(32).toString('hex');
            fs.writeFileSync(ADMIN_SECRET_PATH, ADMIN_SECRET);
            console.log(`[AUTH] مفتاح الأدمن الجديد: ${ADMIN_SECRET}`);
        }
    } catch (e) {
        ADMIN_SECRET = crypto.randomBytes(32).toString('hex');
    }
    return ADMIN_SECRET;
}

/**
 * تسجيل الدخول
 */
function login(username, password, deviceId, deviceInfo = '', ipAddress = '') {
    const user = db.getUserByUsername(username);
    if (!user) {
        db.logActivity(null, 'LOGIN_FAILED', `محاولة فاشلة: ${username}`, ipAddress);
        return { success: false, error: 'اسم المستخدم أو كلمة المرور خاطئة' };
    }

    if (user.is_blocked) {
        db.logActivity(user.id, 'LOGIN_BLOCKED', '', ipAddress);
        return { success: false, error: 'الحساب محظور. تواصل مع الإدارة.' };
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
        db.logActivity(user.id, 'LOGIN_WRONG_PASS', '', ipAddress);
        return { success: false, error: 'اسم المستخدم أو كلمة المرور خاطئة' };
    }

    // فحص الاشتراك
    const subCheck = db.checkSubscriptionValid(user.id);
    if (!subCheck.valid) {
        db.logActivity(user.id, 'LOGIN_NO_SUB', '', ipAddress);
        return { success: false, error: 'لا يوجد اشتراك فعّال. تواصل مع الإدارة.' };
    }

    // إنشاء token
    const token = jwt.sign(
        {
            userId: user.id,
            username: user.username,
            deviceId: deviceId,
            iat: Math.floor(Date.now() / 1000),
        },
        getSecret(),
        { expiresIn: '24h' }
    );

    // حفظ الجلسة
    const sessionResult = db.createSession(user.id, token, deviceId, deviceInfo, ipAddress);
    if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
    }

    db.logActivity(user.id, 'LOGIN_SUCCESS', `جهاز: ${deviceInfo}`, ipAddress);

    return {
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
        },
        subscription: {
            endDate: subCheck.endDate,
            daysLeft: subCheck.daysLeft,
            plan: subCheck.subscription.plan_name_ar,
        },
    };
}

/**
 * التحقق من Token + الاشتراك + الجهاز
 */
function verify(token, ipAddress = '') {
    try {
        // فك الـ token
        const decoded = jwt.verify(token, getSecret());

        // فحص الجلسة في قاعدة البيانات
        const sessionCheck = db.validateSession(token);
        if (!sessionCheck.valid) {
            return { valid: false, reason: sessionCheck.reason };
        }

        // فحص الاشتراك
        const subCheck = db.checkSubscriptionValid(decoded.userId);
        if (!subCheck.valid) {
            return { valid: false, reason: subCheck.reason };
        }

        // فحص الحظر
        const user = db.getUser(decoded.userId);
        if (!user || user.is_blocked) {
            return { valid: false, reason: 'الحساب محظور' };
        }

        return {
            valid: true,
            userId: decoded.userId,
            username: decoded.username,
            daysLeft: subCheck.daysLeft,
            endDate: subCheck.endDate,
        };
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return { valid: false, reason: 'انتهت صلاحية الجلسة. سجّل دخول مجدداً.' };
        }
        return { valid: false, reason: 'جلسة غير صالحة' };
    }
}

/**
 * التحقق من مفتاح الأدمن
 */
function verifyAdmin(adminKey) {
    return adminKey === getAdminSecret();
}

/**
 * تسجيل الخروج
 */
function logout(token) {
    try {
        const decoded = jwt.verify(token, getSecret(), { ignoreExpiration: true });
        db.killSessionByToken(token);
        db.logActivity(decoded.userId, 'LOGOUT', '');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

module.exports = {
    login,
    verify,
    verifyAdmin,
    logout,
    getAdminSecret,
};
