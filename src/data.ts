// All portfolio content lives here. Sources: résumé PDF (Nov 2026), project list (.docx), skills list (1.txt).

export const PROFILE = {
  name: "COLBY BEAN",
  displayName: "Colby Bean",
  title: "Full Stack Engineer",
  tagline: "7+ years building enterprise web applications, scalable backend systems, and cloud-based software.",
  location: "Winter Park, FL",
  email: "colbybean321@gmail.com",
  linkedin: "https://linkedin.com/in/colby-bean-922179449/",
  github: "https://github.com/BeanColby44",
  resume: "Colby-Bean-Resume.pdf",
  summary: [
    "Senior Full Stack & Mobile Engineer with deep expertise architecting scalable web and cross-platform mobile applications using Java, C#, .NET, React, and TypeScript.",
    "Experienced in delivering high-concurrency mobile solutions (React Native, .NET MAUI, Blazor Hybrid) alongside cloud-native architectures on AWS and Google Cloud.",
    "Proven adaptability across enterprise stacks—when project requirements called for Python-based AI and research workflows, rapidly learned Python and Django to build and ship production platforms serving 100,000+ participants.",
  ],
  education: {
    degree: "Bachelor of Science in Computer Science",
    school: "University of Florida",
    years: "2015 – 2019",
  },
};

export interface StackGroup {
  group: string;
  color: string;
  items: string[];
}

export interface Job {
  start: string;
  end: string;
  title: string;
  company: string;
  type: string;
  place: string;
  summary: string;
  points: string[];
  /** Skills from the résumé, grouped by area. */
  groups: StackGroup[];
  /** flat list (derived) */
  stack: string[];
}

const G = {
  fe: { group: "Frontend", color: "#22d3ee" },
  be: { group: "Backend", color: "#a78bfa" },
  db: { group: "Data", color: "#60a5fa" },
  mo: { group: "Mobile", color: "#c4b5fd" },
  cl: { group: "Cloud & DevOps", color: "#38bdf8" },
  ai: { group: "AI & LLM", color: "#e879f9" },
  pr: { group: "Practices", color: "#f472b6" },
};

const job = (j: Omit<Job, "stack" | "groups"> & { groups: [keyof typeof G, string[]][] }): Job => {
  const groups = j.groups.map(([k, items]) => ({ ...G[k], items }));
  return { ...j, groups, stack: groups.flatMap((g) => g.items) };
};

