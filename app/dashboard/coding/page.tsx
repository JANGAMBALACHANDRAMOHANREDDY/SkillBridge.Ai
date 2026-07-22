'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
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
import { Code2, Flame, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';

interface CodingLog {
  id: string;
  date: string;
  platform: string;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  time_spent_minutes: number;
  notes: string | null;
}

const PLATFORMS = ['leetcode', 'codechef', 'codeforces', 'github', 'other'] as const;

export default function CodingTrackerPage() {
  const { user } = useAuth();
  const [logs, setLogs] = React.useState<CodingLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    platform: 'leetcode' as string,
    easy: 0,
    medium: 0,
    hard: 0,
    time: 30,
    notes: '',
  });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('coding_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (error) toast.error(error.message);
    setLogs((data ?? []) as CodingLog[]);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  async function addLog() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('coding_logs').insert({
      user_id: user.id,
      date: form.date,
      platform: form.platform,
      easy_solved: Number(form.easy),
      medium_solved: Number(form.medium),
      hard_solved: Number(form.hard),
      time_spent_minutes: Number(form.time),
      notes: form.notes || null,
    });
    if (!error) {
      const codingHours = Math.round((Number(form.time) / 60) * 100) / 100;
      await supabase.from('daily_activities').upsert({
        user_id: user.id,
        date: form.date,
        coding_hours: codingHours,
      }, { onConflict: 'user_id,date', ignoreDuplicates: false });
    }
    setSaving(false);
    if (error) {
      if (error.code === '23505') {
        toast.error('You already have a log for this date and platform.');
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success('Coding activity logged');
    setForm({ date: new Date().toISOString().slice(0, 10), platform: 'leetcode', easy: 0, medium: 0, hard: 0, time: 30, notes: '' });
    setShowForm(false);
    load();
  }

  async function deleteLog(id: string) {
    const { error } = await supabase.from('coding_logs').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setLogs((l) => l.filter((x) => x.id !== id));
    toast.success('Log deleted');
  }

  const totalEasy = logs.reduce((a, l) => a + l.easy_solved, 0);
  const totalMedium = logs.reduce((a, l) => a + l.medium_solved, 0);
  const totalHard = logs.reduce((a, l) => a + l.hard_solved, 0);
  const totalTime = logs.reduce((a, l) => a + l.time_spent_minutes, 0);
  const totalProblems = totalEasy + totalMedium + totalHard;

  const uniqueDates = Array.from(new Set(logs.map((l) => l.date))).sort();
  let currentStreak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
    let checkDate = uniqueDates.includes(today) ? today : yesterday;
    const dateSet = new Set(uniqueDates);
    while (dateSet.has(checkDate)) {
      currentStreak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    }
  }
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (Math.round(diff) === 1) { tempStreak++; } else { tempStreak = 1; }
    longestStreak = Math.max(longestStreak, tempStreak);
  }
  longestStreak = uniqueDates.length > 0 ? Math.max(longestStreak, 1) : 0;

  const chartData = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      easy: l.easy_solved,
      medium: l.medium_solved,
      hard: l.hard_solved,
    }));

  const pieData = [
    { name: 'Easy', value: totalEasy, color: 'hsl(var(--success))' },
    { name: 'Medium', value: totalMedium, color: 'hsl(var(--warning))' },
    { name: 'Hard', value: totalHard, color: 'hsl(var(--destructive))' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coding Tracker"
        description="Log your daily coding activity and visualize your progress."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="mr-2 h-4 w-4" /> {showForm ? 'Cancel' : 'Log activity'}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Code2} label="Easy solved" value={totalEasy} accent="success" />
        <StatCard icon={Code2} label="Medium solved" value={totalMedium} accent="warning" />
        <StatCard icon={Code2} label="Hard solved" value={totalHard} accent="destructive" />
        <StatCard icon={Flame} label="Current streak" value={`${currentStreak}d`} accent="warning" />
      </div>

      {showForm && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Log coding activity</CardTitle>
            <CardDescription>One entry per platform per day</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <select id="platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time spent (minutes)</Label>
              <Input id="time" type="number" min={0} value={form.time} onChange={(e) => setForm({ ...form, time: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="easy">Easy solved</Label>
              <Input id="easy" type="number" min={0} value={form.easy} onChange={(e) => setForm({ ...form, easy: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medium">Medium solved</Label>
              <Input id="medium" type="number" min={0} value={form.medium} onChange={(e) => setForm({ ...form, medium: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hard">Hard solved</Label>
              <Input id="hard" type="number" min={0} value={form.hard} onChange={(e) => setForm({ ...form, hard: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Topics, problems, learnings..." />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button onClick={addLog} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save log
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Last 14 days</CardTitle>
            <CardDescription>Problems solved per day by difficulty</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyState icon={Code2} title="No logs yet" description="Log your coding activity to see charts here." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="easy" stackId="a" fill="hsl(var(--success))" name="Easy" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="medium" stackId="a" fill="hsl(var(--warning))" name="Medium" />
                  <Bar dataKey="hard" stackId="a" fill="hsl(var(--destructive))" name="Hard" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Distribution</CardTitle>
            <CardDescription>By difficulty</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <EmptyState icon={Code2} title="No data" description="Log activity to see distribution." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((d) => <Cell key={d.name} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-lg">Activity log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : logs.length === 0 ? (
            <EmptyState icon={Code2} title="No activity yet" description="Log your first coding session to get started." action={<Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" /> Log activity</Button>} />
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{l.platform}</span>
                    <Badge variant="outline" className="text-xs">{new Date(l.date).toLocaleDateString()}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {l.easy_solved}E · {l.medium_solved}M · {l.hard_solved}H · {l.time_spent_minutes}min
                  </div>
                  {l.notes && <div className="mt-1 text-xs text-muted-foreground">{l.notes}</div>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLog(l.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
