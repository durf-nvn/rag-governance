import type { UserRole } from "../contexts/RoleContext";

export const rolePermissions = {
  ADMIN: {
    canAccessDashboard: true,
    canAccessKnowledgeRepository: true,
    canAccessAskPolicy: true,
    canAccessAccreditationSupport: true,
    canAccessGovernanceReference: true,
    canAccessAuditTrail: true,
    canAccessUsersRoles: true,
    canAccessSettings: true,
    canAccessBroadcastAnnouncement: true,
    canAccessDocumentGenerator: true,
    canAccessGradeEvaluation: false,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canEditDocuments: true,
    canManageUsers: true,
    canViewAnalytics: true,
  },
  FACULTY: {
    canAccessDashboard: true,
    canAccessKnowledgeRepository: true,
    canAccessAskPolicy: true,
    canAccessAccreditationSupport: true,
    canAccessGovernanceReference: true,
    canAccessAuditTrail: false,
    canAccessUsersRoles: false,
    canAccessSettings: true,
    canAccessBroadcastAnnouncement: false,
    canAccessDocumentGenerator: true,
    canAccessGradeEvaluation: false,
    canUploadDocuments: true,
    canDeleteDocuments: false,
    canEditDocuments: true,
    canManageUsers: false,
    canViewAnalytics: true,
  },
  STUDENT: {
    canAccessDashboard: true,
    canAccessKnowledgeRepository: true,
    canAccessAskPolicy: true,
    canAccessAccreditationSupport: false,
    canAccessGovernanceReference: false,
    canAccessAuditTrail: false,
    canAccessUsersRoles: false,
    canAccessSettings: false,
    canAccessBroadcastAnnouncement: false,
    canAccessDocumentGenerator: false,
    canAccessGradeEvaluation: true,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canEditDocuments: false,
    canManageUsers: false,
    canViewAnalytics: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof typeof rolePermissions.ADMIN): boolean {
  return rolePermissions[role][permission];
}

export function getAccessibleRoutes(role: UserRole) {
  const permissions = rolePermissions[role];
  const routes = [];

  if (permissions.canAccessDashboard) routes.push("/app");
  if (permissions.canAccessKnowledgeRepository) routes.push("/app/knowledge-repository");
  if (permissions.canAccessAskPolicy) routes.push("/app/ask-policy");
  if (permissions.canAccessAccreditationSupport) routes.push("/app/accreditation-support");
  if (permissions.canAccessGovernanceReference) routes.push("/app/governance-reference");
  if (permissions.canAccessAuditTrail) routes.push("/app/audit-trail");
  if (permissions.canAccessUsersRoles) routes.push("/app/users-roles");
  if (permissions.canAccessSettings) routes.push("/app/settings");
  if (permissions.canAccessBroadcastAnnouncement) routes.push("/app/broadcast-announcement");
  if (permissions.canAccessDocumentGenerator) routes.push("/app/document-generator");
  if (permissions.canAccessGradeEvaluation) routes.push("/app/grade-evaluation");

  return routes;
}
