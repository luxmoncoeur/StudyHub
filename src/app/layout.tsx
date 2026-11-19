import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { LangPrefProvider } from "@/components/lang-pref";
import { HeaderCourses } from "@/components/nav/header-courses";
import { Search } from "@/components/nav/search";
import { navCourses } from "@/content/nav-index";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "StudyHub — BSIT 2nd Semester", template: "%s · StudyHub" },
  description: "Get ahead of next semester: lessons, demos, practice problems and walkthroughs for BSIT.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#07080a] font-sans text-neutral-200">
        <LangPrefProvider>
          <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07080a]/80 backdrop-blur">
            <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-5 text-sm">
              <Link href="/" className="shrink-0 font-semibold tracking-tight text-white">study<span className="text-sky-400">hub</span></Link>
              <Suspense fallback={<div className="flex-1" />}>
                <HeaderCourses courses={navCourses} />
              </Suspense>
              <div className="ml-auto"><Search courses={navCourses} /></div>
            </div>
          </header>
          {children}
        </LangPrefProvider>
      </body>
    </html>
  );
}
