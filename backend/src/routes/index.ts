import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { loginRateLimiter } from '../middleware/rate-limit.middleware';

import * as authCtrl from '../controllers/auth.controller';
import * as dashCtrl from '../controllers/dashboard.controller';
import * as extCtrl from '../controllers/extension.controller';
import * as trunkCtrl from '../controllers/trunk.controller';
import * as routeCtrl from '../controllers/route.controller';
import * as ivrCtrl from '../controllers/ivr.controller';
import * as ringGroupCtrl from '../controllers/ring-group.controller';
import * as queueCtrl from '../controllers/queue.controller';
import * as callCtrl from '../controllers/call.controller';
import * as cdrCtrl from '../controllers/cdr.controller';
import * as recCtrl from '../controllers/recording.controller';
import * as audioCtrl from '../controllers/audio.controller';
import * as vmCtrl from '../controllers/voicemail.controller';
import * as userCtrl from '../controllers/user.controller';
import * as sysCtrl from '../controllers/system.controller';
import * as secCtrl from '../controllers/security.controller';

const router = Router();

// ----------------- Authentication -----------------
router.post('/auth/login', loginRateLimiter(10, 15 * 60 * 1000), authCtrl.login);
router.post('/auth/logout', authenticateToken, authCtrl.logout);
router.get('/auth/me', authenticateToken, authCtrl.getCurrentUser);
router.post('/auth/password/change', authenticateToken, authCtrl.changePassword);

// ----------------- Dashboard -----------------
router.get('/dashboard/summary', authenticateToken, dashCtrl.getSummary);
router.get('/dashboard/active-calls', authenticateToken, dashCtrl.getActiveCalls);
router.get('/dashboard/live-channels', authenticateToken, dashCtrl.getActiveCalls);
router.get('/dashboard/system-health', authenticateToken, dashCtrl.getSystemHealth);

// ----------------- Extensions -----------------
router.get('/extensions', authenticateToken, extCtrl.getExtensions);
router.get('/extensions/:id', authenticateToken, extCtrl.getExtensionById);
router.post(
  '/extensions',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Extension'),
  extCtrl.createExtension
);
router.patch(
  '/extensions/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.DEPT_MANAGER),
  auditLog('Extension'),
  extCtrl.updateExtension
);
router.put(
  '/extensions/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.DEPT_MANAGER),
  auditLog('Extension'),
  extCtrl.updateExtension
);
router.delete(
  '/extensions/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Extension'),
  extCtrl.deleteExtension
);
router.post(
  '/extensions/:id/reset-credentials',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Extension'),
  extCtrl.resetCredentials
);
router.post(
  '/extensions/:id/reset-secret',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Extension'),
  extCtrl.resetCredentials
);

// ----------------- SIP Trunks -----------------
router.get('/trunks', authenticateToken, trunkCtrl.getTrunks);
router.post(
  '/trunks',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Trunk'),
  trunkCtrl.createTrunk
);
router.patch(
  '/trunks/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Trunk'),
  trunkCtrl.updateTrunk
);
router.put(
  '/trunks/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Trunk'),
  trunkCtrl.updateTrunk
);
router.delete(
  '/trunks/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Trunk'),
  trunkCtrl.deleteTrunk
);
router.post(
  '/trunks/:id/test',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  trunkCtrl.testTrunkConnectivity
);
router.post(
  '/trunks/bulk',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('TrunkBulk'),
  trunkCtrl.bulkAction
);
router.post(
  '/trunks/push-config',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('TrunkPushConfig'),
  trunkCtrl.pushConfiguration
);

// ----------------- Call Routing -----------------
router.get('/routes/inbound', authenticateToken, routeCtrl.getInboundRoutes);
router.post(
  '/routes/inbound',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('InboundRoute'),
  routeCtrl.createInboundRoute
);
router.patch(
  '/routes/inbound/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('InboundRoute'),
  routeCtrl.updateInboundRoute
);
router.put(
  '/routes/inbound/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('InboundRoute'),
  routeCtrl.updateInboundRoute
);
router.delete(
  '/routes/inbound/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('InboundRoute'),
  routeCtrl.deleteInboundRoute
);

