'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { scoreResume, generateAISuggestion, type ResumeSection } from '@/lib/resume-scoring';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/empty-state';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResumeRow {
  id: string;
  title: string;
  content: ResumeSection;
  template: string;
  ats_score: number | null;
  grammar_score: number | null;
  keyword_score: number | null;
  ai_suggestions: string[];
  status: string;
  version: number;
  updated_at: string;
}

const EMPTY_CONTENT: ResumeSection = {
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
};

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = React.useState<ResumeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [content, setContent] = React.useState<ResumeSection>(EMPTY_CONTENT);
  const [title, setTitle] = React.useState('Untitled Resume');
  const [template, setTemplate] = React.useState('modern');
  const [scoring, setScoring] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const loadResumes = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as unknown as ResumeRow[];
    setResumes(rows);
    if (rows.length > 0) {
      setActiveId(rows[0].id);
      setContent(rows[0].content ?? EMPTY_CONTENT);
      setTitle(rows[0].title);
      setTemplate(rows[0].template);
    }
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  async function createResume() {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('resumes')
      .insert({ user_id: user.id, title: 'Untitled Resume', content: EMPTY_CONTENT, template: 'modern' })
      .select('*')
      .single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = data as unknown as ResumeRow;
    setResumes((r) => [row, ...r]);
    setActiveId(row.id);
    setContent(row.content ?? EMPTY_CONTENT);
    setTitle(row.title);
    setTemplate(row.template);
    toast.success('New resume created');
  }

  async function saveResume() {
    if (!user || !activeId) return;
    const score = scoreResume(content);
    const current = resumes.find((r) => r.id === activeId);
    const nextVersion = (current?.version ?? 1) + 1;
    const { data, error } = await supabase
      .from('resumes')
      .update({
        title,
        content,
        template,
        ats_score: score.ats,
        grammar_score: score.grammar,
        keyword_score: score.keyword,
        ai_suggestions: score.suggestions,
        version: nextVersion,
      })
      .eq('id', activeId)
      .select('*')
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const updated = data as unknown as ResumeRow;
    setResumes((r) => r.map((x) => (x.id === activeId ? updated : x)));
    toast.success(`Resume saved (v${nextVersion})`);
  }

  async function restoreVersion(id: string) {
    const { data, error } = await supabase.from('resumes').select('*').eq('id', id).single();
    if (error) { toast.error(error.message); return; }
    const row = data as unknown as ResumeRow;
    selectResume(row);
    toast.success(`Restored v${row.version}`);
  }

  async function deleteResume(id: string) {
    const { error } = await supabase.from('resumes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const remaining = resumes.filter((r) => r.id !== id);
    setResumes(remaining);
    if (activeId === id) {
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
        setContent(remaining[0].content ?? EMPTY_CONTENT);
        setTitle(remaining[0].title);
      } else {
        setActiveId(null);
        setContent(EMPTY_CONTENT);
        setTitle('Untitled Resume');
      }
    }
    toast.success('Resume deleted');
  }

  function selectResume(r: ResumeRow) {
    setActiveId(r.id);
    setContent(r.content ?? EMPTY_CONTENT);
    setTitle(r.title);
    setTemplate(r.template);
  }

  async function runAIScore() {
    setScoring(true);
    await new Promise((r) => setTimeout(r, 800));
    const score = scoreResume(content);
    setScoring(false);
    if (activeId) {
      const { error } = await supabase
        .from('resumes')
        .update({ ats_score: score.ats, grammar_score: score.grammar, keyword_score: score.keyword, ai_suggestions: score.suggestions })
        .eq('id', activeId);
      if (!error) {
        setResumes((r) => r.map((x) => (x.id === activeId ? { ...x, ats_score: score.ats, grammar_score: score.grammar, keyword_score: score.keyword, ai_suggestions: score.suggestions } : x)));
      }
    }
    toast.success(`ATS score: ${score.ats}/100`);
  }

  function exportPDF() {
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) { toast.error('Please allow popups to export PDF'); return; }
    const skills = content.skills.map((s) => `<span style="display:inline-block;background:#f0f0f0;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px">${s}</span>`).join('');
    const exp = content.experience.map((e) => `<div style="margin-bottom:12px"><div style="font-weight:600">${e.role} · ${e.company}</div><div style="font-size:12px;color:#666">${e.duration}</div><ul style="margin:4px 0;padding-left:20px;font-size:13px">${e.bullets.filter(Boolean).map((b) => `<li>${b}</li>`).join('')}</ul></div>`).join('');
    const edu = content.education.map((e) => `<div style="font-size:13px">${e.degree} · ${e.institution} · ${e.year}</div>`).join('');
    const proj = content.projects.map((p) => `<div style="margin-bottom:8px"><div style="font-weight:600">${p.name}</div><div style="font-size:13px;color:#666">${p.description}</div><div style="font-size:12px;color:#999">${p.tech}</div></div>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>*{font-family:Georgia,serif}body{padding:40px;max-width:700px;margin:0 auto;color:#222}h1{font-size:24px;margin:0 0 4px}h2{font-size:16px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}.summary{font-size:14px;color:#555;margin:8px 0}</style></head><body><h1>${title}</h1>${content.summary ? `<p class="summary">${content.summary}</p>` : ''}${exp ? `<h2>Experience</h2>${exp}` : ''}${edu ? `<h2>Education</h2>${edu}` : ''}${skills ? `<h2>Skills</h2>${skills}` : ''}${proj ? `<h2>Projects</h2>${proj}` : ''}<script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  }

  const score = scoreResume(content);
  const activeResume = resumes.find((r) => r.id === activeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Resume Builder"
        description="Build ATS-optimized resumes with live scoring and AI suggestions."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPDF}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
            <Button onClick={runAIScore} disabled={scoring || !activeId}>
              {scoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Run AI score
            </Button>
            <Button onClick={saveResume} disabled={!activeId}>Save</Button>
            <Button onClick={createResume} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              New
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Create your first resume to start building. You can have multiple versions."
          action={<Button onClick={createResume}><Plus className="mr-2 h-4 w-4" /> Create resume</Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Resume list */}
          <div className="space-y-3">
            {resumes.map((r) => (
              <Card
                key={r.id}
                className={`cursor-pointer border-border/60 transition-all hover:shadow-card-hover ${activeId === r.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => selectResume(r)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{r.title}</div>
                      <div className="text-xs text-muted-foreground">v{r.version} · {new Date(r.updated_at).toLocaleDateString()}</div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete resume?</DialogTitle>
                          <DialogDescription>This action cannot be undone. The resume will be archived.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" onClick={(e) => e.stopPropagation()}>Cancel</Button>
                          </DialogClose>
                          <Button variant="destructive" onClick={() => deleteResume(r.id)}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {r.ats_score != null && (
                    <Badge variant="secondary" className="mt-2">ATS {r.ats_score}/100</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Editor */}
          <div className="space-y-6">
            {/* Score panel */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-display text-lg">Live scores</CardTitle>
                <CardDescription>Updates as you type</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'ATS', value: score.ats, color: 'text-primary' },
                  { label: 'Grammar', value: score.grammar, color: 'text-success' },
                  { label: 'Keywords', value: score.keyword, color: 'text-chart-4' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <span className={`font-display text-xl font-bold ${s.color}`}>{s.value}/100</span>
                    </div>
                    <Progress value={s.value} className="mt-2 h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            {score.suggestions.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-lg"><Sparkles className="h-5 w-5 text-primary" /> AI suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {score.suggestions.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{s}</span>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Editor tabs */}
            <Tabs defaultValue="basics">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4">
                <Card className="border-border/60">
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Resume title</Label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Software Engineer Resume" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template">Template</Label>
                      <select
                        id="template"
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="summary">Professional summary</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const s = generateAISuggestion('summary', content.summary ?? '');
                            setContent({ ...content, summary: s });
                          }}
                        >
                          <Wand2 className="mr-1 h-3.5 w-3.5" /> AI suggest
                        </Button>
                      </div>
                      <Textarea
                        id="summary"
                        value={content.summary}
                        onChange={(e) => setContent({ ...content, summary: e.target.value })}
                        rows={4}
                        placeholder="A concise summary of your background and goals..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                {content.experience.map((exp, idx) => (
                  <Card key={idx} className="border-border/60">
                    <CardContent className="space-y-3 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input placeholder="Role" value={exp.role} onChange={(e) => {
                          const next = [...content.experience]; next[idx] = { ...exp, role: e.target.value }; setContent({ ...content, experience: next });
                        }} />
                        <Input placeholder="Company" value={exp.company} onChange={(e) => {
                          const next = [...content.experience]; next[idx] = { ...exp, company: e.target.value }; setContent({ ...content, experience: next });
                        }} />
                      </div>
                      <Input placeholder="Duration (e.g. Jan 2024 - Jun 2024)" value={exp.duration} onChange={(e) => {
                        const next = [...content.experience]; next[idx] = { ...exp, duration: e.target.value }; setContent({ ...content, experience: next });
                      }} />
                      {exp.bullets.map((b, bidx) => (
                        <div key={bidx} className="flex gap-2">
                          <Textarea
                            placeholder={`Bullet ${bidx + 1}`}
                            value={b}
                            rows={2}
                            onChange={(e) => {
                              const next = [...content.experience];
                              const bullets = [...exp.bullets]; bullets[bidx] = e.target.value;
                              next[idx] = { ...exp, bullets }; setContent({ ...content, experience: next });
                            }}
                          />
                          <Button variant="ghost" size="icon" onClick={() => {
                            const next = [...content.experience];
                            next[idx] = { ...exp, bullets: exp.bullets.filter((_, i) => i !== bidx) };
                            setContent({ ...content, experience: next });
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          const next = [...content.experience];
                          next[idx] = { ...exp, bullets: [...exp.bullets, ''] };
                          setContent({ ...content, experience: next });
                        }}><Plus className="mr-1 h-3.5 w-3.5" /> Add bullet</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const s = generateAISuggestion('bullet', '');
                          const next = [...content.experience];
                          next[idx] = { ...exp, bullets: [...exp.bullets, s] };
                          setContent({ ...content, experience: next });
                        }}><Wand2 className="mr-1 h-3.5 w-3.5" /> AI bullet</Button>
                        <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => {
                          setContent({ ...content, experience: content.experience.filter((_, i) => i !== idx) });
                        }}><Trash2 className="mr-1 h-3.5 w-3.5" /> Remove</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={() => setContent({ ...content, experience: [...content.experience, { role: '', company: '', duration: '', bullets: [''] }] })}>
                  <Plus className="mr-2 h-4 w-4" /> Add experience
                </Button>
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                {content.education.map((ed, idx) => (
                  <Card key={idx} className="border-border/60">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                      <Input placeholder="Degree" value={ed.degree} onChange={(e) => {
                        const next = [...content.education]; next[idx] = { ...ed, degree: e.target.value }; setContent({ ...content, education: next });
                      }} />
                      <Input placeholder="Institution" value={ed.institution} onChange={(e) => {
                        const next = [...content.education]; next[idx] = { ...ed, institution: e.target.value }; setContent({ ...content, education: next });
                      }} />
                      <div className="flex gap-2">
                        <Input placeholder="Year" value={ed.year} onChange={(e) => {
                          const next = [...content.education]; next[idx] = { ...ed, year: e.target.value }; setContent({ ...content, education: next });
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => setContent({ ...content, education: content.education.filter((_, i) => i !== idx) })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={() => setContent({ ...content, education: [...content.education, { degree: '', institution: '', year: '' }] })}>
                  <Plus className="mr-2 h-4 w-4" /> Add education
                </Button>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <Card className="border-border/60">
                  <CardContent className="p-6">
                    <Label>Skills (press Enter to add)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {content.skills.map((s, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {s}
                          <button onClick={() => setContent({ ...content, skills: content.skills.filter((_, i) => i !== idx) })} className="ml-1">×</button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      className="mt-3"
                      placeholder="Add a skill..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          setContent({ ...content, skills: [...content.skills, e.currentTarget.value.trim()] });
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-4">
                {content.projects.map((p, idx) => (
                  <Card key={idx} className="border-border/60">
                    <CardContent className="space-y-3 p-4">
                      <Input placeholder="Project name" value={p.name} onChange={(e) => {
                        const next = [...content.projects]; next[idx] = { ...p, name: e.target.value }; setContent({ ...content, projects: next });
                      }} />
                      <Textarea placeholder="Description" rows={2} value={p.description} onChange={(e) => {
                        const next = [...content.projects]; next[idx] = { ...p, description: e.target.value }; setContent({ ...content, projects: next });
                      }} />
                      <Input placeholder="Tech (comma separated)" value={p.tech} onChange={(e) => {
                        const next = [...content.projects]; next[idx] = { ...p, tech: e.target.value }; setContent({ ...content, projects: next });
                      }} />
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setContent({ ...content, projects: content.projects.filter((_, i) => i !== idx) })}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={() => setContent({ ...content, projects: [...content.projects, { name: '', description: '', tech: '' }] })}>
                  <Plus className="mr-2 h-4 w-4" /> Add project
                </Button>
              </TabsContent>

              <TabsContent value="preview">
                <Card className="border-border/60">
                  <CardContent className="p-8">
                    <div className="prose prose-sm max-w-none">
                      <h1 className="font-display text-2xl font-bold">{title}</h1>
                      {content.summary && <p className="text-muted-foreground">{content.summary}</p>}
                      {content.experience.length > 0 && (
                        <>
                          <h2 className="mt-6 font-display text-lg font-semibold">Experience</h2>
                          {content.experience.map((e, i) => (
                            <div key={i} className="mt-2">
                              <div className="font-medium">{e.role} · {e.company}</div>
                              <div className="text-xs text-muted-foreground">{e.duration}</div>
                              <ul className="mt-1 list-disc pl-5 text-sm">
                                {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                              </ul>
                            </div>
                          ))}
                        </>
                      )}
                      {content.education.length > 0 && (
                        <>
                          <h2 className="mt-6 font-display text-lg font-semibold">Education</h2>
                          {content.education.map((e, i) => (
                            <div key={i} className="text-sm">{e.degree} · {e.institution} · {e.year}</div>
                          ))}
                        </>
                      )}
                      {content.skills.length > 0 && (
                        <>
                          <h2 className="mt-6 font-display text-lg font-semibold">Skills</h2>
                          <div className="flex flex-wrap gap-1.5">{content.skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}</div>
                        </>
                      )}
                      {content.projects.length > 0 && (
                        <>
                          <h2 className="mt-6 font-display text-lg font-semibold">Projects</h2>
                          {content.projects.map((p, i) => (
                            <div key={i} className="mt-2">
                              <div className="font-medium">{p.name}</div>
                              <p className="text-sm text-muted-foreground">{p.description}</p>
                              <div className="text-xs text-muted-foreground">{p.tech}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
