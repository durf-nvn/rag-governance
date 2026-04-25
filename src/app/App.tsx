import { RouterProvider } from "react-router";
import { router } from "./routes";
import { RoleProvider } from "./contexts/RoleContext";
import { useEffect, useState } from "react";
import ResetPasswordModal from "./components/ResetPasswordModal"; 

// 1. Import the registration function from ldrs
import { hourglass } from 'ldrs';

export default function App() {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // 2. Register the hourglass loader so it's available throughout your project
  hourglass.register();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const showReset = params.get("showReset");
    const email = params.get("email");

    if (showReset === "true" && email) {
      setResetEmail(email);
      setIsResetModalOpen(true);
      
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

      <ResetPasswordModal 
        isOpen={isResetModalOpen} 
        email={resetEmail} 
        onClose={() => setIsResetModalOpen(false)} 
      />
    </RoleProvider>
  );
}