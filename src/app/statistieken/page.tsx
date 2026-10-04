import type { Metadata } from "next";
import ResultsGate from "@/components/ResultsGate";
import Stats from "@/components/Stats";

export const metadata: Metadata = { title: "Statistieken" };

export default function StatsPage() {
  return (
    <section className="stack">
      <h1>Statistieken</h1>
      <ResultsGate>
        <Stats />
      </ResultsGate>
    </section>
  );
}