// Career copy and skills follow the résumé (Nov 2026).
export const EXPERIENCE: Job[] = [
  job({
    start: "11/2024", end: "10/2026", title: "Full Stack Engineer", company: "ZCO Corporation", type: "Contract · Nashua", place: "Nashua",
    summary: "Developed web and mobile applications for financial technology and business platforms, with a focus on secure backend systems, application performance, and simpler business processes.",
    points: [
      "Developed web applications using React, Java, and Spring Boot, improving system performance and efficiency.",
      "Built cross-platform mobile applications using React Native, C#, .NET MAUI, and Blazor Hybrid for iOS and Android.",
      "Developed RESTful APIs using Node.js, Express.js, and TypeScript to connect frontend applications with backend services.",
      "Managed application data using MongoDB, PostgreSQL, and MySQL, improving data storage and retrieval.",
      "Optimized backend services using Java and SQL to reduce manual processing and improve system efficiency.",
      "Improved API security, authentication, and data synchronization for reliable web and mobile applications.",
      "Built reusable components and added automated tests, speeding up development by 50%.",
    ],
    groups: [
      ["fe", ["React", "TypeScript", "JavaScript"]],
      ["mo", ["React Native", ".NET MAUI", "Blazor Hybrid", "iOS", "Android"]],
      ["be", ["Java", "Spring Boot", "Node.js", "Express.js", "C#", ".NET", "REST APIs", "Authentication", "API Security"]],
      ["db", ["MongoDB", "PostgreSQL", "MySQL", "SQL"]],
      ["pr", ["Automated Testing", "Data Synchronization"]],
    ],
  }),
  job({
    start: "10/2021", end: "10/2024", title: "Backend Developer", company: "Arbisoft", type: "Contract · Plano", place: "Plano",
    summary: "Developed AI-powered healthcare applications and IT solutions, improving research workflows, automating business processes, and building scalable web applications.",
    points: [
      "Developed healthcare web applications using Python, Django, React, and TypeScript to improve business workflows.",
      "Built RESTful APIs and backend services using Python and Django, following development patterns similar to Ruby on Rails.",
      "Integrated LLM APIs and OCR to automate data extraction and reduce manual research tasks by 70%.",
      "Used Claude Code, Codex, and context engineering to speed up development and reduce coding time by 30%.",
      "Implemented background processing using Redis and Celery to handle asynchronous tasks efficiently.",
      "Managed application deployments using Docker, Kubernetes, and Google Cloud to improve scalability and reliability.",
    ],
    groups: [
      ["fe", ["React", "TypeScript"]],
      ["be", ["Python", "Django", "REST APIs"]],
      ["ai", ["LLM APIs", "OCR", "Claude Code", "Codex", "Context Engineering"]],
      ["db", ["Redis"]],
      ["cl", ["Celery", "Docker", "Kubernetes", "Google Cloud"]],
      ["pr", ["Agile", "Code Review"]],
    ],
  }),
  job({
    start: "07/2019", end: "09/2021", title: "Software Engineer", company: "Designli", type: "Greenville", place: "Greenville",
    summary: "Developed SaaS platforms, business applications, and e-commerce websites, with a focus on responsive applications, website performance, and automated business workflows.",
    points: [
      "Developed responsive websites using WordPress, Elementor, PHP, MySQL, HTML, CSS, JavaScript, and jQuery.",
      "Built web applications using Angular, TypeScript, C#, Go, .NET, and SQL Server to improve performance and reliability.",
      "Improved website loading speed, mobile responsiveness, and user experience across different devices.",
      "Implemented SEO improvements, including metadata, image optimization, and website structure updates.",
      "Integrated third-party APIs to automate business processes and connect applications with external services.",
      "Automated cloud deployments using AWS, Terraform, and GitHub Actions to simplify release processes.",
    ],
    groups: [
      ["fe", ["Angular", "TypeScript", "JavaScript", "jQuery", "HTML5", "CSS3", "WordPress", "Elementor"]],
      ["be", ["PHP", "C#", "Go", ".NET", "REST APIs"]],
      ["db", ["MySQL", "SQL Server"]],
      ["cl", ["AWS", "Terraform", "GitHub Actions", "CI/CD"]],
      ["pr", ["SEO", "Responsive Web Design"]],
    ],
  }),
];

export const ACHIEVEMENTS = [
  { title: "Raised Engineering Efficiency by 32%", text: "Strengthened API security and automated regression testing, lifting engineering efficiency by 32%." },
  { title: "Cut Manual Research by 70%", text: "Integrated LLM and OCR services to automate clinical document extraction and cut manual research time by 70%." },
  { title: "Boosted Load Speed by 50%", text: "Tuned SQL Server and PostgreSQL plans and React rendering, boosting application load speed by 50%." },
  { title: "Optimized Backend Processing", text: "Tuned Java and SQL services to reduce manual processing and improve storage, retrieval, and system efficiency." },
  { title: "Strengthened Cloud Delivery", text: "Deployed with Docker, Kubernetes, Google Cloud, AWS, Terraform, and GitHub Actions to make releases more reliable." },
];

export interface SkillGroup {
  name: string;
  short: string;
  color: string;
  items: string[];
}

