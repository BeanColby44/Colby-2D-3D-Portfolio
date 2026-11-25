import fs from "node:fs";

const wanted = {
  Vite: ["vite", "646CFF"],
  NestJS: ["nestjs", "E0234E"],
  Git: ["git", "F05032"],
  GraphQL: ["graphql", "E10098"],
  Firebase: ["firebase", "FFCA28"],
  "Firebase Analytics": ["firebase", "FFCA28"],
  Magento: ["magento", "EE672F"],
  Leaflet: ["leaflet", "199900"],
  "Express.js": ["express", "FFFFFF"],
  GitHub: ["github", "FFFFFF"],
};

const marks = {};
for (const [name, [slug, hex]] of Object.entries(wanted)) {
  let res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@15.0.0/icons/${slug}.svg`);
  if (!res.ok) res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/${slug}.svg`);
  if (!res.ok) throw new Error(slug);
  const path = (await res.text()).match(/d="([^"]+)"/)[1];
  marks[name] = { path, hex };
}

const body = `export const EXTRA_MARKS: Record<string, { path: string; hex: string }> = ${JSON.stringify(marks, null, 2)};
`;
fs.writeFileSync(new URL("../src/skill-extra.ts", import.meta.url), body);
console.log("wrote", Object.keys(marks).length);