router.get('/routes/outbound', authenticateToken, routeCtrl.getOutboundRoutes);
router.post(
  '/routes/outbound',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('OutboundRoute'),
  routeCtrl.createOutboundRoute
);
router.patch(
  '/routes/outbound/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('OutboundRoute'),
  routeCtrl.updateOutboundRoute
);
router.put(
  '/routes/outbound/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('OutboundRoute'),
  routeCtrl.updateOutboundRoute
);
router.delete(
  '/routes/outbound/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('OutboundRoute'),
  routeCtrl.deleteOutboundRoute
);

// ----------------- IVR Menus -----------------
router.get('/ivr', authenticateToken, ivrCtrl.getIvrMenus);
router.post(
  '/ivr',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('IvrMenu'),
  ivrCtrl.createIvrMenu
);
router.patch(
  '/ivr/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('IvrMenu'),
  ivrCtrl.updateIvrMenu
);
router.put(
  '/ivr/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('IvrMenu'),
  ivrCtrl.updateIvrMenu
);
router.delete(
  '/ivr/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('IvrMenu'),
  ivrCtrl.deleteIvrMenu
);

// ----------------- Ring Groups -----------------
router.get('/ring-groups', authenticateToken, ringGroupCtrl.getRingGroups);
router.post(
  '/ring-groups',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('RingGroup'),
  ringGroupCtrl.createRingGroup
);
router.patch(
  '/ring-groups/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('RingGroup'),
  ringGroupCtrl.updateRingGroup
);
router.put(
  '/ring-groups/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('RingGroup'),
  ringGroupCtrl.updateRingGroup
);
router.delete(
  '/ring-groups/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('RingGroup'),
  ringGroupCtrl.deleteRingGroup
);

// ----------------- Call Queues -----------------
router.get('/queues', authenticateToken, queueCtrl.getQueues);
router.post(
  '/queues',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  auditLog('CallQueue'),
  queueCtrl.createQueue
);
router.patch(
  '/queues/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  auditLog('CallQueue'),
  queueCtrl.updateQueue
);
router.put(
  '/queues/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  auditLog('CallQueue'),
  queueCtrl.updateQueue
);
router.delete(
  '/queues/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  auditLog('CallQueue'),
  queueCtrl.deleteQueue
);
router.patch(
  '/queues/:queueId/agents/:extensionId',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  queueCtrl.updateAgentStatus
);
router.patch(
  '/queues/:queueId/agents/:extensionId/status',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  queueCtrl.updateAgentStatus
);
router.put(
  '/queues/:queueId/agents/:extensionId/status',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  queueCtrl.updateAgentStatus
);

// ----------------- Live Calls & Control -----------------
router.get('/calls/active', authenticateToken, callCtrl.getActiveCalls);
router.post(
  '/calls/:id/hold',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR, Role.RECEPTIONIST, Role.STANDARD_USER),
  callCtrl.holdCall
);
router.post(
  '/calls/:id/transfer',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR, Role.RECEPTIONIST, Role.STANDARD_USER),
  callCtrl.transferCall
);
router.post(
  '/calls/:id/hangup',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR, Role.RECEPTIONIST, Role.STANDARD_USER),
  callCtrl.hangupCall
);
router.post(
  '/calls/:id/terminate',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR, Role.RECEPTIONIST, Role.STANDARD_USER),
  callCtrl.hangupCall
);
router.post(
  '/calls/:id/eavesdrop',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  callCtrl.eavesdropCall
);
router.post(
  '/calls/originate',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.STANDARD_USER),
  callCtrl.originateCall
);

// ----------------- Call Detail Records (CDR) -----------------
router.get('/cdr', authenticateToken, cdrCtrl.getCallRecords);
router.get('/cdr/export', authenticateToken, cdrCtrl.exportCdrCsv);

