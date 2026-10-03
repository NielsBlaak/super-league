import type { Metadata } from "next";
import ResultsGate from "@/components/ResultsGate";
import TopScorersTable from "@/components/TopScorersTable";

export const metadata: Metadata = { title: "Topscorers" };

export default function TopScorersPage() {
  return (
    <section className="stack">
      <h1>Topscorers</h1>
      <ResultsGate>
        <TopScorersTable />
      </ResultsGate>
    </section>
  );
}
