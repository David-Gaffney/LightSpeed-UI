/** Normalizes the two supported content shapes before rendering. */
export interface NormalizedContent {
  title: string;
  slug: string;
  description: string;
  date?: string | undefined;
  author?: string | undefined;
  tags: string[];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Accepts `astro:content` entries `{ id, data }` and EmDash posts `{ slug, title, ... }`. */
export function normalizeContent(input: unknown): NormalizedContent {
  const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const data = (record.data && typeof record.data === "object" ? record.data : {}) as Record<string, unknown>;
  const authorValue = data.author ?? record.author;
  const author =
    typeof authorValue === "string"
      ? authorValue
      : authorValue && typeof authorValue === "object"
        ? text((authorValue as Record<string, unknown>).name)
        : undefined;

  return {
    title:
      text(data.title) ?? text(record.title) ?? text(record.id) ?? "Untitled",
    slug:
      text(record.slug) ?? text(record.id) ?? text(data.slug) ?? "untitled",
    description:
      text(data.description) ??
      text(record.description) ??
      text(data.excerpt) ??
      text(record.excerpt) ??
      "",
    date: text(data.date) ?? text(record.date) ?? text(record.publishedAt),
    author,
    tags: Array.isArray(data.tags ?? record.tags)
      ? ((data.tags ?? record.tags) as unknown[]).filter((t): t is string => typeof t === "string")
      : [],
  };
}
