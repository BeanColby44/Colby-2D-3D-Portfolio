import fs from "node:fs";

const BRANDS = {
  "React.js": "react",
  "Angular": "angular",
  "Next.js": "nextdotjs",
  "JavaScript": "javascript",
  "TypeScript": "typescript",
  "HTML5": "html5",
  "CSS3": "css",
  "Tailwind CSS": "tailwindcss",
  "Python": "python",
  "Django": "django",
  "Django REST Framework": "django",
  "FastAPI": "fastapi",
  "Flask": "flask",
  "Java": "openjdk",
  "Spring Boot": "springboot",
  "Spring Framework": "spring",
  "C#": "csharp",
  "ASP.NET Core": "dotnet",
  ".NET": "dotnet",
  "Node.js": "nodedotjs",
  "PHP": "php",
  "Laravel": "laravel",
  "PostgreSQL": "postgresql",
  "MySQL": "mysql",
  "SQL Server": "microsoftsqlserver",
  "MongoDB": "mongodb",
  "Redis": "redis",
  "LangChain": "langchain",
  "Claude Code": "anthropic",
  "OpenAI Codex": "openai",
  "AWS": "amazonaws",
  "Google Cloud": "googlecloud",
  "Azure": "microsoftazure",
  "Docker": "docker",
  "Kubernetes": "kubernetes",
  "Terraform": "terraform",
  "GitHub Actions": "githubactions",
  "Azure App Service": "microsoftazure",
  "Azure Functions": "microsoftazure",
  "Azure DevOps": "azuredevops",
  "React Native": "react",
  ".NET MAUI": "dotnet",
  "Kotlin": "kotlin",
  "iOS": "apple",
  "Android": "android",
};

const CUSTOM = {
  "REST APIs": ["e8ecff", "M8 8 4 12l4 4M16 8l4 4-4 4M13 6l-2 12"],
  "SQL": ["4479A1", "M4 7h16M4 12h16M4 17h10"],
  "Database Design": ["336791", "M12 4c4.4 0 8 1.1 8 2.5S16.4 9 12 9 4 7.9 4 6.5 7.6 4 12 4zM4 6.5v11C4 19 7.6 20 12 20s8-1 8-2.5v-11"],
  "Query Optimization": ["336791", "M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM16 16l4 4"],
  "Generative AI": ["e879f9", "M12 3l1.6 4.8L18 9.4l-4.4 1.6L12 16l-1.6-5L6 9.4l4.4-1.6L12 3zM18 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"],
  "LLM APIs": ["10a37f", "M8 8 4 12l4 4M16 8l4 4-4 4M14 5l-4 14"],
  "AI Agents": ["e879f9", "M9 16v-2a3 3 0 0 1 6 0v2M8 16h8v4H8zM12 8a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 12 8z"],
  "Agent Orchestration": ["c4b5fd", "M6 7h4v4H6zM14 7h4v4h-4zM10 15h4v4h-4zM8 11v2h8M12 13v2"],
  "MCP": ["67e8f9", "M7 7h10v10H7zM4 12h3M17 12h3M12 4v3M12 17v3"],
  "RAG": ["a78bfa", "M6 5h8l4 4v10H6zM14 5v4h4M8 13h8M8 16h5"],
  "OCR": ["e7ebff", "M5 8V5h3M16 5h3v3M19 16v3h-3M8 19H5v-3M8 12h8"],
  "Document Processing": ["c4b5fd", "M7 4h7l4 4v12H7zM14 4v4h4M9 13h6M9 16h4"],
  "Machine Learning": ["ff6f00", "M5 16V8M12 16V5M19 16v-5M4 16h16"],
  "CI/CD": ["2088ff", "M7 7a3 3 0 1 0 0 6h10a3 3 0 1 0 0-6H7zM7 11a3 3 0 1 0 0 6h10a3 3 0 1 0 0-6"],
  "Mobile Backend Services": ["a78bfa", "M9 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2"],
  "API Integration": ["9ae6ff", "M8 8 4 12l4 4M16 8l4 4-4 4M10 16l4-8"],
  "Data Synchronization": ["67e8f9", "M7 8a5 5 0 0 1 8.5-2L17 8M17 8h-4M17 16a5 5 0 0 1-8.5 2L7 16M7 16h4"],
  "Cursor": ["e7ebff", "M5 3l12 8.2-5.4 1.2L9.2 18.5 5 3z"],
};

const icons = {};
const missing = [];
for (const [name, slug] of Object.entries(BRANDS)) {
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@15.0.0/icons/${slug}.svg`;
  let res = await fetch(url);
  if (!res.ok) res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/${slug}.svg`);
  if (!res.ok) {
    missing.push(`${name} ${slug} ${res.status}`);
    continue;
  }
  const svg = await res.text();
  const path = svg.match(/d="([^"]+)"/)?.[1];
  const title = svg.match(/<title>([^<]+)<\/title>/)?.[1] ?? slug;
  if (!path) {
    missing.push(`${name} ${slug} no-path`);
    continue;
  }
  icons[name] = { path, title };
  console.log("ok", name, title);
}

const out = `// Brand marks from Simple Icons (https://simpleicons.org), CC0. Concept marks are drawn for this site.
export interface SkillMark { path: string; stroke?: boolean; hex?: string }
export const SKILL_MARKS: Record<string, SkillMark> = ${JSON.stringify(
  Object.fromEntries([
    ...Object.entries(icons).map(([name, icon]) => [name, { path: icon.path }]),
    ...Object.entries(CUSTOM).map(([name, [hex, path]]) => [name, { path, stroke: true, hex }]),
  ]),
  null,
  2
)};

export function skillIcon(name: string) {
  const mark = SKILL_MARKS[name];
  if (!mark) return "";
  const color = mark.hex ? "#" + mark.hex : "currentColor";
  const body = mark.stroke
    ? \`<path d="\${mark.path}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>\`
    : \`<path fill="currentColor" d="\${mark.path}"/>\`;
  return \`<span class="skill-ico" style="color:\${color}" aria-hidden="true"><svg viewBox="0 0 24 24">\${body}</svg></span>\`;
}
`;
fs.writeFileSync(new URL("../src/skill-icons.ts", import.meta.url), out);
console.log("missing", missing);
console.log("count", Object.keys(icons).length);
