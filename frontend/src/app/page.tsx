import { promises as fs } from "fs";
import path from "path";
import type { Summary, Match } from "@/lib/types";
import ClientApp from "@/components/ClientApp";

export default async function Page() {
  const dataDir = path.join(process.cwd(), "public", "data");

  const summaryRaw = await fs.readFile(
    path.join(dataDir, "summary.json"),
    "utf-8"
  );
  const matchesRaw = await fs.readFile(
    path.join(dataDir, "matches.json"),
    "utf-8"
  );

  const summary: Summary = JSON.parse(summaryRaw);
  const matches: Match[] = JSON.parse(matchesRaw);

  return <ClientApp summary={summary} matches={matches} />;
}