// ----------------- Recordings -----------------
router.get('/recordings', authenticateToken, recCtrl.getRecordings);
router.post(
  '/recordings/:id/authorize-download',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR, Role.AUDITOR),
  auditLog('Recording'),
  recCtrl.authorizeDownload
);
router.get('/recordings/stream/:token', recCtrl.streamRecording);
router.delete(
  '/recordings/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Recording'),
  recCtrl.deleteRecording
);

// ----------------- Audio Prompts & Sound Files -----------------
router.get('/audio', authenticateToken, audioCtrl.getAudioPrompts);
router.post(
  '/audio/upload',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.QUEUE_SUPERVISOR),
  audioCtrl.upload.single('file'),
  auditLog('AudioPrompt'),
  audioCtrl.uploadAudio
);
router.get('/audio/:id/stream', audioCtrl.streamAudio);
router.delete(
  '/audio/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('AudioPrompt'),
  audioCtrl.deleteAudio
);

// ----------------- Voicemail -----------------
router.get('/voicemail', authenticateToken, vmCtrl.getVoicemailBoxes);
router.patch(
  '/voicemail/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.STANDARD_USER),
  vmCtrl.updateVoicemailBox
);
router.put(
  '/voicemail/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN, Role.STANDARD_USER),
  vmCtrl.updateVoicemailBox
);

// ----------------- Users & Departments -----------------
router.get('/users', authenticateToken, userCtrl.getUsers);
router.post(
  '/users',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('User'),
  userCtrl.createUser
);
router.patch(
  '/users/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('User'),
  userCtrl.updateUser
);
router.put(
  '/users/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('User'),
  userCtrl.updateUser
);
router.delete(
  '/users/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('User'),
  userCtrl.deleteUser
);

router.get('/departments', authenticateToken, userCtrl.getDepartments);
router.get('/users/departments/list', authenticateToken, userCtrl.getDepartments);
router.get('/users/departments', authenticateToken, userCtrl.getDepartments);
router.post(
  '/departments',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Department'),
  userCtrl.createDepartment
);
router.post(
  '/users/departments',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Department'),
  userCtrl.createDepartment
);
router.delete(
  '/departments/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Department'),
  userCtrl.deleteDepartment
);
router.delete(
  '/users/departments/:id',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Department'),
  userCtrl.deleteDepartment
);

// ----------------- System & Backups -----------------
router.get('/system/health', authenticateToken, sysCtrl.getSystemHealth);
router.get('/system/network', authenticateToken, sysCtrl.getNetworkSettings);
router.get('/system/settings', authenticateToken, sysCtrl.getSettings);
router.patch(
  '/system/settings/:key',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN),
  auditLog('SystemSetting'),
  sysCtrl.updateSetting
);
router.put(
  '/system/settings/:key',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN),
  auditLog('SystemSetting'),
  sysCtrl.updateSetting
);
router.get('/system/backups', authenticateToken, sysCtrl.getBackups);
router.post(
  '/system/backup',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Backup'),
  sysCtrl.triggerBackup
);
router.post(
  '/system/backups',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Backup'),
  sysCtrl.triggerBackup
);
router.post(
  '/system/backups/create',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('Backup'),
  sysCtrl.triggerBackup
);
router.post(
  '/system/reload-telephony',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  auditLog('FreeSWITCH'),
  sysCtrl.reloadTelephony
);

// ----------------- Security -----------------
router.get('/security/overview', authenticateToken, secCtrl.getSecurityOverview);
router.get('/security/events', authenticateToken, secCtrl.getSecurityEvents);
router.get('/security/audit-logs', authenticateToken, secCtrl.getAuditLogs);
router.post(
  '/security/events/:id/resolve',
  authenticateToken,
  requireRole(Role.SUPER_ADMIN, Role.PBX_ADMIN),
  secCtrl.resolveSecurityEvent
);

export default router;
