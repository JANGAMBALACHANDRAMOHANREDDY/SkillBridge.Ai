'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { BarChart3, GraduationCap, Loader2, Search, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/empty-state';

interface Student {
  id: string;
  full_name: string | null;
  email: string;
  college: string | null;
  graduation_year: number | null;
  major: string | null;
  skills: string[] | null;
  profile_completion: number;
  study_streak: number;
}

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, college, graduation_year, major, skills, profile_completion, study_streak')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setStudents((data ?? []) as Student[]);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return !q || (s.full_name ?? '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.college ?? '').toLowerCase().includes(q);
  });

  const totalStudents = students.length;
  const avgCompletion = students.length ? Math.round(students.reduce((a, s) => a + s.profile_completion, 0) / students.length) : 0;
  const withStreak = students.filter((s) => s.study_streak > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Manage and track all students under your purview." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Total students" value={totalStudents} accent="primary" />
        <StatCard icon={BarChart3} label="Avg profile completion" value={`${avgCompletion}%`} accent="success" />
        <StatCard icon={GraduationCap} label="Active streaks" value={withStreak} accent="warning" />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="Students will appear here once they sign up." />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {filtered.map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-4">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/15 text-primary text-sm">{(s.full_name ?? s.email).charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.full_name ?? 'Unknown'}</div>
                    <div className="truncate text-xs text-muted-foreground">{s.email} · {s.college ?? 'No college'} · {s.major ?? 'No major'}</div>
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block">Class of {s.graduation_year ?? '—'}</div>
                  <Badge variant="secondary">{s.profile_completion}%</Badge>
                  {s.study_streak > 0 && <Badge variant="outline" className="text-warning">{s.study_streak}d streak</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
