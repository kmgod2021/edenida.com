import { WeddingSettingsForm } from "@/features/workspace/components/wedding-settings-form";

export default async function WeddingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  return (
    <section className="max-w-xl">
      <h1 className="font-display text-4xl text-ink md:text-5xl">Réglages</h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        Le titre, la date, le fuseau et la devise de ce mariage.
      </p>
      {saved === "1" ? (
        <p role="status" className="mt-6 text-sm text-success">
          Modifications enregistrées.
        </p>
      ) : null}
      <WeddingSettingsForm />
    </section>
  );
}
