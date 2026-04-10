"use client";

interface ChangelogEntry {
  date: string;
  changes: { article: string; description: string }[];
}

export default function KBChangelog({ entries }: { entries: ChangelogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div>
      {entries.slice(0, 3).map((entry) => (
        <div key={entry.date} className="mb-4 last:mb-0">
          <p className="font-display font-bold text-[11px] text-text-muted tracking-[0.1em] uppercase mb-2">
            {entry.date}
          </p>
          <div className="space-y-1.5">
            {entry.changes.map((change, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm font-body"
              >
                <span className="w-1 h-1 bg-brand-red mt-2 shrink-0" />
                <p className="text-text-secondary">
                  <span className="font-semibold text-text-primary">
                    {change.article}
                  </span>{" "}
                  — {change.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
