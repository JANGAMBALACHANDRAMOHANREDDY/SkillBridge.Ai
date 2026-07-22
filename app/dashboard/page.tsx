'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Code2,
  FileText,
  Flame,
  MessageSquare,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface ResumeRow { id: string; title: string; ats_score: number | null; updated_at: string; }
interface InterviewRow { id: string; type: string; overall_score: number | null; started_at: string; }
interface ApplicationRow { id: string; status: string; internship_id: string; internships: { company: string; title: string }[] | null; }
interface CodingRow { date: string; easy_solved: number; medium_solved: number; hard_solved: number; }
interface GoalRow { id: string; title: string; progress: number; target: number; type: string; }
interface ActivityRow { date: string; study_hours: number; coding_hours: number; }

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [resume, setResume] = React.useState<ResumeRow | null>(null);
  const [interviews, setInterviews] = React.useState<InterviewRow[]>([]);
  const [applications, setApplications] = React.useState<ApplicationRow[]>([]);
  const [coding, setCoding] = React.useState<CodingRow[]>([]);
  const [goals, setGoals] = React.useState<GoalRow[]>([]);
  const [activity, setActivity] = React.useState<ActivityRow[]>([]);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [resumesRes, interviewsRes, appsRes, codingRes, goalsRes, activityRes] = await Promise.all([
        supabase.from('resumes').select('id, title, ats_score, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('mock_interviews').select('id, type, overall_score, started_at').eq('user_id', user.id).order('started_at', { ascending: false }).limit(5),
        supabase.from('applications').select('id, status, internship_id, internships:internship_id(company, title)').eq('user_id', user.id).order('applied_at', { ascending: false }).limit(5),
        supabase.from('coding_logs').select('date, easy_solved, medium_solved, hard_solved').eq('user_id', user.id).order('date', { ascending: true }).limit(30),
        supabase.from('goals').select('id, title, progress, target, type').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
        supabase.from('daily_activities').select('date, study_hours, coding_hours').eq('user_id', user.id).order('date', { ascending: true }).limit(30),
      ]);
      if (cancelled) return;
      setResume(resumesRes.data as ResumeRow | null);
      setInterviews((interviewsRes.data ?? []) as InterviewRow[]);
      setApplications((appsRes.data ?? []) as unknown as ApplicationRow[]);
      setCoding((codingRes.data ?? []) as CodingRow[]);
      setGoals((goalsRes.data ?? []) as GoalRow[]);
      setActivity((activityRes.data ?? []) as ActivityRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const totalProblems = coding.reduce((acc, c) => acc + c.easy_solved + c.medium_solved + c.hard_solved, 0);
  const avgInterviewScore = interviews.length
    ? Math.round(interviews.reduce((a, i) => a + (i.overall_score ?? 0), 0) / interviews.length)
    : 0;
  const activeApps = applications.length;
  const offers = applications.filter((a) => a.status === 'offer').length;

  const activityData = activity.map((a) => ({
    date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    study: Number(a.study_hours),
    coding: Number(a.coding_hours),
  }));

  const codingDistribution = [
    { name: 'Easy', value: coding.reduce((a, c) => a + c.easy_solved, 0), color: 'hsl(var(--success))' },
    { name: 'Medium', value: coding.reduce((a, c) => a + c.medium_solved, 0), color: 'hsl(var(--warning))' },
    { name: 'Hard', value: coding.reduce((a, c) => a + c.hard_solved, 0), color: 'hsl(var(--destructive))' },
  ].filter((d) => d.value > 0);

  const firstName = (profile?.full_name ?? 'there').split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}!`}
        description="Here's your career progress at a glance."
        actions={
          <Button asChild>
            <Link href="/dashboard/resume">Build resume <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)
        ) : (
          <>
            <StatCard icon={FileText} label="ATS score" value={resume?.ats_score ? `${resume.ats_score}/100` : '—'} change={12} accent="success" delay={0} changeLabel="vs last resume" />
            <StatCard icon={Code2} label="Problems solved" value={totalProblems} change={8} accent="primary" delay={0.05} changeLabel="last 30 days" />
            <StatCard icon={MessageSquare} label="Avg interview score" value={avgInterviewScore ? `${avgInterviewScore}/100` : '—'} accent="chart" delay={0.1} changeLabel={`${interviews.length} sessions`} />
            <StatCard icon={Trophy} label="Study streak" value={`${profile?.study_streak ?? 0} days`} accent="warning" delay={0.15} changeLabel="Keep it up!" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity chart */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Activity overview</CardTitle>
            <CardDescription>Study and coding hours over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] rounded-xl" />
            ) : activityData.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No activity logged yet"
                description="Log your daily study and coding hours to see your progress here."
                action={<Button asChild variant="outline"><Link href="/dashboard/analytics">Log activity</Link></Button>}
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={activityData} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="codingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="study" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#studyGrad)" name="Study hrs" />
                  <Area type="monotone" dataKey="coding" stroke="hsl(var(--chart-4))" strokeWidth={2} fill="url(#codingGrad)" name="Coding hrs" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Coding distribution */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Problem distribution</CardTitle>
            <CardDescription>By difficulty</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] rounded-xl" />
            ) : codingDistribution.length === 0 ? (
              <EmptyState icon={Code2} title="No coding logs" description="Log your daily coding activity to see the breakdown." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={codingDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {codingDistribution.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Goals */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Daily goals</CardTitle>
              <CardDescription>Your active goals</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/analytics">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
            ) : goals.length === 0 ? (
              <EmptyState icon={Target} title="No active goals" description="Set daily, weekly, or monthly goals to stay on track." action={<Button asChild variant="outline" size="sm"><Link href="/dashboard/analytics">Set a goal</Link></Button>} />
            ) : (
              goals.map((g) => {
                const pct = g.target > 0 ? Math.min(100, Math.round((g.progress / g.target) * 100)) : 0;
                return (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.title}</span>
                      <span className="text-muted-foreground">{g.progress}/{g.target} · {pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Profile completion */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Profile completion</CardTitle>
            <CardDescription>{profile?.profile_completion ?? 25}% complete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={profile?.profile_completion ?? 25} className="h-3" />
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Basic info', done: !!profile?.full_name },
                { label: 'College & major', done: !!profile?.college },
                { label: 'Skills', done: (profile?.skills?.length ?? 0) > 0 },
                { label: 'Target role', done: !!profile?.target_role },
              ].map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  {s.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />}
                  <span className={s.done ? '' : 'text-muted-foreground'}>{s.label}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/profile">Complete profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent applications */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Recent applications</CardTitle>
              <CardDescription>{activeApps} active · {offers} offers</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/internships">Browse</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
            ) : applications.length === 0 ? (
              <EmptyState icon={BookOpen} title="No applications yet" description="Browse internships and apply to start your journey." action={<Button asChild size="sm"><Link href="/dashboard/internships">Find internships</Link></Button>} />
            ) : (
              applications.map((a) => {
                const iv = a.internships?.[0];
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div>
                      <div className="text-sm font-medium">{iv?.title ?? 'Untitled'}</div>
                      <div className="text-xs text-muted-foreground">{iv?.company ?? '—'}</div>
                    </div>
                    <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent interviews */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Recent interviews</CardTitle>
              <CardDescription>Practice makes perfect</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/interviews">Practice</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
            ) : interviews.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No interviews yet" description="Take a mock interview to build confidence." action={<Button asChild size="sm"><Link href="/dashboard/interviews">Start mock interview</Link></Button>} />
            ) : (
              interviews.map((iv) => (
                <div key={iv.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <div className="text-sm font-medium capitalize">{iv.type} round</div>
                    <div className="text-xs text-muted-foreground">{new Date(iv.started_at).toLocaleDateString()}</div>
                  </div>
                  {iv.overall_score != null ? (
                    <Badge variant="secondary">{iv.overall_score}/100</Badge>
                  ) : (
                    <Badge variant="outline">In progress</Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-chart-4/5">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Flame className="h-5 w-5 text-warning" /> Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileText, label: 'New resume', href: '/dashboard/resume' },
            { icon: MessageSquare, label: 'Mock interview', href: '/dashboard/interviews' },
            { icon: Code2, label: 'Log coding', href: '/dashboard/coding' },
            { icon: Calendar, label: 'Set goals', href: '/dashboard/analytics' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{a.label}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
