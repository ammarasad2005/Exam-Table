interface Props {
  query: string;
  batch: string;
  dept: string;
}

export function EmptyState({ query, batch, dept }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="font-mono text-4xl text-[var(--color-text-tertiary)] mb-4">∅</div>
      <p className="font-body text-sm text-[var(--color-text-secondary)] max-w-xs">
        {query
          ? `No exams matching "${query}" for ${dept} batch ${batch}.`
          : `No exams found for ${dept} batch ${batch}. Check that your batch year and department are correct.`}
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-6 font-mono text-xs underline underline-offset-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2"
      >
        Go back
      </button>
    </div>
  );
}
