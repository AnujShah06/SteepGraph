import { getTeas, getBrands } from "@/lib/queries";
import ExploreView from "@/components/ExploreView";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function HomePage() {
  const [teas, brands] = await Promise.all([getTeas(), getBrands()]);

  return <ExploreView initialTeas={teas} brands={brands} />;
}
