import { Experience } from "@/components/Experience";
import { getMoments } from "@/lib/moments";

/** Olha a pasta do Drive de novo a cada 15 minutos. */
export const revalidate = 900;

export default async function Home() {
  const { moments, source, error } = await getMoments();
  return <Experience moments={moments} source={source} error={error} />;
}
