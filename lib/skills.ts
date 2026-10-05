import { Prisma, PrismaClient } from "@prisma/client";
import { slugify } from "@/lib/forms";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Finds or creates skills by slug so "React", "react" and "React " map to one record.
 * Existing skills keep their original name and category.
 */
export async function upsertSkills(db: Db, names: string[], category: string) {
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  if (!bySlug.size) return [];

  const slugs = [...bySlug.keys()];
  // Older rows may have slugs from a different slug function, so match by name as well.
  const where = { OR: [{ slug: { in: slugs } }, { name: { in: [...bySlug.values()] } }] };
  const existing = await db.skill.findMany({ where });
  const known = new Set(existing.flatMap((skill) => [skill.slug, slugify(skill.name)]));
  const missing = slugs.filter((slug) => !known.has(slug));

  if (missing.length) {
    await db.skill.createMany({
      data: missing.map((slug) => ({ slug, name: bySlug.get(slug)!, category: category || "General" })),
      skipDuplicates: true
    });
  }

  return missing.length ? db.skill.findMany({ where }) : existing;
}