export const SKILLS: SkillGroup[] = [
  {
    name: "Frontend Development", short: "Frontend", color: "#22d3ee",
    items: ["React.js", "Angular", "Next.js", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS"],
  },
  {
    name: "Backend Development", short: "Backend", color: "#8b5cf6",
    items: ["Python", "Django", "Django REST Framework", "FastAPI", "Flask", "Java", "Spring Boot", "Spring Framework", "C#", "ASP.NET Core", ".NET", "Node.js", "PHP", "Laravel", "REST APIs"],
  },
  {
    name: "Databases", short: "Databases", color: "#3b82f6",
    items: ["PostgreSQL", "MySQL", "SQL Server", "MongoDB", "Redis", "SQL", "Database Design", "Query Optimization"],
  },
  {
    name: "AI & LLM Engineering", short: "AI & LLM", color: "#e879f9",
    items: ["Generative AI", "LLM APIs", "AI Agents", "Agent Orchestration", "MCP", "LangChain", "RAG", "OCR", "Document Processing", "Machine Learning", "Claude Code", "OpenAI Codex", "Cursor"],
  },
  {
    name: "Cloud & DevOps", short: "Cloud", color: "#38bdf8",
    items: ["AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CI/CD", "Azure App Service", "Azure Functions", "Azure DevOps"],
  },
  {
    name: "Mobile Development", short: "Mobile", color: "#a78bfa",
    items: ["React Native", ".NET MAUI", "Kotlin", "iOS", "Android", "Mobile Backend Services", "API Integration", "Data Synchronization"],
  },
];

export const CATEGORIES: Record<string, string> = {
  platform: "SaaS Platform",
  mobile: "Mobile App",
  shopify: "Shopify E-commerce",
  wordpress: "WordPress",
};

export interface Project {
  slug: string;
  name: string;
  sub: string;
  cat: keyof typeof CATEGORIES;
  featured?: boolean;
  summary: string;
  role: string;
  tags: string[];
  url: string;
  linkLabel: string;
}

// Order follows Colby_Lee_Bean_Professional_Project_Portfolio.docx.
export const PROJECTS: Project[] = [
  {
    slug: "joinedbio", name: "JoinedBio", sub: "AI-Powered Health Research Marketplace", cat: "platform", featured: true,
    summary: "A digital health research marketplace that connects prospective participants with organizations running studies. Web portals, backend APIs, and asynchronous processing support participant information, study coordination, and AI-assisted research workflows.",
    role: "Built the user-facing portals and API gateway with React, Next.js, TypeScript, and Node.js (NestJS), backed by PostgreSQL and Redis. Built a separate C# and .NET microservice that normalized partner health records and synced them through REST APIs. Used Claude Code, Cursor, Codex, and GitHub Copilot to shorten an estimated one-year roadmap to six months, and paired strict eligibility rules with LLM reasoning so manual review time fell by 70%. Packaged the Node.js and .NET services in Docker for Google Cloud and Kubernetes.",
    tags: ["C#", ".NET", "TypeScript", "Node.js", "NestJS", "React", "Next.js", "PostgreSQL", "Redis", "LLM APIs", "AI Integration", "Docker", "Git", "Google Cloud", "Kubernetes", "Claude Code", "Cursor", "Codex"],
    url: "https://joined.bio/", linkLabel: "Visit website",
  },
  {
    slug: "carwash-app", name: "CarWash App", sub: "Car Wash Management & Customer Loyalty", cat: "mobile",
    summary: "A web and mobile-connected car wash platform where customers buy individual washes, manage monthly memberships, and use promotions and referrals. Business tools cover customers, subscriptions, payments, marketing campaigns, and day-to-day operations.",
    role: "Developed web and mobile features for customer and business management, including registration, single-wash purchases, and recurring memberships. Built promotions, referrals, and SMS and email engagement, plus an administrative dashboard for customers, memberships, payments, and car wash operations.",
    tags: ["C#", ".NET", ".NET MAUI", "Blazor Hybrid", "REST APIs", "Firebase Analytics", "OneSignal", "iOS", "Android"],
    url: "https://carwashapp.com/", linkLabel: "Visit website",
  },
  {
    slug: "tdj-golf", name: "TDJ Golf", sub: "Social Golf, Stats & Fantasy", cat: "platform", featured: true,
    summary: "A sports-tech platform where amateur golfers organize private group games, track round statistics, follow live Pro Tour leaderboards, and compete in fantasy contests. The web app pairs Angular views with Java services and MySQL, including Early Access onboarding.",
    role: "Built modular Angular and TypeScript dashboards for private groups, stat tracking, and Early Access onboarding. Engineered Java and Spring Boot APIs for group rules, live scoring, notifications, and free versus premium access. Designed MySQL schemas for profiles, rosters, round histories, and fantasy standings, and synced Pro Tour leaderboards, odds, and news into the client.",
    tags: ["Angular", "TypeScript", "Java", "Spring Boot", "MySQL", "RESTful APIs", "Relational Database Design", "Sports Data & Leaderboard Integration", "Role-Based Authentication", "Agile Development"],
    url: "https://tdjgolf.com/", linkLabel: "Visit website",
  },
  {
    slug: "burndy", name: "Burndy Intelli Tools", sub: "Mobile Product Information App", cat: "mobile",
    summary: "A mobile product-reference app for electrical professionals who need product details in the field. It supports product lookup, technical specifications, documentation, and a usable reference when a job site has no signal.",
    role: "Built React Native screens for iOS and Android so field electricians can search connectors, read specifications, and open installation guides. Engineered C# and .NET APIs for the catalog, compatibility rules, inspection guides, and sales-rep lookup, modeled the SQL catalog, and added on-device caching so specs stay available offline.",
    tags: ["React Native", "C#", ".NET", "SQL", "REST APIs", "iOS", "Android", "Mobile Application Development"],
    url: "https://apps.apple.com/us/app/burndy-connect/id1294811019", linkLabel: "View on App Store",
  },
  {
    slug: "best-ride", name: "Best Ride", sub: "Rideshare & Taxi Price Comparison", cat: "mobile",
    summary: "A mobility comparison app that gathers live fare estimates from rideshare and taxi providers. Passengers compare prices side by side on iOS and Android, then open their chosen service to finish the booking.",
    role: "Built React Native screens where riders enter a destination and compare live fares across Uber, DiDi, Ola, and local taxis. Engineered aggregation services that query provider pricing APIs together and normalize estimates, ETAs, and vehicle tiers. Added address autocomplete, GPS origin detection, deep links into the chosen booking flow, and subscription and referral handling.",
    tags: ["React Native", "Node.js", "RESTful APIs", "Third-Party Rideshare & Maps APIs", "Geolocation", "Deep Linking", "In-App Subscriptions", "iOS", "Android"],
    url: "https://www.bestride.com.au/", linkLabel: "Visit website",
  },
  {
    slug: "pattern", name: "Pattern", sub: "Online Ordering & Loyalty Platform", cat: "mobile",
    summary: "A food-tech platform for online ordering, digital loyalty, and promotions at restaurants and grocers. Consumer iOS and Android apps sit beside a merchant order app and a Python and Django backend that has processed more than 100,000 orders.",
    role: "Built branded React Native apps so customers can browse deals, place orders, and redeem rewards, plus a merchant app for receiving and fulfilling orders. Engineered the Python and Django server and admin portal for menus, offers, and high-volume orders, and built the loyalty and discount module that connected to the restaurants' existing systems.",
    tags: ["React Native", "Python", "Django", "REST APIs", "iOS", "Android", "Loyalty & Offers Engine", "Order Management Systems", "Mobile Application Development"],
    url: "https://thepattern.app/", linkLabel: "Visit website",
  },
  {
    slug: "freightmate", name: "Freightmate", sub: "Fleet Management & Logistics SaaS", cat: "platform", featured: true,
    summary: "A fleet management and logistics platform for dispatch, trip coordination, fleet visibility, invoicing, and reporting. Operational screens stay connected to the services transportation teams use each day.",
    role: "Refactored SQL Server queries and indexing so the live fleet map loaded about 70% faster and data-retrieval I/O fell by 95%. Built GPS, ELD, and driver-app tracking with SMS alerts on geofence entry and exit, and a C# and .NET scheduling API covering about 12,000 automated loads a year plus AI extraction for rate confirmations. Rebuilt the React design system, shipped a reporting suite for about one million rows, and set up AWS, Terraform, and GitHub Actions releases.",
    tags: ["React", "TypeScript", "JavaScript", "C#", ".NET", "SQL Server", "AWS", "Terraform", "GitHub Actions", "REST APIs", "GPS/ELD Telematics Integration", "Agile/Scrum"],
    url: "https://www.freightmateapp.com/", linkLabel: "Visit website",
  },
  {
    slug: "elastic-path", name: "Elastic Path", sub: "Composable & Headless Commerce", cat: "platform",
    summary: "An API-first commerce platform for multi-brand B2B and B2C storefronts, product catalogs, and custom checkout. The work covered storefront delivery and the backend connections those storefronts depend on.",
    role: "Built headless storefront components in Next.js, React, and TypeScript on Elastic Path commerce APIs. Connected REST and GraphQL for multi-catalog merchandising, price books, bundles, and cart and checkout flows, and synced orders, inventory, and customer accounts with ERP, CRM, and payment systems. Cleared integration bottlenecks so production milestones landed on schedule.",
    tags: ["React", "Next.js", "TypeScript", "Node.js", "Java", "RESTful APIs", "GraphQL", "Headless E-Commerce", "ERP/CRM Integration", "Microservices"],
    url: "https://www.elasticpath.com/", linkLabel: "Visit website",
  },
  {
    slug: "lex-mundi", name: "Lex Mundi", sub: "Global Legal Network Directory", cat: "mobile",
    summary: "Native iOS and Android directory apps for a network of 150 independent law firms across more than 125 countries. Attorneys and corporate counsel can reach member profiles, jurisdictions, and practice areas without a printed directory.",
    role: "Built the native iOS and Android apps from concept through the App Store and Google Play, replacing the annual printed directories. Added search and filtering by jurisdiction, country, practice area, and firm, and designed the data model and sync so firm listings, contacts, and regional hub details stay current on each device.",
    tags: ["React Native", "iOS", "Android", "Native Mobile Application Development", "RESTful APIs", "Search & Filtering Architecture", "Offline Data Sync", "UI/UX Design", "Agile/Basecamp"],
    url: "https://lexmundi.com/", linkLabel: "Visit website",
  },
  {
    slug: "cloudeoc", name: "CloudEOC", sub: "Emergency & Firefighting Mobilization", cat: "platform", featured: true,
    summary: "A statewide firefighting mobilization web platform for emergency agencies. It coordinates personnel, vehicles, and equipment across neighboring counties while a response is underway.",
    role: "Designed and built the emergency response application with React, TypeScript, Node.js, and Express.js on AWS. Automated email offers so county fire chiefs can submit personnel and equipment, and built coordinator screens to accept part of a tender, accept all of it, or decline it. Kept the public-safety systems current with mapping and later feature work.",
    tags: ["React", "TypeScript", "Node.js", "Express.js", "AWS", "RESTful APIs", "Geospatial & Mapping Integration", "Automated Email Notifications", "UI/UX Design"],
    url: "https://www.earthtechint.com/", linkLabel: "Visit website",
  },
  {
    slug: "goodtwice", name: "GoodTwice", sub: "Goodwill SC E-Commerce Platform", cat: "platform",
    summary: "A curated resale shop for high-end clothing donations sold at fixed prices. Native iOS and Android apps sat on a Magento backend, with store credit and merchandising tools that supported a reported threefold rise in online sales.",
    role: "Built native iOS and Android shopping apps with product sliders, cart reminders, and mobile browsing. Re-architected the Magento backend, database, and AWS environments so pages that took about 20 seconds loaded in under 2. Added store-credit accounts and a banner manager for scheduled and animated promotions, and stabilized checkout and uptime through the relaunch.",
    tags: ["Magento", "PHP", "MySQL", "AWS", "iOS", "Android", "Native Mobile Development", "E-Commerce Performance Optimization", "Store Credit & Checkout Workflows"],
    url: "https://www.goodwillsc.org/", linkLabel: "Visit website",
  },
  {
    slug: "weather-routing", name: "Weather-Aware Truck Routing", sub: "Logistics Planning Platform", cat: "platform",
    summary: "A logistics planning application that helps truck drivers compare routes based on forecast weather and vehicle load. Maps, routing, and weather data highlight wind, rain, and snow risk along a journey.",
    role: "Architected the logistics platform and Django REST Framework APIs for routing, vehicle load, and weather. Built React, TypeScript, and Leaflet dashboards for route comparison and weather overlays, connected OpenStreetMap with Open-Meteo forecasts, and owned Docker packaging and the Railway deployment.",
    tags: ["React", "TypeScript", "Vite", "Python", "Django REST Framework", "Leaflet", "OpenStreetMap", "Open-Meteo", "Docker", "Gunicorn", "WhiteNoise", "Railway"],
    url: "https://weather-aware-truck-routing.up.railway.app/", linkLabel: "Visit website",
  },
];

export const METRICS = [
  { value: 7, suffix: "+", label: "Years of experience" },
  { value: EXPERIENCE.length, suffix: "", label: "Companies" },
  { value: SKILLS.reduce((n, g) => n + g.items.length, 0), suffix: "", label: "Technologies & practices" },
];


/* ------------------------------------------------------------------ */
/* Section content (edit freely)                                      */
/* ------------------------------------------------------------------ */

/** 03 · Experience snapshot: professional strengths */
export const STRENGTHS = [
  { title: "Enterprise web applications", text: "React, Angular, and TypeScript applications for SaaS, finance, and healthcare platforms." },
  { title: "Backend services & APIs", text: "Java, Spring Boot, Python, Django, Node.js, and C# services with REST APIs and SQL." },
  { title: "Mobile-connected systems", text: "React Native, .NET MAUI, and Blazor Hybrid apps for iOS and Android." },
  { title: "Cloud & delivery", text: "Docker, Kubernetes, AWS, Google Cloud, Terraform, and CI/CD pipelines." },
  { title: "AI-assisted engineering", text: "LLM APIs, OCR, Claude Code, Codex, and context engineering in product work." },
];

/** 07 · How I build: workflow from idea to launch */
export const WORKFLOW = [
  { step: "Discover", text: "Clarify goals, users and constraints; map the data, integrations and edge cases." },
  { step: "Architect", text: "Design APIs, data models and services, and choose a stack that will scale." },
  { step: "Build", text: "Reusable frontend components and Go / Python / .NET services, with AI-assisted development." },
  { step: "Test", text: "Automated tests, API validation and code reviews before anything ships." },
  { step: "Ship", text: "Docker images, CI/CD pipelines and Terraform-managed cloud environments." },
  { step: "Operate", text: "Monitor, debug production issues and keep improving performance." },
];

/** 08 · How I solve problems */
export const PROBLEMS = [
  { problem: "Mobile data drifting out of sync", solution: "Built Go REST APIs for the mobile apps with stricter validation and synchronization handling.", stack: ["Go", "REST APIs", "Authentication"] },
  { problem: "Slow backend processing", solution: "Profiled Golang microservices and tuned PostgreSQL queries on the hot paths.", stack: ["Go", "PostgreSQL", "Microservices"] },
  { problem: "Repetitive manual operations", solution: "Moved recurring work into asynchronous jobs and automated data workflows.", stack: ["Python", "Celery", "Redis"] },
  { problem: "Slow, risky releases", solution: "Containerized services and automated build-test-deploy pipelines.", stack: ["Docker", "Kubernetes", "CI/CD"] },
];

/** 09 · Engineering impact: places the shipped projects serve (for the globe) */
export const REACH = [
  { name: "Winter Park, FL", lat: 28.6, lon: -81.34, home: true },
  { name: "Australia · Angel Extensions", lat: -33.87, lon: 151.21 },
  { name: "Nashua · ZCO Corporation", lat: 42.77, lon: -71.47 },
  { name: "Plano · Arbisoft", lat: 33.02, lon: -96.7 },
  { name: "Greenville · Designli", lat: 34.85, lon: -82.39 },
];

/** 10 · Currently exploring */
export const EXPLORING = [
  { title: "AI agents & orchestration", text: "Multi-step agents that plan, call tools and hand work to each other." },
  { title: "Model Context Protocol", text: "Connecting models to real systems and data through MCP servers." },
  { title: "RAG & context engineering", text: "Retrieval pipelines and context design that keep answers grounded." },
  { title: "Azure serverless", text: "Azure Functions, App Service and Azure DevOps pipelines." },
];
