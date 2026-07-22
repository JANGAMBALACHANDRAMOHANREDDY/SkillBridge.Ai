'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Loader2, Plus, Target } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Activity { date: string; study_hours: number; coding_hours: number; applications_count: number; interviews_count: number; }
interface Goal { id: string; title: string; target: number; progress: number; type: string; unit: string; status: string; deadline: string | null; }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildHeatmap(activities: Activity[]) {
  const days: { date: Date; value: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  const map = new Map<string, number>();
  activities.forEach((a) => map.set(a.date, Number(a.study_hours) + Number(a.coding_hours)));
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: d, value: map.get(key) ?? 0 });
  }
  return days;
}

function heatColor(value: number): string {
  if (value === 0) return 'hsl(var(--muted))';
  if (value < 1) return 'hsl(var(--primary) / 0.25)';
  if (value < 2) return 'hsl(var(--primary) / 0.45)';
  if (value < 4) return 'hsl(var(--primary) / 0.7)';
  return 'hsl(var(--primary))';
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [logOpen, setLogOpen] = React.useState(false);
  const [goalOpen, setGoalOpen] = React.useState(false);
  const [logForm, setLogForm] = React.useState({ date: new Date().toISOString().slice(0, 10), study: 0, coding: 0, applications: 0, interviews: 0, notes: '' });
  const [goalForm, setGoalForm] = React.useState({ title: '', target: 5, type: 'daily', unit: 'hours', deadline: '' });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [aRes, gRes] = await Promise.all([
      supabase.from('daily_activities').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setActivities((aRes.data ?? []) as Activity[]);
    setGoals((gRes.data ?? []) as Goal[]);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  async function logActivity() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('daily_activities').upsert({
      user_id: user.id,
      date: logForm.date,
      study_hours: Number(logForm.study),
      coding_hours: Number(logForm.coding),
      applications_count: Number(logForm.applications),
      interviews_count: Number(logForm.interviews),
      notes: logForm.notes || null,
    }, { onConflict: 'user_id,date' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Activity logged');
    setLogOpen(false);
    setLogForm({ date: new Date().toISOString().slice(0, 10), study: 0, coding: 0, applications: 0, interviews: 0, notes: '' });
    load();
  }

  async function addGoal() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      title: goalForm.title,
      target: Number(goalForm.target),
      type: goalForm.type,
      unit: goalForm.unit,
      deadline: goalForm.deadline || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Goal added');
    setGoalOpen(false);
    setGoalForm({ title: '', target: 5, type: 'daily', unit: 'hours', deadline: '' });
    load();
  }

  async function bumpGoal(g: Goal) {
    const next = Math.min(g.target, g.progress + 1);
    const status = next >= g.target ? 'completed' : 'active';
    const { error } = await supabase.from('goals').update({ progress: next, status }).eq('id', g.id);
    if (error) { toast.error(error.message); return; }
    setGoals((gs) => gs.map((x) => x.id === g.id ? { ...x, progress: next, status } : x));
  }

  const totalStudy = activities.reduce((a, x) => a + Number(x.study_hours), 0);
  const totalCoding = activities.reduce((a, x) => a + Number(x.coding_hours), 0);
  const totalApps = activities.reduce((a, x) => a + Number(x.applications_count), 0);
  const totalInterviews = activities.reduce((a, x) => a + Number(x.interviews_count), 0);

  const last30 = activities.slice(-30).map((a) => ({
    date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    study: Number(a.study_hours),
    coding: Number(a.coding_hours),
  }));

  const appsTrend = activities.slice(-12).map((a) => ({
    date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    applications: Number(a.applications_count),
    interviews: Number(a.interviews_count),
  }));

  const heatmap = buildHeatmap(activities);
  const weeks: { date: Date; value: number }[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) weeks.push(heatmap.slice(i, i + 7));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your study, coding, and application activity over time."
        actions={
          <div className="flex gap-2">
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Target className="mr-2 h-4 w-4" /> Add goal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set a new goal</DialogTitle>
                  <DialogDescription>Daily, weekly, or monthly targets to keep you on track.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label>Goal title</Label><Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g. Solve 5 problems daily" /></div>
                  <div className="space-y-2"><Label>Target</Label><Input type="number" min={1} value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Unit</Label><Input value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} placeholder="hours / problems / applications" /></div>
                  <div className="space-y-2"><Label>Type</Label><select value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                  <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={addGoal} disabled={saving || !goalForm.title}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add goal</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={logOpen} onOpenChange={setLogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Log activity</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log daily activity</DialogTitle>
                  <DialogDescription>One entry per day. Updates if you already logged this date.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label>Date</Label><Input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Study hours</Label><Input type="number" step="0.5" min={0} value={logForm.study} onChange={(e) => setLogForm({ ...logForm, study: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Coding hours</Label><Input type="number" step="0.5" min={0} value={logForm.coding} onChange={(e) => setLogForm({ ...logForm, coding: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Applications sent</Label><Input type="number" min={0} value={logForm.applications} onChange={(e) => setLogForm({ ...logForm, applications: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Interviews attended</Label><Input type="number" min={0} value={logForm.interviews} onChange={(e) => setLogForm({ ...logForm, interviews: Number(e.target.value) })} /></div>
                </div>
                <DialogFooter><Button onClick={logActivity} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BarChart3} label="Total study hours" value={Math.round(totalStudy)} accent="primary" />
        <StatCard icon={BarChart3} label="Total coding hours" value={Math.round(totalCoding)} accent="chart" />
        <StatCard icon={BarChart3} label="Applications sent" value={totalApps} accent="success" />
        <StatCard icon={BarChart3} label="Interviews attended" value={totalInterviews} accent="warning" />
      </div>

      {/* Heatmap */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-lg">Activity heatmap</CardTitle>
          <CardDescription>Last 365 days · darker = more active</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-1">
                <div className="flex flex-col justify-around pr-2 text-xs text-muted-foreground">
                  {WEEKDAYS.map((d) => <div key={d} className="h-3 leading-3">{d}</div>)}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((day) => (
                      <div
                        key={day.date.toISOString()}
                        title={`${day.date.toDateString()}: ${day.value}h`}
                        className={cn('h-3 w-3 rounded-sm', day.value === 0 && 'bg-muted')}
                        style={day.value > 0 ? { backgroundColor: heatColor(day.value) } : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                Less
                <div className="h-3 w-3 rounded-sm bg-muted" />
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary) / 0.25)' }} />
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary) / 0.45)' }} />
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary) / 0.7)' }} />
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                More
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Study vs coding (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {last30.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data" description="Log activity to see trends." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={last30} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="study" fill="hsl(var(--primary))" name="Study hrs" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="coding" fill="hsl(var(--chart-4))" name="Coding hrs" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Applications & interviews</CardTitle>
          </CardHeader>
          <CardContent>
            {appsTrend.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data" description="Log activity to see trends." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={appsTrend} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="applications" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Applications" />
                  <Line type="monotone" dataKey="interviews" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Interviews" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-lg">Goals</CardTitle>
          <CardDescription>Track and complete your active goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 ? (
            <EmptyState icon={Target} title="No goals yet" description="Set a goal to start tracking progress." action={<Button onClick={() => setGoalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add goal</Button>} />
          ) : (
            goals.map((g) => {
              const pct = g.target > 0 ? Math.min(100, Math.round((g.progress / g.target) * 100)) : 0;
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-muted-foreground">{g.progress}/{g.target} {g.unit} · {g.type}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => bumpGoal(g)} disabled={g.status === 'completed'}>
                      {g.status === 'completed' ? 'Completed' : '+1 progress'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
