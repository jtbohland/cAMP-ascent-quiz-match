import { App as AppProvider } from "@superblocksteam/library";

import { Toaster } from "./components/common/sonner";
import RegistrationGate from "./components/camp/RegistrationGate.js";

export default function AppComponent() {
  return (
    <>
      {/* Do not remove the AppProvider */}
      <AppProvider className="h-full w-full">
        <RegistrationGate />
      </AppProvider>
      <Toaster />
    </>
  );
}
