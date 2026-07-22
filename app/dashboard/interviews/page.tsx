'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Brain,
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Play,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { INTERVIEW_BANK, evaluateAnswer, type InterviewQuestion } from '@/lib/interview-bank';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/empty-state';

type InterviewType = 'behavioral' | 'technical' | 'hr' | 'company';

interface SessionQuestion extends InterviewQuestion {
  answer: string;
  evaluation?: { score: number; feedback: string; suggestions: string[] };
}

interface PastInterview {
  id: string;
  type: string;
  company: string | null;
  role: string | null;
  overall_score: number | null;
  duration_minutes: number | null;
  started_at: string;
  status: string;
}

const TYPE_META: Record<InterviewType, { label: string; icon: React.ElementType; description: string }> = {
  behavioral: { label: 'Behavioral', icon: User, description: 'STAR-method questions about your past experiences' },
  technical: { label: 'Technical', icon: Brain, description: 'System design and CS fundamentals' },
  hr: { label: 'HR Round', icon: MessageSquare, description: 'Common HR and culture-fit questions' },
  company: { label: 'Company-specific', icon: Briefcase, description: 'Why this company? Product deep-dives' },
};

export default function MockInterviewPage() {
  const { user } = useAuth();
  const [stage, setStage] = React.useState<'setup' | 'interview' | 'results'>('setup');
  const [type, setType] = React.useState<InterviewType>('behavioral');
  const [company, setCompany] = React.useState('');
  const [role, setRole] = React.useState('');
  const [questions, setQuestions] = React.useState<SessionQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [interviewId, setInterviewId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [past, setPast] = React.useState<PastInterview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const startedAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!user) return;
    supabase
      .from('mock_interviews')
      .select('id, type, company, role, overall_score, duration_minutes, started_at, status')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error) setPast((data ?? []) as PastInterview[]);
        setLoading(false);
      });
  }, [user]);

  function startInterview() {
    const bank = INTERVIEW_BANK[type] ?? [];
    const selected = bank.slice(0, 4).map((q) => ({ ...q, answer: '' }));
    setQuestions(selected);
    setCurrentIdx(0);
    startedAtRef.current = Date.now();
    (async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('mock_interviews')
        .insert({ user_id: user.id, type, company: company || null, role: role || null, status: 'in_progress' })
        .select('id')
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setInterviewId(data.id);
      setStage('interview');
    })();
  }

  function evaluateCurrent() {
    const q = questions[currentIdx];
    if (!q || !q.answer.trim()) {
      toast.error('Please write an answer first');
      return;
    }
    const evaluation = evaluateAnswer(q.answer, q);
    const next = [...questions];
    next[currentIdx] = { ...q, evaluation };
    setQuestions(next);
    if (interviewId) {
      supabase.from('mock_interview_questions').insert({
        interview_id: interviewId,
        question: q.question,
        user_answer: q.answer,
        ai_evaluation: evaluation.feedback,
        score: evaluation.score,
        suggestions: evaluation.suggestions,
      }).then(({ error }) => { if (error) console.error(error); });
    }
    toast.success(`Scored ${evaluation.score}/100`);
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishInterview();
    }
  }

  async function finishInterview() {
    setSaving(true);
    const overall = Math.round(
      questions.reduce((a, q) => a + (q.evaluation?.score ?? 0), 0) / Math.max(1, questions.length),
    );
    const feedback = `You scored ${overall}/100 across ${questions.length} questions. ${overall >= 75 ? 'Strong performance — you are interview-ready.' : overall >= 50 ? 'Decent — focus on structure and quantification.' : 'Keep practicing — review the model answers and try again.'}`;
    const durationMinutes = startedAtRef.current
      ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000))
      : 10;
    if (interviewId) {
      await supabase.from('mock_interviews').update({
        overall_score: overall,
        feedback,
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
      }).eq('id', interviewId);
    }
    setSaving(false);
    setStage('results');
  }

  function reset() {
    setStage('setup');
    setQuestions([]);
    setCurrentIdx(0);
    setInterviewId(null);
    setCompany('');
    setRole('');
  }

  const overallScore = questions.length
    ? Math.round(questions.reduce((a, q) => a + (q.evaluation?.score ?? 0), 0) / questions.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Interviews"
        description="Practice with AI-generated questions and get instant feedback."
      />

      {stage === 'setup' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(TYPE_META) as InterviewType[]).map((t) => {
              const meta = TYPE_META[t];
              return (
                <Card
                  key={t}
                  className={`cursor-pointer border-border/60 transition-all hover:-translate-y-1 hover:shadow-card-hover ${type === t ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setType(t)}
                >
                  <CardContent className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <meta.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-display font-semibold">{meta.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Configure your session</CardTitle>
              <CardDescription>Optional — tailor the interview to a specific company or role</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Target company</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Target role</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. SDE Intern" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={startInterview} size="lg">
              <Play className="mr-2 h-4 w-4" /> Start interview
            </Button>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Past sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : past.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No sessions yet" description="Your past mock interviews will appear here." />
              ) : (
                past.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div>
                      <div className="text-sm font-medium capitalize">{p.type} round {p.company ? `· ${p.company}` : ''}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.started_at).toLocaleString()}</div>
                    </div>
                    {p.overall_score != null ? <Badge variant="secondary">{p.overall_score}/100</Badge> : <Badge variant="outline">In progress</Badge>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {stage === 'interview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Question {currentIdx + 1} of {questions.length}
            </div>
            <Badge variant="secondary" className="capitalize">{type}</Badge>
          </div>
          <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-2" />

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg leading-relaxed">
                {questions[currentIdx]?.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hints</Label>
                <ul className="mt-2 space-y-1.5">
                  {questions[currentIdx]?.hints.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Your answer</Label>
                <Textarea
                  id="answer"
                  rows={6}
                  value={questions[currentIdx]?.answer ?? ''}
                  onChange={(e) => {
                    const next = [...questions];
                    next[currentIdx] = { ...next[currentIdx], answer: e.target.value };
                    setQuestions(next);
                  }}
                  placeholder="Type your answer here. Use the STAR method for behavioral questions..."
                />
              </div>
              {questions[currentIdx]?.evaluation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-primary/30 bg-primary/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold">Score: {questions[currentIdx].evaluation!.score}/100</span>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <p className="mt-2 text-sm">{questions[currentIdx].evaluation!.feedback}</p>
                  {questions[currentIdx].evaluation!.suggestions.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {questions[currentIdx].evaluation!.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={evaluateCurrent} disabled={!questions[currentIdx]?.answer?.trim()}>
                  <Sparkles className="mr-2 h-4 w-4" /> Evaluate answer
                </Button>
                <Button onClick={nextQuestion} disabled={!questions[currentIdx]?.evaluation}>
                  {currentIdx < questions.length - 1 ? 'Next question' : 'Finish interview'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === 'results' && (
        <div className="space-y-6">
          <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-chart-4/5">
            <CardContent className="p-8 text-center">
              <div className="font-display text-5xl font-bold gradient-text">{overallScore}/100</div>
              <p className="mt-2 text-muted-foreground">Overall score across {questions.length} questions</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Question {i + 1}</div>
                      <p className="mt-1 text-sm font-medium">{q.question}</p>
                    </div>
                    {q.evaluation && <Badge variant="secondary">{q.evaluation.score}/100</Badge>}
                  </div>
                  {q.evaluation && (
                    <p className="mt-2 text-sm text-muted-foreground">{q.evaluation.feedback}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={reset}>Take another interview</Button>
          </div>
        </div>
      )}
    </div>
  );
}
