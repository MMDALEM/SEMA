import { User } from '../models/User.js';
import { Request } from '../models/Request.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { WorkReport } from '../models/WorkReport.js';
import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../middleware/errors.js';

/** آمار داشبورد بر اساس نقش کاربر */
export const getStats = asyncHandler(async (req, res) => {
  const { user } = req;
  const stats = {};

  const [myPendingRequests, myPendingLeaves] = await Promise.all([
    Request.countDocuments({ employee: user._id, status: 'PENDING' }),
    LeaveRequest.countDocuments({
      employee: user._id,
      status: { $in: ['PENDING_MANAGER', 'PENDING_HR'] },
    }),
  ]);
  stats.myPendingRequests = myPendingRequests;
  stats.myPendingLeaves = myPendingLeaves;

  if (user.role === 'ADMIN') {
    const [users, logsToday] = await Promise.all([
      User.countDocuments({}),
      AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } }),
    ]);
    stats.totalUsers = users;
    stats.logsToday = logsToday;
  }

  if (user.role === 'FINANCE' || user.role === 'ADMIN') {
    stats.pendingFinance = await Request.countDocuments({ scope: 'FINANCE', status: 'PENDING' });
  }

  if (user.role === 'HR' || user.role === 'ADMIN') {
    const [pendingHr, pendingLeaves] = await Promise.all([
      Request.countDocuments({ scope: 'HR', status: 'PENDING' }),
      LeaveRequest.countDocuments({ status: 'PENDING_HR' }),
    ]);
    stats.pendingHrRequests = pendingHr;
    stats.pendingHrLeaves = pendingLeaves;
  }

  if (user.role === 'MANAGER') {
    const [teamLeaves, teamReports] = await Promise.all([
      LeaveRequest.countDocuments({ manager: user._id, status: 'PENDING_MANAGER' }),
      WorkReport.countDocuments({ manager: user._id, status: 'SUBMITTED' }),
    ]);
    stats.teamPendingLeaves = teamLeaves;
    stats.teamNewReports = teamReports;
  }

  if (user.role === 'SITE_MANAGER' || user.role === 'GENERAL_MANAGER') {
    // مدیر سایت فقط مجموعه خودش؛ مدیر کل همه
    const seniorFilter =
      user.role === 'SITE_MANAGER' ? { seniorManager: user._id } : { seniorManager: { $ne: null } };
    const [seniorLeaves, seniorRequests] = await Promise.all([
      LeaveRequest.countDocuments({ ...seniorFilter, status: 'PENDING_SENIOR' }),
      Request.countDocuments({ ...seniorFilter, status: 'PENDING_SENIOR' }),
    ]);
    stats.seniorPendingLeaves = seniorLeaves;
    stats.seniorPendingRequests = seniorRequests;
  }

  res.json({ stats });
});
