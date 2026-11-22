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
    "Senior Full Stack Engineer with 7+ years of experience building enterprise web applications, scalable backend systems, and cloud-based business solutions.",
    "Skilled in React, Angular, JavaScript/TypeScript, Java, Python, Node.js, C#, Spring Boot, MongoDB, REST APIs, and SQL, with expertise in responsive frontend development, backend architecture, API integration, and database management.",
    "Experienced in enterprise SaaS platforms, mobile-connected applications, and cloud infrastructure using Docker, AWS, Kubernetes, and CI/CD pipelines.",
    "Strong background in software optimization, Agile development, and delivering reliable applications that improve business efficiency and user experience.",
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
    start: "11/2024", end: "10/2026", title: "Full Stack Engineer", company: "ZCO Corporation", type: "Contract · Nashua",
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
    start: "10/2021", end: "10/2024", title: "Backend Developer", company: "Arbisoft", type: "Contract · Plano",
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
    start: "07/2019", end: "09/2021", title: "Software Engineer", company: "Designli", type: "Greenville",
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
  { title: "Sped Up Development by 50%", text: "Built reusable components and automated tests at ZCO Corporation, speeding up development by 50%." },
  { title: "Cut Manual Research by 70%", text: "Integrated LLM APIs and OCR at Arbisoft to automate data extraction and reduce manual research tasks by 70%." },
  { title: "Reduced Coding Time by 30%", text: "Used Claude Code, Codex, and context engineering to speed up development and reduce coding time by 30%." },
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
    items: ["React.js", "Angular", "Vue.js", "Next.js", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "Responsive Design", "Reactive Forms", "Component Architecture", "State Management"],
  },
  {
    name: "Backend Development", short: "Backend", color: "#8b5cf6",
    items: ["Python", "Django", "Django REST Framework", "FastAPI", "Flask", "Java", "Spring Boot", "Spring Framework", "C#", "ASP.NET Core", ".NET", "Go (Golang)", "Node.js", "Express.js", "PHP", "Laravel", "REST APIs", "Microservices", "Authentication", "Asynchronous Processing", "Concurrent Processing"],
  },
  {
    name: "Databases", short: "Databases", color: "#3b82f6",
    items: ["PostgreSQL", "MySQL", "SQL Server", "MongoDB", "Redis", "SQL", "Database Design", "Query Optimization"],
  },
  {
    name: "AI & LLM Engineering", short: "AI & LLM", color: "#e879f9",
    items: ["Generative AI", "LLM APIs", "AI Agents", "Agent Orchestration", "MCP", "LangChain", "RAG", "Prompt Engineering", "Context Engineering", "OCR", "Document Processing", "Machine Learning", "Claude Code", "OpenAI Codex", "Cursor", "Microsoft Copilot Studio"],
  },
  {
    name: "Cloud & DevOps", short: "Cloud", color: "#38bdf8",
    items: ["AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CI/CD", "Azure App Service", "Azure Functions", "Azure DevOps"],
  },
  {
    name: "Mobile Development", short: "Mobile", color: "#a78bfa",
    items: ["React Native", ".NET MAUI", "Kotlin", "iOS", "Android", "Mobile Backend Services", "API Integration", "Data Synchronization"],
  },
  {
    name: "Engineering Practices & Tools", short: "Practices", color: "#f472b6",
    items: ["Git", "GitHub", "Agile", "Scrum", "Automated Testing", "Debugging", "Code Reviews", "Software Architecture", "Performance Optimization", "Third-Party Integrations", "Workflow Automation", "Enterprise Applications", "SaaS Development", "API Design", "Technical Troubleshooting"],
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

// Order follows the project list (Colby Lee Bean-project.docx).
export const PROJECTS: Project[] = [
  {
    slug: "weather-routing", name: "Weather-Aware Truck Routing", sub: "Logistics Planning Platform", cat: "platform",
    summary: "A logistics planning application that helps truck drivers compare routes based on forecast weather and vehicle load. It combines interactive maps, routing services, and weather data to highlight wind, rain, and snow risks along a journey.",
    role: "Architected an end-to-end logistics platform that pairs truck route planning with weather-based risk assessment. Built Django REST Framework APIs for routing, vehicle load, and weather conditions, and responsive React, TypeScript, and Leaflet dashboards with OpenStreetMap and Open-Meteo. Owned architecture, implementation, Docker, and Railway deployment.",
    tags: ["React", "TypeScript", "Vite", "Python", "Django REST Framework", "Leaflet", "OpenStreetMap", "Open-Meteo", "Docker", "Railway"],
    url: "https://weather-aware-truck-routing.up.railway.app/", linkLabel: "Visit website",
  },
  {
    slug: "angel-extensions", name: "Angel Extensions", sub: "Hair Extensions E-commerce · Australia", cat: "shopify",
    summary: "A Shopify storefront for professional hair extensions and styling products. Product collections, educational content, and showroom information are organized into a responsive shopping experience.",
    role: "Developed and maintained a customized Shopify storefront for hair extension collections, styling products, educational content, and showroom information. Built responsive product and collection layouts with Liquid, HTML, CSS, and JavaScript, and supported performance, SEO, and brand-aligned storefront maintenance.",
    tags: ["Shopify", "Liquid", "HTML5", "CSS3", "JavaScript", "Cloudflare", "SEO", "Responsive Web Design"],
    url: "https://angelextensions.com.au/", linkLabel: "Visit store",
  },
  {
    slug: "blade", name: "Blade", sub: "AI-Assisted Contact Discovery & Email Outreach", cat: "platform", featured: true,
    summary: "A contact discovery and email outreach platform that finds relevant people in a user's Gmail history, ranks them by interaction frequency, and sends personalized campaigns through a connected Gmail account.",
    role: "Built full-stack features in React, TypeScript, and Java for contact discovery, audience management, and email outreach. Developed REST APIs and MySQL records for contacts and campaigns, integrated the Gmail API and Google OAuth 2.0, and added ranking, filtering, and message previews.",
    tags: ["React", "TypeScript", "Java", "MySQL", "REST APIs", "Gmail API", "Google OAuth 2.0", "SQL"],
    url: "https://blade.net/", linkLabel: "Visit website",
  },
  {
    slug: "simi-haze", name: "Simi Haze Beauty", sub: "Beauty E-commerce Platform", cat: "shopify", featured: true,
    summary: "A Shopify beauty storefront where customers browse products, read reviews, and check out through several payment methods, with marketing and analytics integrations alongside the shopping experience.",
    role: "Developed and maintained a responsive Shopify beauty storefront with interactive product layouts and customer reviews. Customized the frontend with JavaScript, Vue.js, Alpine.js, and Tailwind CSS, and integrated Klaviyo, Attentive, review platforms, Microsoft Clarity, and multiple payment options.",
    tags: ["Shopify", "JavaScript", "Vue.js", "Alpine.js", "Tailwind CSS", "Klaviyo", "Attentive", "Microsoft Clarity"],
    url: "https://simihazebeauty.com/", linkLabel: "Visit store",
  },
  {
    slug: "mockit", name: "Mockit", sub: "Online Apparel Mockup Generator", cat: "wordpress",
    summary: "An apparel mockup platform for designers, clothing brands, and e-commerce sellers. The site supports artwork uploads, garment customization, and mockup presentation, with payment and marketing tools built into the customer workflow.",
    role: "Developed and maintained a WordPress apparel mockup platform for artwork uploads, garment customization, and product image workflows. Built responsive layouts with PHP, JavaScript, Bootstrap, and jQuery, customized Elementor and Blocksy, and integrated PayPal, Mailchimp, analytics, WP Rocket, and Cloudflare.",
    tags: ["WordPress", "PHP", "MySQL", "JavaScript", "Elementor", "Blocksy", "PayPal", "Mailchimp", "Cloudflare"],
    url: "https://mock-it.co/", linkLabel: "Visit website",
  },
  {
    slug: "workstream", name: "Workstream", sub: "HR Management Platform", cat: "platform",
    summary: "An HR management platform for employee administration, including expenses, leave requests, performance reviews, and related business processes connected to frontend interfaces and enterprise systems.",
    role: "Developed Python and Django backend functionality for expenses, leave, performance reviews, and HR workflows. Maintained PostgreSQL-backed employee records, connected REST services to React interfaces, and supported Odoo integration, Single Sign-On, and GitLab-based development.",
    tags: ["Python", "Django", "PostgreSQL", "React", "REST APIs", "Odoo Integration", "Single Sign-On", "GitLab"],
    url: "https://www.workstream.us/", linkLabel: "Visit website",
  },
  {
    slug: "joinedbio", name: "JoinedBio", sub: "AI-Powered Health Research Marketplace", cat: "platform", featured: true,
    summary: "A digital health research marketplace that connects prospective participants with organizations running studies. The platform supports participant information, study coordination, and AI-assisted research workflows.",
    role: "Developed full-stack features for a healthcare research marketplace. Engineered Django REST Framework APIs, built React, Next.js, and TypeScript interfaces, implemented PostgreSQL with Redis and Celery background processing, and contributed to AI-assisted features on Google Cloud and Kubernetes.",
    tags: ["React", "Next.js", "TypeScript", "Python", "Django", "Django REST Framework", "PostgreSQL", "Redis", "Celery", "Google Cloud", "Kubernetes"],
    url: "https://joined.bio/", linkLabel: "Visit website",
  },
  {
    slug: "freightmate", name: "Freightmate", sub: "Fleet Management & Logistics SaaS", cat: "platform",
    summary: "A fleet management and logistics SaaS platform for dispatch, trip coordination, fleet visibility, invoicing, and reporting, with operational interfaces connected to backend services.",
    role: "Developed features covering dispatch, trip coordination, fleet visibility, invoicing, and reporting. Built operational dashboards, integrated them with REST services, supported SQL Server data handling, and worked with AWS, Terraform, and GitHub Actions.",
    tags: ["TypeScript", "Java", "SQL Server", "REST APIs", "AWS", "Terraform", "GitHub Actions"],
    url: "https://www.freightmateapp.com/", linkLabel: "Visit website",
  },
  {
    slug: "princess-dental", name: "Princess Dental Staffing", sub: "Mobile Recruitment Application", cat: "mobile",
    summary: "A mobile recruitment application that connects dental professionals with temporary and permanent jobs. It supports profiles, job discovery, applications, availability, scheduling, and notifications.",
    role: "Developed React Native features for iOS and Android, including reusable components, navigation, candidate profiles, and job discovery. Built application and availability workflows, integrated REST APIs, and added push notifications.",
    tags: ["React Native", "JavaScript", "REST APIs", "iOS", "Android", "Push Notifications", "Scheduling"],
    url: "https://www.princessdentalstaffing.com/", linkLabel: "Visit website",
  },
  {
    slug: "angus-mobile", name: "Angus Mobile", sub: "Cattle Management App · American Angus Association", cat: "mobile",
    summary: "A cross-platform app for the American Angus Association that gives cattle breeders and members access to herd records, association resources, and relevant updates, with notifications and usage analytics.",
    role: "Developed cross-platform features with C#, .NET MAUI, and Blazor Hybrid. Built interfaces for herd records and member resources, integrated REST APIs and authentication, and added OneSignal notifications and Firebase Analytics for iOS and Android.",
    tags: ["C#", ".NET", ".NET MAUI", "Blazor Hybrid", "REST APIs", "Firebase Analytics", "OneSignal", "iOS", "Android"],
    url: "https://apps.apple.com/us/app/angus-mobile/id491758227", linkLabel: "View on App Store",
  },
  {
    slug: "burndy", name: "Burndy Intelli Tools", sub: "Mobile Product Information App", cat: "mobile",
    summary: "A mobile product-reference app for electrical professionals who need product details in the field, including lookup, technical specifications, and documentation on iOS and Android.",
    role: "Developed mobile features for product details, specifications, and documentation. Built search and lookup screens, integrated REST APIs for catalog data, and kept navigation consistent across iOS and Android with C# and .NET.",
    tags: ["C#", ".NET", "SQL", "REST APIs", "iOS", "Android"],
    url: "https://apps.apple.com/us/app/burndy-connect/id1294811019", linkLabel: "View on App Store",
  },
  {
    slug: "abc-storage", name: "ABC Storage Kingston", sub: "Self-Storage Management & Booking", cat: "platform", featured: true,
    summary: "A self-storage website that helps prospective customers review storage information and submit inquiries. The application pairs an Angular interface with Go backend services, caching, and automated deployment.",
    role: "Developed and maintained Go backend services for storage information and customer inquiries. Connected REST APIs to Angular and TypeScript interfaces, used Redis for caching, and supported Docker environments and CI/CD releases.",
    tags: ["Angular", "TypeScript", "Go", "Redis", "Docker", "CI/CD", "REST APIs"],
    url: "https://abcstoragekingston.com/", linkLabel: "Visit website",
  },
];

export const METRICS = [
  { value: 7, suffix: "+", label: "Years of experience" },
  { value: EXPERIENCE.length, suffix: "", label: "Companies" },
  { value: PROJECTS.length, suffix: "", label: "Shipped projects" },
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
  { name: "Missouri · Angus Mobile", lat: 39.77, lon: -94.85 },
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
