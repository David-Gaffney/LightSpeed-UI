import { describe, expect, it } from "vitest";
import { normalizeContent } from "../src/components/content/adapter.ts";

describe("@lsui/liftoff content adapter (Part 10.2)", () => {
  it("normalizes astro:content entries", () => {
    const result = normalizeContent({
      id: "hello",
      data: {
        title: "Hello",
        description: "A post",
        date: "2026-11-25",
        author: { name: "Ada" },
        tags: ["a", "b"],
      },
    });
    expect(result).toEqual({
      title: "Hello",
      slug: "hello",
      description: "A post",
      date: "2026-11-25",
      author: "Ada",
      tags: ["a", "b"],
    });
  });

  it("normalizes EmDash posts with top-level fields", () => {
    const result = normalizeContent({
      slug: "emdash-post",
      title: "EmDash",
      excerpt: "From CMS",
      publishedAt: "2026-11-20",
      author: "Grace",
      tags: ["cms"],
    });
    expect(result.title).toBe("EmDash");
    expect(result.slug).toBe("emdash-post");
    expect(result.description).toBe("From CMS");
    expect(result.date).toBe("2026-11-20");
    expect(result.author).toBe("Grace");
    expect(result.tags).toEqual(["cms"]);
  });

  it("falls back safely for missing or malformed data", () => {
    expect(normalizeContent(null)).toEqual({
      title: "Untitled",
      slug: "untitled",
      description: "",
      date: undefined,
      author: undefined,
      tags: [],
    });
  });
});
