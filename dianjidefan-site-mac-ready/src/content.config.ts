import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const baseSchema = {
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  publishedAt: z.string(),
  category: z.string(),
  draft: z.boolean().optional().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional()
};

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.md" }),
  schema: z.object({
    ...baseSchema,
    readMinutes: z.number(),
    tag: z.enum(["想法", "观察", "计划"]),
    nextSlug: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
    secondaryCtaLabel: z.string().optional(),
    secondaryCtaHref: z.string().optional()
  })
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: z.object({
    ...baseSchema,
    stack: z.string(),
    status: z.string(),
    roadmapId: z.string().optional(),
    featured: z.boolean().default(false)
  })
});

const games = defineCollection({
  loader: glob({ base: "./src/content/games", pattern: "**/*.md" }),
  schema: z.object({
    ...baseSchema,
    platform: z.string(),
    status: z.string(),
    playAnchor: z.string().optional(),
    featured: z.boolean().default(false)
  })
});

export const collections = { posts, projects, games };