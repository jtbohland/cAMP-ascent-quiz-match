import { App as AppProvider } from "@superblocksteam/library";
import { Outlet } from "react-router";
import { Toaster } from "./components/common/sonner";

/**
 * Lightweight app shell for the /audit route.
 * Provides AppProvider (required for APIs/auth) but skips
 * the camper RegistrationGate — the audit page has its own SME registration.
 */
export default function AuditAppShell() {
  return (
    <>
      <AppProvider className="h-full w-full">
        <Outlet />
      </AppProvider>
      <Toaster />
    </>
  );
}
