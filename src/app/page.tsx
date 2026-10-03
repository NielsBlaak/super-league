import NextMatchCard from "@/components/NextMatchCard";
import ResultsGate from "@/components/ResultsGate";
import StandingsTable from "@/components/StandingsTable";

export default function HomePage() {
  return (
    <ResultsGate>
      <NextMatchCard />
      <section className="stack">
        <h2>Stand</h2>
        <StandingsTable />
      </section>
    </ResultsGate>
  );
}
