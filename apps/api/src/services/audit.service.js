import { AuditLog } from '../models/AuditLog.js';

/**
 * ثبت رخداد در لاگ سیستم. خطای لاگ نباید عملیات اصلی را متوقف کند.
 */
export async function logAction(req, action, options = {}) {
  const { message = '', entity = '', entityId = '', status = 'SUCCESS', meta = {}, actor } = options;
  const user = actor ?? req.user;
  try {
    await AuditLog.create({
      actor: user?._id ?? null,
      actorName: user ? `${user.firstName} ${user.lastName}` : 'ناشناس',
      action,
      message,
      entity,
      entityId: entityId ? String(entityId) : '',
      method: req.method,
      path: req.originalUrl,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      status,
      meta,
    });
  } catch (err) {
    console.error('خطا در ثبت لاگ:', err.message);
  }
}
