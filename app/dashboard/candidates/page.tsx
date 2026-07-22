'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Briefcase, Loader2, MapPin, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/empty-state';

interface Candidate {
  id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  college: string | null;
  skills: string[] | null;
  target_role: string | null;
  profile_completion: number;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [skill, setSkill] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, headline, location, college, skills, target_role, profile_completion')
      .eq('role', 'student')
      .order('profile_completion', { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setCandidates((data ?? []) as Candidate[]);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchesQ = !q || (c.full_name ?? '').toLowerCase().includes(q) || (c.college ?? '').toLowerCase().includes(q) || (c.target_role ?? '').toLowerCase().includes(q);
    const matchesSkill = !skill || (c.skills ?? []).some((s) => s.toLowerCase().includes(skill.toLowerCase()));
    return matchesQ && matchesSkill;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Candidates" description="Search and shortlist students matching your open roles." />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, college, or target role..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input placeholder="Filter by skill..." value={skill} onChange={(e) => setSkill(e.target.value)} className="sm:max-w-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No candidates found" description="Try a different search or skill filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="border-border/60 transition-shadow hover:shadow-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/15 text-primary">{(c.full_name ?? 'U').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{c.full_name ?? 'Anonymous'}</div>
                    <div className="truncate text-sm text-muted-foreground">{c.headline ?? 'Student'}</div>
                  </div>
                  <Badge variant="secondary">{c.profile_completion}%</Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {c.college && <div className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {c.college}</div>}
                  {c.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</div>}
                  {c.target_role && <div>Target: {c.target_role}</div>}
                </div>
                {c.skills && c.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 5).map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                )}
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/dashboard/students`}>View profile</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
