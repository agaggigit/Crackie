export function PlaceholderSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded border border-dashed border-foreground/20 p-4">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="font-semibold">{title}</h2>
        <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-300">
          Placeholder
        </span>
      </div>
      <p className="text-sm opacity-70">{description}</p>
    </section>
  );
}
