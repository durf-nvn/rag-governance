import { RouterProvider } from "react-router";
import { router } from "./routes";
import { RoleProvider } from "./contexts/RoleContext";
import { useEffect, useState } from "react";
import ResetPasswordModal from "./components/ResetPasswordModal"; 

export default function App() {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const showReset = params.get("showReset");
    const email = params.get("email");

    if (showReset === "true" && email) {
      setResetEmail(email);
      setIsResetModalOpen(true);
      
      // OPTIONAL: Force the browser to recognize we are on the login path
      // if the router tried to kick us to the landing page.
      if (window.location.pathname !== "/login") {
        window.history.replaceState({}, document.title, "/login");
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);
  return (
    <RoleProvider>
      <RouterProvider router={router} />

      {/* This renders on top of whatever page the RouterProvider is showing */}
      <ResetPasswordModal 
        isOpen={isResetModalOpen} 
        email={resetEmail} 
        onClose={() => setIsResetModalOpen(false)} 
      />
    </RoleProvider>
  );
}