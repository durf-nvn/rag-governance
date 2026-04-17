import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardRouter } from "./pages/DashboardRouter";
import { KnowledgeRepository } from "./pages/KnowledgeRepository";
import { AskPolicy } from "./pages/AskPolicy";
import { AccreditationSupport } from "./pages/AccreditationSupport";
import { GovernanceReference } from "./pages/GovernanceReference";
import { AuditTrail } from "./pages/AuditTrail";
import { UsersRoles } from "./pages/UsersRoles";
import { Settings } from "./pages/Settings";
import { BroadcastAnnouncement } from "./pages/BroadcastAnnouncement";
import { DocumentGenerator } from "./pages/DocumentGenerator";
import { AIDocumentGenerator } from "./pages/AIDocumentGenerator";
import { GradeEvaluation } from "./pages/GradeEvaluation";
import { StudentRecords } from "./pages/StudentRecords";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/app",
    element: <DashboardLayout />,
    children: [
      {
        path: "profile",
        element: <AdminProfilePage />,
      },
      { index: true, element: <DashboardRouter /> },
      {
        path: "knowledge-repository",
        element: (
          <ProtectedRoute permission="canAccessKnowledgeRepository">
            <KnowledgeRepository />
          </ProtectedRoute>
        ),
      },
      {
        path: "ask-policy",
        element: (
          <ProtectedRoute permission="canAccessAskPolicy">
            <AskPolicy />
          </ProtectedRoute>
        ),
      },
      {
        path: "accreditation-support",
        element: (
          <ProtectedRoute permission="canAccessAccreditationSupport">
            <AccreditationSupport />
          </ProtectedRoute>
        ),
      },
      {
        path: "governance-reference",
        element: (
          <ProtectedRoute permission="canAccessGovernanceReference">
            <GovernanceReference />
          </ProtectedRoute>
        ),
      },
      {
        path: "audit-trail",
        element: (
          <ProtectedRoute permission="canAccessAuditTrail">
            <AuditTrail />
          </ProtectedRoute>
        ),
      },
      {
        path: "users-roles",
        element: (
          <ProtectedRoute permission="canAccessUsersRoles">
            <UsersRoles />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute permission="canAccessSettings">
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: "broadcast-announcement",
        element: (
          <ProtectedRoute permission="canAccessBroadcastAnnouncement">
            <BroadcastAnnouncement />
          </ProtectedRoute>
        ),
      },
      {
        path: "document-generator",
        element: (
          <ProtectedRoute permission="canAccessDocumentGenerator">
            <DocumentGenerator />
          </ProtectedRoute>
        ),
      },
      {
        path: "ai-document-generator",
        element: (
          <ProtectedRoute permission="canAccessAIDocumentGenerator">
            <AIDocumentGenerator />
          </ProtectedRoute>
        ),
      },
      {
        path: "grade-evaluation",
        element: (
          <ProtectedRoute permission="canAccessGradeEvaluation">
            <GradeEvaluation />
          </ProtectedRoute>
        ),
      },
      {
        path: "student-records",
        element: (
          <ProtectedRoute permission="canAccessStudentRecords">
            <StudentRecords />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);