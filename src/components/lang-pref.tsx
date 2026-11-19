"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/content/types";

const Ctx = createContext<{ pref: Lang | null; setPref: (l: Lang) => void }>({ pref: null, setPref: () => {} });

export function LangPrefProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<Lang | null>(null);
  useEffect(() => { setPrefState(localStorage.getItem("lang-pref") as Lang | null); }, []);
  const setPref = (l: Lang) => { setPrefState(l); localStorage.setItem("lang-pref", l); };
  return <Ctx.Provider value={{ pref, setPref }}>{children}</Ctx.Provider>;
}

export const useLangPref = () => useContext(Ctx);
