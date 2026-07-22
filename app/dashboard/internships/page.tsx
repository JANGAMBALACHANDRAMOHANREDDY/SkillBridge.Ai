'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface Internship {
  id: string;
  company: string;
  title: string;
  description: string;
  location: string | null;
  stipend: string | null;
  duration: string | null;
  deadline: string | null;
  skills_required: string[];
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  internship: { id: string; company: string; title: string; location: string | null }[] | null;
}

interface Applicant {
  id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  user_id: string;
}

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-primary/10 text-primary',
  shortlisted: 'bg-warning/10 text-warning',
  interview: 'bg-chart-4/10 text-chart-4',
  offer: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

const STATUS_FLOW = ['applied', 'shortlisted', 'interview', 'offer', 'rejected'];

export default function InternshipPortalPage() {
  const { user, profile } = useAuth();
  const isRecruiter = profile?.role === 'recruiter';
  const [internships, setInternships] = React.useState<Internship[]>([]);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [skillFilter, setSkillFilter] = React.useState('');
  const [locationFilter, setLocationFilter] = React.useState('');
  const [applyTarget, setApplyTarget] = React.useState<Internship | null>(null);
  const [detailTarget, setDetailTarget] = React.useState<Internship | null>(null);
  const [coverLetter, setCoverLetter] = React.useState('');
  const [applying, setApplying] = React.useState(false);
  const [posting, setPosting] = React.useState(false);
  const [newJob, setNewJob] = React.useState({
    company: '', title: '', description: '', location: '', stipend: '', duration: '', deadline: '', skills: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const [intRes, appRes] = await Promise.all([
      supabase.from('internships').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      user ? supabase.from('applications').select('id, status, applied_at, cover_letter, internship:internship_id(id, company, title, location)').eq('user_id', user.id).order('applied_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    ]);
    setInternships((intRes.data ?? []) as Internship[]);
    setApplications((appRes.data ?? []) as unknown as Application[]);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${user.id}` }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  async function apply() {
    if (!user || !applyTarget) return;
    setApplying(true);
    const { error } = await supabase.from('applications').insert({
      internship_id: applyTarget.id,
      user_id: user.id,
      cover_letter: coverLetter || null,
    });
    setApplying(false);
    if (error) {
      if (error.code === '23505') toast.error('You have already applied to this internship.');
      else toast.error(error.message);
      return;
    }
    toast.success('Application submitted!');
    setApplyTarget(null);
    setDetailTarget(null);
    setCoverLetter('');
    load();
  }

  async function postInternship() {
    if (!user) return;
    setPosting(true);
    const { error } = await supabase.from('internships').insert({
      posted_by: user.id,
      company: newJob.company,
      title: newJob.title,
      description: newJob.description,
      location: newJob.location || null,
      stipend: newJob.stipend || null,
      duration: newJob.duration || null,
      deadline: newJob.deadline || null,
      skills_required: newJob.skills.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Internship posted');
    setNewJob({ company: '', title: '', description: '', location: '', stipend: '', duration: '', deadline: '', skills: '' });
    load();
  }

  const filtered = internships.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || i.title.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || (i.location ?? '').toLowerCase().includes(q);
    const matchesSkill = !skillFilter || i.skills_required.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchesLocation = !locationFilter || (i.location ?? '').toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesSkill && matchesLocation;
  });

  const appliedIds = new Set(applications.map((a) => a.internship?.[0]?.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internship Portal"
        description={isRecruiter ? 'Post internships and manage applicants.' : 'Browse and apply to internships that match your skills.'}
        actions={
          isRecruiter ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Post internship</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post a new internship</DialogTitle>
                  <DialogDescription>Fill in the details below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Company</Label><Input value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Title</Label><Input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Location</Label><Input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Stipend</Label><Input value={newJob.stipend} onChange={(e) => setNewJob({ ...newJob, stipend: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Duration</Label><Input value={newJob.duration} onChange={(e) => setNewJob({ ...newJob, duration: e.target.value })} placeholder="e.g. 3 months" /></div>
                  <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={newJob.deadline} onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })} /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Skills (comma separated)</Label><Input value={newJob.skills} onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })} placeholder="React, Python, SQL" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={4} value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={postInternship} disabled={posting || !newJob.company || !newJob.title || !newJob.description}>
                    {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post internship
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Internships</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by title, company, or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Input placeholder="Filter by skill..." value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="sm:max-w-xs" />
            <Input placeholder="Filter by location..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="sm:max-w-xs" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Briefcase} title="No internships found" description={search || skillFilter || locationFilter ? 'Try different filters.' : 'Check back soon for new opportunities.'} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((iv) => (
                <Card key={iv.id} className="cursor-pointer border-border/60 transition-shadow hover:shadow-card-hover" onClick={() => setDetailTarget(iv)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      {iv.status === 'open' ? <Badge variant="secondary" className="text-success">Open</Badge> : <Badge variant="outline">{iv.status}</Badge>}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{iv.title}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">{iv.company}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {iv.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {iv.location}</span>}
                      {iv.stipend && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {iv.stipend}</span>}
                      {iv.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(iv.deadline).toLocaleDateString()}</span>}
                    </div>
                    {iv.skills_required.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {iv.skills_required.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                    )}
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{iv.description}</p>
                    <div className="mt-4">
                      {isRecruiter ? (
                        <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); setDetailTarget(iv); }}>
                          <Users className="mr-2 h-3.5 w-3.5" /> View applicants
                        </Button>
                      ) : appliedIds.has(iv.id) ? (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Applied
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); setApplyTarget(iv); }}>
                          <Send className="mr-2 h-3.5 w-3.5" /> Apply now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">My applications</CardTitle>
              <CardDescription>Track the status of your applications — updates in real time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications.length === 0 ? (
                <EmptyState icon={Briefcase} title="No applications yet" description="Apply to internships from the Browse tab." action={<Button asChild><Link href="#browse">Browse internships</Link></Button>} />
              ) : (
                applications.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                    <div>
                      <div className="text-sm font-medium">{a.internship?.[0]?.title}</div>
                      <div className="text-xs text-muted-foreground">{a.internship?.[0]?.company} · {a.internship?.[0]?.location ?? 'Remote'}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Applied {new Date(a.applied_at).toLocaleDateString()}</div>
                    </div>
                    <Badge className={STATUS_COLORS[a.status] ?? 'bg-muted'}>{a.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(o) => !o && setDetailTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{detailTarget.title}</DialogTitle>
                <DialogDescription>{detailTarget.company}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {detailTarget.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {detailTarget.location}</span>}
                  {detailTarget.stipend && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {detailTarget.stipend}</span>}
                  {detailTarget.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {detailTarget.duration}</span>}
                  {detailTarget.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline: {new Date(detailTarget.deadline).toLocaleDateString()}</span>}
                </div>
                {detailTarget.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {detailTarget.skills_required.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                )}
                <div>
                  <Label>Description</Label>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detailTarget.description}</p>
                </div>
                {isRecruiter ? (
                  <ApplicantList internshipId={detailTarget.id} />
                ) : (
                  <div className="flex gap-2 pt-2">
                    {appliedIds.has(detailTarget.id) ? (
                      <Button variant="outline" className="flex-1" disabled><CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Already applied</Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>
                        <Button className="flex-1" onClick={() => { setApplyTarget(detailTarget); setDetailTarget(null); }}>
                          <Send className="mr-2 h-3.5 w-3.5" /> Apply now
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply dialog */}
      <Dialog open={!!applyTarget} onOpenChange={(o) => !o && setApplyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {applyTarget?.title}</DialogTitle>
            <DialogDescription>at {applyTarget?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Cover letter (optional)</Label>
            <Textarea rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Tell the recruiter why you're a great fit..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyTarget(null)}>Cancel</Button>
            <Button onClick={apply} disabled={applying}>
              {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicantList({ internshipId }: { internshipId: string }) {
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('applications').select('id, status, applied_at, cover_letter, user_id').eq('internship_id', internshipId).order('applied_at', { ascending: false });
      setApplicants((data ?? []) as Applicant[]);
      setLoading(false);
    })();
  }, [internshipId]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    setUpdating(null);
    if (error) { toast.error(error.message); return; }
    setApplicants((a) => a.map((x) => x.id === id ? { ...x, status } : x));
    toast.success(`Status updated to ${status}`);
  }

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (applicants.length === 0) return <EmptyState icon={Users} title="No applicants yet" description="Applicants will appear here once students apply." />;

  return (
    <div className="space-y-3">
      <Label>Applicants ({applicants.length})</Label>
      {applicants.map((a) => (
        <div key={a.id} className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/15 text-primary text-xs">U</AvatarFallback></Avatar>
              <div>
                <div className="text-xs text-muted-foreground">Applied {new Date(a.applied_at).toLocaleDateString()}</div>
              </div>
            </div>
            <Badge className={STATUS_COLORS[a.status] ?? 'bg-muted'}>{a.status}</Badge>
          </div>
          {a.cover_letter && <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{a.cover_letter}</p>}
          <div className="mt-2 flex gap-1">
            {STATUS_FLOW.map((s) => (
              <Button key={s} variant={a.status === s ? 'default' : 'outline'} size="sm" className="h-6 px-2 text-xs capitalize" disabled={updating === a.id} onClick={() => updateStatus(a.id, s)}>
                {s}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
