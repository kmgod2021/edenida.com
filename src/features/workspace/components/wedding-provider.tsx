"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { WeddingContext } from "../domain/types";

const Context = createContext<WeddingContext | null>(null);

export function WeddingProvider({
  value,
  children,
}: {
  value: WeddingContext;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWeddingContext(): WeddingContext {
  const value = useContext(Context);
  if (!value) {
    throw new Error("useWeddingContext doit être utilisé dans WeddingProvider");
  }
  return value;
}
