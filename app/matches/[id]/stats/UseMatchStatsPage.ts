import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMatchStore } from "@/hooks/useMatchStore";
import { normalizeMatchStats } from "./utils/normalizeMatchStats";
import { SECTIONS } from "./constants";

export function useMatchStatsPage() {
  const { id } = useParams();
  const { match, fetchingMatch, fetchMatch } = useMatchStore();

  const [activeSection, setActiveSection] = useState("overview");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!id) return;
    fetchMatch(id as string, "individual");
  }, [id, fetchMatch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-120px 0px -60%" }
    );

    Object.values(sectionRefs.current).forEach(
      (el) => el && observer.observe(el)
    );

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;

    // Immediately update active section for instant visual feedback
    setActiveSection(id);

    window.scrollTo({
      top: el.offsetTop - 110,
      behavior: "smooth",
    });
  };

  return {
    loading: fetchingMatch,
    match,
    sections: SECTIONS,
    activeSection,
    scrollToSection,
    sectionRefs,
    normalized: match ? normalizeMatchStats(match) : null,
  };
}
