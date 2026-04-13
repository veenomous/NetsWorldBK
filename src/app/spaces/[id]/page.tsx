import SpaceDetail from "@/components/SpaceDetail";

export const metadata = {
  title: "Space — BK Grit",
};

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <SpaceDetail paramsPromise={params} />;
}
