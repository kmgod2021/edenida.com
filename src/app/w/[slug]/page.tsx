import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Public wedding websites — implemented in Phase 4. */
export default async function PublicWeddingPage({ params }: Props) {
  await params;
  notFound();
}
