'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ExternalLink, FolderGit2, Github, Loader2, Plus, Star } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

interface Project {
  id: string;
  title: string;
  description: string;
  github_url: string | null;
  live_url: string | null;
  tech_stack: string[];
  created_at: string;
}

export default function ProjectHubPage() {
  const { user } = useAuth();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', description: '', github_url: '', live_url: '', tech_stack: '' });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setProjects((data ?? []) as Project[]);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      github_url: form.github_url || null,
      live_url: form.live_url || null,
      tech_stack: form.tech_stack.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Project added');
    setForm({ title: '', description: '', github_url: '', live_url: '', tech_stack: '' });
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setProjects((p) => p.filter((x) => x.id !== id));
    toast.success('Project removed');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Hub"
        description="Showcase your projects and get discovered by recruiters."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add project</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a project</DialogTitle>
                <DialogDescription>Share your work with the community.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>GitHub URL</Label><Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." /></div>
                  <div className="space-y-2"><Label>Live URL</Label><Input value={form.live_url} onChange={(e) => setForm({ ...form, live_url: e.target.value })} placeholder="https://..." /></div>
                </div>
                <div className="space-y-2"><Label>Tech stack (comma separated)</Label><Input value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, Node, PostgreSQL" /></div>
              </div>
              <DialogFooter><Button onClick={add} disabled={saving || !form.title || !form.description}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add project</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderGit2} title="No projects yet" description="Add your first project to showcase your work." action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add project</Button>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="border-border/60 transition-shadow hover:shadow-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FolderGit2 className="h-5 w-5" /></div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(p.id)}>×</Button>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">{p.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                {p.tech_stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">{p.tech_stack.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
                )}
                <div className="mt-4 flex gap-2">
                  {p.github_url && <Button variant="outline" size="sm" asChild><a href={p.github_url} target="_blank" rel="noreferrer"><Github className="mr-1.5 h-3.5 w-3.5" /> Code</a></Button>}
                  {p.live_url && <Button variant="outline" size="sm" asChild><a href={p.live_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Live</a></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
