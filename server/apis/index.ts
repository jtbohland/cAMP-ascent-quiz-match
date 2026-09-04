/**
 * API Registry - Central export for all APIs.
 */
import CampSetupTables from './camp/setup-tables.js';
import CampSubmitAttempt from './camp/submit-attempt.js';
import CampGetUserAttempts from './camp/get-user-attempts.js';
import CampGetAnalytics from './camp/get-analytics.js';
import CampGetUserProgression from './camp/get-user-progression.js';
import CampResetUserProgress from './camp/reset-user-progress.js';
import CampTrackReview from './camp/track-review.js';
import CampGetUserXP from './camp/get-user-xp.js';
import CampGetLeaderboard from './camp/get-leaderboard.js';
import CampTrackVisit from './camp/track-visit.js';
import CampGetVisitStats from './camp/get-visit-stats.js';
import CampGetCampers from './camp/get-campers.js';
import CampRegisterViewer from './camp/register-viewer.js';
import CampLookupViewer from './camp/lookup-viewer.js';
import CampBackfillViewers from './camp/backfill-viewers.js';
import CampGetQuizSnapshot from './camp/get-quiz-snapshot.js';
import CampBackfillSnapshots from './camp/backfill-snapshots.js';
import CampAddRegionColumn from './camp/add-region-column.js';
import CampFixChrisRole from './camp/fix-chris-role.js';
import AuditSetupTables from './audit/setup-audit-tables.js';
import AuditSeedData from './audit/seed-audit-data.js';
import AuditGetDashboard from './audit/get-audit-dashboard.js';
import AuditRegisterSme from './audit/register-sme.js';
import AuditGetQuizDetail from './audit/get-quiz-detail.js';
import AuditSaveQuestionEdit from './audit/save-question-edit.js';
import AuditAddNote from './audit/add-note.js';
import AuditApproveQuestion from './audit/approve-question.js';
import AuditReviewGear from './audit/review-gear.js';
import AuditSignOff from './audit/sign-off.js';
import AuditLookupSme from './audit/lookup-sme.js';
import AuditGetQuizFromDb from './audit/get-quiz-from-db.js';
import AuditSeedAllData from './audit/seed-all-data.js';

const apis = {
  CampSetupTables,
  CampSubmitAttempt,
  CampGetUserAttempts,
  CampGetAnalytics,
  CampGetUserProgression,
  CampResetUserProgress,
  CampTrackReview,
  CampGetUserXP,
  CampGetLeaderboard,
  CampTrackVisit,
  CampGetVisitStats,
  CampGetCampers,
  CampRegisterViewer,
  CampLookupViewer,
  CampBackfillViewers,
  CampGetQuizSnapshot,
  CampBackfillSnapshots,
  CampAddRegionColumn,
  CampFixChrisRole,
  AuditSetupTables,
  AuditSeedData,
  AuditGetDashboard,
  AuditRegisterSme,
  AuditGetQuizDetail,
  AuditSaveQuestionEdit,
  AuditAddNote,
  AuditApproveQuestion,
  AuditReviewGear,
  AuditSignOff,
  AuditLookupSme,
  AuditGetQuizFromDb,
  AuditSeedAllData,
} as const;

export default apis;

/** Type for useApi inference - exported for client type-only imports */
export type ApiRegistry = typeof apis;
