import { Experience } from "@/components/Experience";
import { sampleMoments } from "@/lib/sample";

export default function Home() {
  return <Experience moments={sampleMoments} />;
}
