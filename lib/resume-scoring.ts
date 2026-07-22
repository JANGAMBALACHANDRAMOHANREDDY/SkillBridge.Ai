'use client';

export interface ResumeSection {
  summary?: string;
  experience: { role: string; company: string; duration: string; bullets: string[] }[];
  education: { degree: string; institution: string; year: string }[];
  skills: string[];
  projects: { name: string; description: string; tech: string }[];
  certifications: string[];
}

export interface ResumeScore {
  ats: number;
  grammar: number;
  keyword: number;
  suggestions: string[];
}

const ACTION_VERBS = [
  'led', 'built', 'designed', 'developed', 'implemented', 'launched', 'optimized',
  'created', 'engineered', 'architected', 'drove', 'improved', 'reduced', 'increased',
  'automated', 'shipped', 'scaled', 'delivered', 'managed', 'owned', 'established',
];

const COMMON_TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'react', 'node', 'next.js', 'nextjs',
  'sql', 'postgresql', 'mongodb', 'docker', 'kubernetes', 'aws', 'gcp', 'azure',
  'machine learning', 'ml', 'ai', 'tensorflow', 'pytorch', 'git', 'ci/cd',
  'rest', 'graphql', 'redis', 'kafka', 'microservices', 'system design',
];

export function scoreResume(content: ResumeSection): ResumeScore {
  const suggestions: string[] = [];

  // ATS: structure completeness
  let ats = 0;
  if (content.summary && content.summary.length > 50) ats += 15;
  else suggestions.push('Add a professional summary of at least 50 words.');
  if (content.experience.length > 0) ats += 25;
  else suggestions.push('Add at least one work experience entry.');
  if (content.experience.some((e) => e.bullets.length >= 3)) ats += 15;
  else suggestions.push('Each experience should have at least 3 bullet points.');
  if (content.education.length > 0) ats += 15;
  else suggestions.push('Add your education details.');
  if (content.skills.length >= 5) ats += 15;
  else suggestions.push('List at least 5 skills.');
  if (content.projects.length > 0) ats += 15;
  else suggestions.push('Add at least one project to showcase your work.');

  // Keyword score
  const allText = [
    content.summary ?? '',
    ...content.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...content.skills,
    ...content.projects.flatMap((p) => [p.name, p.description, p.tech]),
  ].join(' ').toLowerCase();

  const matched = COMMON_TECH_KEYWORDS.filter((k) => allText.includes(k));
  const keyword = Math.min(100, Math.round((matched.length / 10) * 100));
  if (matched.length < 5) suggestions.push('Include more relevant technical keywords (e.g., specific languages, frameworks, tools).');

  // Grammar / quality score (heuristic: action verbs, quantification)
  const bullets = content.experience.flatMap((e) => e.bullets);
  const actionVerbCount = bullets.filter((b) => {
    const first = b.trim().split(/\s+/)[0]?.toLowerCase();
    return first && ACTION_VERBS.includes(first);
  }).length;
  const quantifiedCount = bullets.filter((b) => /\d+%|\d+x|\$\d|\b\d+\b/.test(b)).length;
  const grammar = bullets.length > 0
    ? Math.min(100, Math.round(((actionVerbCount + quantifiedCount) / bullets.length) * 100))
    : 50;
  if (actionVerbCount < bullets.length) suggestions.push('Start bullet points with strong action verbs (Led, Built, Designed, Optimized).');
  if (quantifiedCount < Math.ceil(bullets.length / 2)) suggestions.push('Quantify your impact with numbers (%, x, $, time saved).');

  return { ats, grammar, keyword, suggestions: suggestions.slice(0, 6) };
}

export function generateAISuggestion(field: string, context: string): string {
  const suggestions: Record<string, string[]> = {
    summary: [
      'Final-year CS student with 3+ years building full-stack apps. Shipped 12+ projects with React, Node, and PostgreSQL. Seeking SDE internships to scale production systems.',
      'Results-driven engineer passionate about distributed systems. Reduced API latency by 40% through caching and query optimization. Open to backend roles.',
    ],
    bullet: [
      'Engineered a REST API serving 50K requests/day with 99.9% uptime using Node.js and Redis caching',
      'Reduced page load time by 35% by implementing code splitting and lazy loading in a React app',
      'Automated CI/CD pipeline with GitHub Actions, cutting deployment time from 30 min to 5 min',
    ],
  };
  const list = suggestions[field] ?? suggestions.bullet;
  return list[Math.floor(Math.random() * list.length)];
}
