import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";
import RegisterPage from "@/pages/Register/index.js";

const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

export default function RegistrationGate() {
  const user = useSuperblocksUser();
  const userEmail = user?.email ?? "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());

  const [justRegistered, setJustRegistered] = useState(false);

  const { data, loading } = useApiData(
    "CampLookupViewer",
    { userEmail },
    { enabled: !!userEmail && !isAdmin }
  );

  const handleRegistrationComplete = useCallback(() => {
    setJustRegistered(true);
  }, []);

  // Admins bypass
  if (isAdmin) {
    return <Outlet />;
  }

  // Still loading lookup
  if (loading || !userEmail) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">⛰️</div>
          <p className="text-amber-700 font-medium">Loading your trail...</p>
        </div>
      </div>
    );
  }

  // Not registered — show registration form
  if (!data?.isRegistered && !justRegistered) {
    return <RegisterPage onComplete={handleRegistrationComplete} />;
  }

  // Registered — show the app
  return <Outlet />;
}
