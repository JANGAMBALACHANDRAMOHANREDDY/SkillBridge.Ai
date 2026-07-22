'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Award, CheckCircle2, Clock, Loader2, Play, Target } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  passing_score: number;
  questions: { question: string; options: string[]; answer: number; explanation?: string }[];
}

interface Attempt {
  id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  assessment_id: string;
}

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState<Assessment | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [aRes, tRes] = await Promise.all([
      supabase.from('assessments').select('*'),
      supabase.from('assessment_attempts').select('id, score, passed, completed_at, assessment_id').eq('user_id', user.id),
    ]);
    setAssessments((aRes.data ?? []) as Assessment[]);
    setAttempts((tRes.data ?? []) as Attempt[]);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  function startAssessment(a: Assessment) {
    setActive(a);
    setAnswers({});
  }

  async function submit() {
    if (!user || !active) return;
    setSubmitting(true);
    let correct = 0;
    active.questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
    const score = Math.round((correct / active.questions.length) * 100);
    const passed = score >= active.passing_score;
    const { error } = await supabase.from('assessment_attempts').upsert({
      user_id: user.id,
      assessment_id: active.id,
      score,
      passed,
      answers: answers,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,assessment_id' });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(passed ? `Passed with ${score}%!` : `Scored ${score}%. Keep practicing.`);
    setActive(null);
    load();
  }

  const passedCount = attempts.filter((a) => a.passed).length;
  const avgScore = attempts.length ? Math.round(attempts.reduce((a, t) => a + t.score, 0) / attempts.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Assessment Center" description="Test your skills and earn certificates." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Target} label="Available tests" value={assessments.length} accent="primary" />
        <StatCard icon={CheckCircle2} label="Tests passed" value={passedCount} accent="success" />
        <StatCard icon={Award} label="Average score" value={`${avgScore}%`} accent="warning" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => {
            const attempt = attempts.find((t) => t.assessment_id === a.id);
            return (
              <Card key={a.id} className="border-border/60 transition-shadow hover:shadow-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                    {attempt ? (
                      <Badge variant={attempt.passed ? 'secondary' : 'outline'} className={attempt.passed ? 'text-success' : ''}>
                        {attempt.score}%
                      </Badge>
                    ) : <Badge variant="outline">New</Badge>}
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration_minutes}min</span>
                    <span className="capitalize">{a.category}</span>
                    <span>Pass: {a.passing_score}%</span>
                  </div>
                  <Button className="mt-4 w-full" size="sm" onClick={() => startAssessment(a)}>
                    <Play className="mr-2 h-3.5 w-3.5" /> {attempt ? 'Retake' : 'Start test'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>{active?.questions.length ?? 0} questions · {active?.duration_minutes} minutes</DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-5">
              {active.questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-sm font-medium">{i + 1}. {q.question}</div>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [i]: oi })}
                        className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${answers[i] === oi ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${answers[i] === oi ? 'border-primary bg-primary text-primary-foreground text-xs' : 'border-muted-foreground/40'}`}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Answered {Object.keys(answers).length} / {active.questions.length}</span>
                </div>
                <Progress value={(Object.keys(answers).length / active.questions.length) * 100} className="h-1.5" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting || Object.keys(answers).length < (active?.questions.length ?? 1)}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
