import type { Metadata } from "next";
import ResultsGate from "@/components/ResultsGate";
import ScheduleList from "@/components/ScheduleList";

export const metadata: Metadata = { title: "Speelschema" };

export default function SchedulePage() {
  return (
    <section className="stack">
      <h1>Speelschema</h1>
      <p className="intro">Kies een wedstrijd om de uitslag in te voeren of te wijzigen.</p>
      <ResultsGate>
        <ScheduleList />
      </ResultsGate>
    </section>
  );
}
