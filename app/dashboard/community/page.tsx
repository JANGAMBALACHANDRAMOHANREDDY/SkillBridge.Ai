'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ArrowBigUp, Loader2, MessageSquare, Plus, Search, Users } from 'lucide-react';
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

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  views: number;
  created_at: string;
  user_id: string;
}

interface Answer {
  id: string;
  content: string;
  upvotes: number;
  created_at: string;
  user_id: string;
}

const PAGE_SIZE = 10;

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', content: '', tags: '' });
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [upvotedIds, setUpvotedIds] = React.useState<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    setLoading(true);
    const q = supabase.from('community_posts').select('*', { count: 'exact' }).is('deleted_at', null);
    if (search) {
      q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    const { data, count, error } = await q;
    if (error) toast.error(error.message);
    setPosts((data ?? []) as Post[]);
    setTotalCount(count ?? 0);
    if (user) {
      const { data: uv } = await supabase.from('post_upvotes').select('post_id').eq('user_id', user.id);
      setUpvotedIds(new Set((uv ?? []).map((r: { post_id: string }) => r.post_id)));
    }
    setLoading(false);
  }, [search, page, user]);

  React.useEffect(() => { load(); }, [load]);

  async function create() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      title: form.title,
      content: form.content,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Posted!');
    setForm({ title: '', content: '', tags: '' });
    setOpen(false);
    setPage(0);
    load();
  }

  async function toggleUpvote(p: Post) {
    if (!user) return;
    const { data, error } = await supabase.rpc('toggle_post_upvote', { p_post_id: p.id });
    if (error) { toast.error(error.message); return; }
    const result = data as { upvoted: boolean; count: number } | null;
    if (result) {
      setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, upvotes: result.count } : x));
      setUpvotedIds((prev) => {
        const next = new Set(prev);
        if (result.upvoted) next.add(p.id); else next.delete(p.id);
        return next;
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community"
        description="Ask questions, share knowledge, and connect with peers."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New post</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a discussion</DialogTitle>
                <DialogDescription>Ask a question or share something with the community.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="dsa, python, career" /></div>
              </div>
              <DialogFooter><Button onClick={create} disabled={saving || !form.title || !form.content}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search posts..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Users} title="No posts yet" description={search ? 'Try a different search.' : 'Be the first to start a discussion.'} action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New post</Button>} />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} upvoted={upvotedIds.has(p.id)} onUpvote={() => toggleUpvote(p)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Next</Button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, upvoted, onUpvote }: { post: Post; upvoted: boolean; onUpvote: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const [answers, setAnswers] = React.useState<Answer[]>([]);
  const [answerText, setAnswerText] = React.useState('');
  const [loadingAnswers, setLoadingAnswers] = React.useState(false);
  const [posting, setPosting] = React.useState(false);
  const { user } = useAuth();

  async function loadAnswers() {
    setLoadingAnswers(true);
    const { data } = await supabase.from('community_answers').select('id, content, upvotes, created_at, user_id').eq('post_id', post.id).order('upvotes', { ascending: false }).order('created_at', { ascending: true });
    setAnswers((data ?? []) as Answer[]);
    setLoadingAnswers(false);
  }

  React.useEffect(() => {
    if (expanded && answers.length === 0) {
      loadAnswers();
      supabase.rpc('increment_post_views', { p_post_id: post.id }).then(({ error }) => { if (error) console.error(error); });
    }
  }, [expanded]);

  async function submitAnswer() {
    if (!user || !answerText.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('community_answers').insert({
      post_id: post.id,
      user_id: user.id,
      content: answerText,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setAnswerText('');
    loadAnswers();
    toast.success('Comment posted');
  }

  return (
    <Card className="border-border/60 transition-shadow hover:shadow-card-hover">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <button onClick={onUpvote} className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 transition-colors ${upvoted ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 hover:bg-accent'}`}>
            <ArrowBigUp className="h-5 w-5" />
            <span className="text-sm font-semibold">{post.upvotes}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/15 text-primary text-xs">U</AvatarFallback></Avatar>
              <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{post.title}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{post.content}</p>
            <div className="mt-3 flex items-center gap-2">
              {post.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3" /> {answers.length || post.views} views</span>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => setExpanded((e) => !e)}>
              {expanded ? 'Hide comments' : `${answers.length || ''} Comments`}
            </Button>
          </div>
        </div>
      </CardContent>
      {expanded && (
        <div className="border-t border-border/60 p-5 space-y-4">
          {loadingAnswers ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : answers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to answer.</p>
          ) : (
            <div className="space-y-3">
              {answers.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <Avatar className="h-7 w-7 flex-shrink-0"><AvatarFallback className="bg-muted text-xs">U</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 rounded-lg bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</div>
                    <p className="mt-1 text-sm">{a.content}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowBigUp className="h-3 w-3" /> {a.upvotes}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {user && (
            <div className="flex gap-2">
              <Input value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Write a comment..." onKeyDown={(e) => { if (e.key === 'Enter') submitAnswer(); }} />
              <Button size="sm" onClick={submitAnswer} disabled={posting || !answerText.trim()}>
                {posting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Comment
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
