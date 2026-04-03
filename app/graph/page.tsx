import { getGraph } from "@/lib/queries";
import GraphExplorer from "@/components/GraphExplorer";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata = {
  title: "Graph Explorer — SteepGraph",
  description: "Interactive force-directed graph of 150 teas and their similarity relationships.",
};

export default async function GraphPage({
  searchParams,
}: {
  searchParams: { tea?: string };
}) {
  const payload = await getGraph();

  return (
    <GraphExplorer
      payload={payload}
      initialSelectedId={searchParams.tea}
    />
  );
}
