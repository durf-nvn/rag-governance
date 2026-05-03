import { createBrowserRouter, Outlet } from "react-router"; // <-- Note: added Outlet here
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
import { ProfileSettings } from "./pages/ProfileSettings";
import { BroadcastAnnouncement } from "./pages/BroadcastAnnouncement";
import { DocumentGenerator } from "./pages/DocumentGenerator";
import { AIDocumentGenerator } from "./pages/AIDocumentGenerator";
import { GradeEvaluation } from "./pages/GradeEvaluation";
import { StudentRecords } from "./pages/StudentRecords";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProvider } from "./contexts/RoleContext"; // <-- Import the provider here

// Create a root layout that wraps EVERYTHING in the RoleProvider
function RootLayout() {
  return (
    <RoleProvider>
      <Outlet /> 
    </RoleProvider>
  );
}

export const router = createBrowserRouter([
  {
    // The root layout acts as the very top level for all routes
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
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
            path: "profile-settings",
            element: (
              <ProtectedRoute>
                <ProfileSettings />
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
    ],
  },
]);