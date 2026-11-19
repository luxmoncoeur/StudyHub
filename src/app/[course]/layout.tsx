import { Suspense } from "react";
import { CourseSidebar, MobileCourseNav } from "@/components/nav/course-nav";
import { navCourses } from "@/content/nav-index";

export default function CourseLayout({ children, params }: LayoutProps<"/[course]">) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 py-8">
      <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin] md:block">
        <Suspense fallback={null}>
          <Sidebar params={params} />
        </Suspense>
      </aside>
      <div className="min-w-0 flex-1">
        <Suspense fallback={null}>
          <MobileNav params={params} />
        </Suspense>
        {children}
      </div>
    </div>
  );
}

async function Sidebar({ params }: Pick<LayoutProps<"/[course]">, "params">) {
  const { course: slug } = await params;
  const course = navCourses.find((c) => c.slug === slug);
  return course ? <CourseSidebar course={course} /> : null;
}

async function MobileNav({ params }: Pick<LayoutProps<"/[course]">, "params">) {
  const { course: slug } = await params;
  const course = navCourses.find((c) => c.slug === slug);
  return course ? <MobileCourseNav course={course} /> : null;
}
