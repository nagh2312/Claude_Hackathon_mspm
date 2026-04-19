"use client";

import { createContext, useContext, useMemo } from "react";
import { SessionProvider } from "next-auth/react";

type Flags = { googleAuthEnabled: boolean };

const FlagsContext = createContext<Flags>({ googleAuthEnabled: false });

export function useAppFlags(): Flags {
  return useContext(FlagsContext);
}

export function AppProviders({
  children,
  googleAuthEnabled,
}: {
  children: React.ReactNode;
  googleAuthEnabled: boolean;
}) {
  const value = useMemo(() => ({ googleAuthEnabled }), [googleAuthEnabled]);
  return (
    <SessionProvider>
      <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>
    </SessionProvider>
  );
}
