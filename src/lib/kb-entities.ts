// Known KB entities — maps display names to their KB article paths
// This is generated from the KB at build time in the future;
// for now it's a manual list of key entities fans will recognize

export interface KBEntity {
  name: string;
  aliases: string[];     // alternate forms fans might use
  category: string;
  slug: string;
}

export const KB_ENTITIES: KBEntity[] = [
  {
    name: "Cameron Johnson",
    aliases: ["Cam Johnson", "CamJohnson"],
    category: "players",
    slug: "cameron-johnson",
  },
  {
    name: "Kevin Durant",
    aliases: ["KD", "Durant"],
    category: "trades",
    slug: "kevin-durant-trade-tree",
  },
  {
    name: "Mikal Bridges",
    aliases: ["Bridges"],
    category: "trades",
    slug: "kevin-durant-trade-tree",
  },
  {
    name: "Sean Marks",
    aliases: ["Marks"],
    category: "front-office",
    slug: "sean-marks-era",
  },
  {
    name: "Tank Math",
    aliases: ["tanking", "tank"],
    category: "concepts",
    slug: "tank-math",
  },
  {
    name: "Pick Inventory",
    aliases: ["pick haul", "draft picks", "pick stash"],
    category: "concepts",
    slug: "nets-pick-inventory",
  },
];

// Quick lookup: all names and aliases → entity
const entityMap = new Map<string, KBEntity>();
for (const entity of KB_ENTITIES) {
  entityMap.set(entity.name.toLowerCase(), entity);
  for (const alias of entity.aliases) {
    entityMap.set(alias.toLowerCase(), entity);
  }
}

export function findEntity(text: string): KBEntity | undefined {
  return entityMap.get(text.toLowerCase());
}

export function getEntityHref(entity: KBEntity): string {
  return `/kb/${entity.category}/${entity.slug}`;
}
