'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Code2,
  FileText,
  GraduationCap,
  LineChart,
  MessageSquare,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ThemeToggle } from '@/components/theme-toggle';
import { SectionHeading } from '@/components/section-heading';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#companies', label: 'Companies' },
  { href: '#stories', label: 'Success Stories' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQs' },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'AI Resume Builder',
    description: 'Build ATS-optimized resumes with live scoring, AI keyword suggestions, and one-click PDF export.',
  },
  {
    icon: MessageSquare,
    title: 'Mock Interviews',
    description: 'Behavioral, technical, HR, and company-specific rounds with AI evaluation and instant feedback.',
  },
  {
    icon: Code2,
    title: 'Coding Tracker',
    description: 'Sync LeetCode, CodeChef, Codeforces, and GitHub. Visualize streaks and problem distribution.',
  },
  {
    icon: Briefcase,
    title: 'Internship Portal',
    description: 'Browse, apply, and track applications with status timelines and AI-matched recommendations.',
  },
  {
    icon: GraduationCap,
    title: 'Learning Hub',
    description: 'Curated courses, AI summaries, notes, roadmaps, and flashcards in one place.',
  },
  {
    icon: LineChart,
    title: 'Analytics & Insights',
    description: 'Study hours, coding hours, application funnel, interview performance — with heatmaps.',
  },
  {
    icon: Brain,
    title: 'AI Career Coach',
    description: 'Skill-gap analysis, personalized roadmaps, salary insights, and weekly goals.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Ask questions, share projects, find mentors, and join study groups and events.',
  },
];

const COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix',
  'Adobe', 'Uber', 'Atlassian', 'Stripe', 'Shopify', 'Salesforce',
];

const STATS = [
  { value: '120K+', label: 'Active students' },
  { value: '4.8M+', label: 'Problems solved' },
  { value: '18K+', label: 'Internships posted' },
  { value: '92%', label: 'Placement rate' },
];

const STORIES = [
  {
    name: 'Ananya Sharma',
    role: 'SDE Intern @ Google',
    image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
    quote: 'The mock interviews felt exactly like the real Google loop. The AI feedback on my behavioral answers was scarily accurate.',
    metric: 'ATS score 92 → 98',
  },
  {
    name: 'Rahul Verma',
    role: 'Data Engineer @ Amazon',
    image: 'https://images.pexels.com/photos/220457/pexels-photo-220457.jpeg?auto=compress&cs=tinysrgb&w=200',
    quote: 'SkillBridge showed me exactly which skills I was missing for Amazon. Three months later, I had the offer.',
    metric: '6-month journey',
  },
  {
    name: 'Sneha Iyer',
    role: 'Frontend Engineer @ Stripe',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
    quote: 'The portfolio builder got me noticed. A recruiter found my public portfolio and reached out within a week.',
    metric: 'Recruiter inbound',
  },
];

const TESTIMONIALS = [
  { name: 'Karthik R.', role: 'Final year, IIT Madras', rating: 5, text: 'Best career platform I have used. The analytics alone are worth it.' },
  { name: 'Priya M.', role: 'CS Student, BITS Pilani', rating: 5, text: 'The AI resume suggestions landed me 3 more interview calls.' },
  { name: 'Dev P.', role: 'Recruiter, Zomato', rating: 5, text: 'Candidate ranking saves us hours every week. Quality of hires went up.' },
  { name: 'Aisha K.', role: 'Placement Officer, VIT', rating: 5, text: 'I can track 400+ students placements from one dashboard. Game changer.' },
];

const PRICING = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Everything you need to get started.',
    features: ['1 resume', '3 mock interviews / month', 'Coding tracker', 'Community access', 'Basic analytics'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/ month',
    description: 'For serious job-seekers.',
    features: ['Unlimited resumes', 'Unlimited mock interviews', 'AI Career Coach', 'All assessments', 'Advanced analytics + heatmaps', 'Priority support'],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Campus',
    price: 'Custom',
    period: '',
    description: 'For colleges and placement cells.',
    features: ['Everything in Pro', 'Placement officer dashboard', 'Bulk student management', 'Drive management', 'Branded portal', 'Dedicated success manager'],
    cta: 'Talk to sales',
    highlight: false,
  },
];

