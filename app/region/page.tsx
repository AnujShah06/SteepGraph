import { getTeas, getRegionsWithCounts } from "@/lib/queries";
import RegionView from "@/components/RegionView";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata = {
  title: "Region Map — SteepWisdom",
  description: "Explore teas by their origin regions around the world.",
};

export default async function RegionPage({
  searchParams,
}: {
  searchParams: { pin?: string };
}) {
  const [teas, regionCounts] = await Promise.all([
    searchParams.pin
      ? getTeas({ region: searchParams.pin })
      : getTeas(),
    getRegionsWithCounts(),
  ]);

  return (
    <RegionView
      initialTeas={teas}
      regionCounts={regionCounts}
      initialRegion={searchParams.pin || null}
    />
  );
}