const FAQS = [
  { q: 'Is SkillBridge AI free to use?', a: 'Yes. The Free plan includes 1 resume, 3 mock interviews per month, the coding tracker, community access, and basic analytics. Upgrade to Pro for unlimited everything.' },
  { q: 'How does the AI mock interview work?', a: 'You pick a round type (behavioral, technical, HR, or company-specific). The AI asks realistic questions, evaluates your answers in real time, and gives you a score with concrete suggestions after each session.' },
  { q: 'Can recruiters really find me here?', a: 'Yes. Recruiters search candidates by skills, target role, college, and resume keywords. Pro users with a public portfolio get listed higher in AI candidate ranking.' },
  { q: 'Do you support my coding platform?', a: 'We currently support LeetCode, CodeChef, Codeforces, and GitHub contribution graphs. Log your daily activity manually or sync via your public profile URL.' },
  { q: 'Is my data private?', a: 'Your data is yours. Resumes, applications, and analytics are private to your account. You control whether your portfolio is public. We never sell your data.' },
  { q: 'Can my college use SkillBridge for placements?', a: 'Yes. Our Campus plan gives placement officers a dashboard to track every student, manage drives, and export reports. Contact sales for onboarding.' },
];

const BLOG_POSTS = [
  {
    title: 'How I scored 98 on the ATS resume check',
    excerpt: 'A step-by-step breakdown of the exact changes that took my resume from rejected to interview-ready.',
    category: 'Resume',
    readTime: '6 min',
    image: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'The 30-day system design interview plan',
    excerpt: 'Everything you need to go from zero to confident in distributed systems interviews.',
    category: 'Interviews',
    readTime: '12 min',
    image: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'Why your GitHub profile matters more than your GPA',
    excerpt: 'How recruiters actually evaluate open-source contributions, and what to optimize for.',
    category: 'Career',
    readTime: '8 min',
    image: 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export default function Home() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-clip">
      {/* Background grid + glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-40" />
      <div className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 -z-10 h-[400px] w-[400px] rounded-full bg-chart-4/20 blur-[120px]" />

      {/* Nav */}
      <header className="sticky top-0 z-50 w-full">
        <div className="mx-auto mt-3 max-w-7xl px-4">
          <nav className="glass flex h-16 items-center justify-between rounded-2xl px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-4 text-primary-foreground shadow-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">
                SkillBridge <span className="text-primary">AI</span>
              </span>
            </Link>
            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild className="rounded-xl">
                <Link href="/auth/signup">
                  Get started
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
          >
            <Zap className="h-4 w-4" />
            AI-powered career acceleration
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            Become <span className="gradient-text">job-ready</span>.
            <br />
            Get <span className="gradient-text">discovered</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            The complete AI career platform for students and recruiters. Resume building, mock
            interviews, coding tracking, internships, learning, and analytics — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base shadow-glow">
              <Link href="/auth/signup">
                Start for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-8 text-base">
              <Link href="/auth/signin">Recruiter? Sign in</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <div className="font-display text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="gradient-border overflow-hidden rounded-2xl shadow-card-hover">
            <div className="glass-card rounded-none p-0">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/70" />
                  <div className="h-3 w-3 rounded-full bg-warning/70" />
                  <div className="h-3 w-3 rounded-full bg-success/70" />
                </div>
                <div className="mx-auto flex items-center gap-2 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> app.skillbridge.ai/dashboard
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                {[
                  { icon: FileText, label: 'Resume ATS score', value: 98, color: 'text-success' },
                  { icon: Code2, label: 'Problems solved', value: 412, color: 'text-primary' },
                  { icon: Trophy, label: 'Study streak', value: '47 days', color: 'text-warning' },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-border/60 bg-background/40 p-4 text-left">
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                    <div className="mt-3 font-display text-2xl font-bold">{card.value}</div>
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="flex items-end gap-2 h-32">
                  {[40, 65, 50, 80, 70, 95, 60, 85, 75, 90, 100, 70].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.6, delay: 0.8 + i * 0.05 }}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-primary/20 via-chart-4/20 to-chart-5/20 blur-2xl" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <SectionHeading
          eyebrow="Everything in one platform"
          title={<>Twelve modules. <span className="gradient-text">One career OS.</span></>}
          description="Stop juggling 10 tabs. SkillBridge brings every step of your job search into a single, intelligent workspace."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="group h-full overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-card-hover">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Companies */}
      <section id="companies" className="mx-auto max-w-7xl px-4 py-20">
        <SectionHeading
          eyebrow="Where alumni land"
          title={<>Our students work at the <span className="gradient-text">best companies</span></>}
          description="From FAANG to high-growth startups, SkillBridge alumni are everywhere."
        />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {COMPANIES.map((company, i) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <Card className="flex h-20 items-center justify-center border-border/60 bg-background/40 transition-colors hover:bg-accent">
                <span className="font-display text-lg font-semibold text-muted-foreground">{company}</span>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Success Stories */}
      <section id="stories" className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <SectionHeading
          eyebrow="Real outcomes"
          title={<>Stories that <span className="gradient-text">prove it works</span></>}
          description="Real students. Real offers. Real journeys powered by SkillBridge AI."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STORIES.map((story, i) => (
            <motion.div
              key={story.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="h-full overflow-hidden border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src={story.image}
                      alt={story.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{story.name}</div>
                      <div className="text-sm text-primary">{story.role}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">&ldquo;{story.quote}&rdquo;</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    <Trophy className="h-3.5 w-3.5" /> {story.metric}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full border-border/60">
                <CardContent className="p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{t.text}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <SectionHeading
          eyebrow="Simple, transparent pricing"
          title={<>Plans that <span className="gradient-text">scale with you</span></>}
          description="Start free. Upgrade when you are ready to go all-in."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PRICING.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card
                className={
                  plan.highlight
                    ? 'relative h-full overflow-hidden border-primary/40 shadow-glow'
                    : 'h-full overflow-hidden border-border/60'
                }
              >
                {plan.highlight ? (
                  <div className="absolute right-0 top-0 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </div>
                ) : null}
                <CardContent className="p-6">
                  <div className="font-display text-xl font-semibold">{plan.name}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-8 w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    <Link href="/auth/signup">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Blog Preview */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionHeading
          eyebrow="From the blog"
          title={<>Learn from people who <span className="gradient-text">cracked it</span></>}
          description="Tactics, frameworks, and stories from the SkillBridge community."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {BLOG_POSTS.map((post, i) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="group h-full overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-card-hover">
                <div className="aspect-video overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={600}
                    height={338}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground">{post.readTime} read</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
        <SectionHeading
          eyebrow="Questions, answered"
          title={<>Frequently asked <span className="gradient-text">questions</span></>}
        />
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q} className="border-border/60">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-4/10 to-chart-5/15 p-10 text-center sm:p-16"
        >
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <Target className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Your dream job is <span className="gradient-text">closer than you think</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join 120,000+ students using SkillBridge AI to land roles at the world&rsquo;s best companies.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base shadow-glow">
                <Link href="/auth/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-8 text-base">
                <Link href="/auth/signin">I already have an account</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="font-display text-lg font-bold">SkillBridge <span className="text-primary">AI</span></span>
              </Link>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                The complete AI career platform for students and recruiters. Built for the next generation of talent.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Mock Interviews', 'Resume Builder', 'Coding Tracker'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
              { title: 'Resources', links: ['Documentation', 'Community', 'Help Center', 'Privacy', 'Terms'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-display text-sm font-semibold">{col.title}</h4>
                <ul className="mt-4 space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">© 2026 SkillBridge AI. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" /> Built with care for ambitious students.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
