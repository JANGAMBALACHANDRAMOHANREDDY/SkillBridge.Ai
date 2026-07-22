'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Loader2, Play, Search, Star, X } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  category: string;
  difficulty: string;
  duration_hours: number | null;
  thumbnail: string | null;
  rating: number;
  enrollment_count: number;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  duration_minutes: number;
  display_order: number;
}

interface LessonProgressRow {
  lesson_id: string;
  completed: boolean;
}

interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  course: Course;
}

export default function LearningHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [viewCourse, setViewCourse] = React.useState<{ course: Course; enrollment: Enrollment | null } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [cRes, eRes] = await Promise.all([
      supabase.from('courses').select('*').order('rating', { ascending: false }),
      user ? supabase.from('enrollments').select('id, progress, completed, enrolled_at, course:course_id(*)').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
    ]);
    setCourses((cRes.data ?? []) as Course[]);
    setEnrollments((eRes.data ?? []) as unknown as Enrollment[]);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  async function enroll(course: Course) {
    if (!user) return;
    const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: course.id });
    if (error) {
      if (error.code === '23505') toast.error('Already enrolled');
      else { toast.error(error.message); return; }
    }
    toast.success('Enrolled! Redirecting to course...');
    await load();
    setViewCourse({ course, enrollment: null });
  }

  const categories = ['all', ...Array.from(new Set(courses.map((c) => c.category)))];
  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || c.title.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
    const matchesCat = category === 'all' || c.category === category;
    return matchesSearch && matchesCat;
  });

  const enrolledIds = new Set(enrollments.map((e) => e.course?.id));
  const completed = enrollments.filter((e) => e.completed).length;
  const inProgress = enrollments.filter((e) => !e.completed).length;
  const avgProgress = enrollments.length ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length) : 0;

  if (viewCourse) {
    return (
      <CourseView
        course={viewCourse.course}
        enrollment={viewCourse.enrollment ?? enrollments.find((e) => e.course?.id === viewCourse.course.id) ?? null}
        onBack={() => { setViewCourse(null); load(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Hub" description="Curated courses to level up your skills." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Enrolled" value={enrollments.length} accent="primary" />
        <StatCard icon={Play} label="In progress" value={inProgress} accent="warning" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} accent="success" />
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="mine">My courses</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)} className="whitespace-nowrap capitalize">{c}</Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses found" description="Try a different search or category." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <Card key={c.id} className="overflow-hidden border-border/60 transition-shadow hover:shadow-card-hover">
                  <div className="aspect-video overflow-hidden bg-muted">
                    {c.thumbnail ? (
                      <Image src={c.thumbnail} alt={c.title} width={400} height={225} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{c.category}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{c.difficulty}</Badge>
                    </div>
                    <h3 className="mt-2 font-display text-base font-semibold leading-snug">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{c.instructor ?? 'Unknown'}</span>
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {Number(c.rating).toFixed(1)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration_hours ?? 0}h</span>
                      <span>{c.enrollment_count.toLocaleString()} enrolled</span>
                    </div>
                    <div className="mt-4">
                      {enrolledIds.has(c.id) ? (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setViewCourse({ course: c, enrollment: enrollments.find((e) => e.course?.id === c.id) ?? null })}>
                          <Play className="mr-2 h-3.5 w-3.5" /> Continue learning
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => enroll(c)}>Enroll free</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">My courses</CardTitle>
              <CardDescription>Average progress: {avgProgress}%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollments.length === 0 ? (
                <EmptyState icon={BookOpen} title="Not enrolled yet" description="Browse the catalog and enroll in a course." />
              ) : (
                enrollments.map((e) => (
                  <div key={e.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.course?.title}</div>
                        <div className="text-xs text-muted-foreground">{e.course?.instructor} · {e.course?.duration_hours}h</div>
                      </div>
                      {e.completed ? <Badge variant="secondary" className="text-success">Completed</Badge> : <Badge variant="outline">{e.progress}%</Badge>}
                    </div>
                    <Progress value={e.progress} className="mt-3 h-2" />
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => setViewCourse({ course: e.course, enrollment: e })}>
                        <Play className="mr-2 h-3.5 w-3.5" /> {e.completed ? 'Review' : 'Continue'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CourseView({ course, enrollment, onBack }: { course: Course; enrollment: Enrollment | null; onBack: () => void }) {
  const { user } = useAuth();
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progress, setProgress] = React.useState<Record<string, boolean>>({});
  const [activeLesson, setActiveLesson] = React.useState<Lesson | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [toggling, setToggling] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const [lRes, pRes] = await Promise.all([
        supabase.from('course_lessons').select('*').eq('course_id', course.id).order('display_order', { ascending: true }),
        user ? supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user.id).in('lesson_id', (await supabase.from('course_lessons').select('id').eq('course_id', course.id)).data?.map((l: { id: string }) => l.id) ?? []) : Promise.resolve({ data: [], error: null }),
      ]);
      const lessonList = (lRes.data ?? []) as Lesson[];
      setLessons(lessonList);
      const map: Record<string, boolean> = {};
      ((pRes.data ?? []) as LessonProgressRow[]).forEach((r) => { map[r.lesson_id] = r.completed; });
      setProgress(map);
      if (lessonList.length > 0) setActiveLesson(lessonList[0]);
      setLoading(false);
    })();
  }, [course.id, user]);

  const completedCount = lessons.filter((l) => progress[l.id]).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  async function toggleComplete(lesson: Lesson) {
    if (!user || !enrollment) return;
    setToggling(true);
    const isDone = !!progress[lesson.id];
    if (isDone) {
      await supabase.from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', lesson.id);
    } else {
      await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' });
    }
    const newMap = { ...progress, [lesson.id]: !isDone };
    setProgress(newMap);
    const newCompleted = lessons.filter((l) => newMap[l.id]).length;
    const newPct = lessons.length > 0 ? Math.round((newCompleted / lessons.length) * 100) : 0;
    await supabase.from('enrollments').update({ progress: newPct, completed: newPct === 100, completed_at: newPct === 100 ? new Date().toISOString() : null }).eq('id', enrollment.id);
    setToggling(false);
    toast.success(!isDone ? (newPct === 100 ? 'Course completed!' : 'Lesson marked complete') : 'Lesson unmarked');
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2"><ArrowLeft className="mr-2 h-4 w-4" /> Back to courses</Button>

      <PageHeader title={course.title} description={course.description ?? ''} />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-lg">Your progress</CardTitle>
          <CardDescription>{completedCount} of {lessons.length} lessons complete · {pct}%</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={pct} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="border-border/60 h-fit">
          <CardHeader><CardTitle className="font-display text-lg">Lessons</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {lessons.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setActiveLesson(l)}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors ${activeLesson?.id === l.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
              >
                <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${progress[l.id] ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/40'}`}>
                  {progress[l.id] ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{l.duration_minutes}min</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          {activeLesson ? (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl">{activeLesson.title}</CardTitle>
                <CardDescription className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {activeLesson.duration_minutes} minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{activeLesson.content}</p>
                {enrollment ? (
                  <Button onClick={() => toggleComplete(activeLesson)} disabled={toggling}>
                    {toggling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : progress[activeLesson.id] ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
                    {progress[activeLesson.id] ? 'Completed — Mark incomplete' : 'Mark as complete'}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Enroll to track your progress.</p>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent><EmptyState icon={BookOpen} title="No lessons" description="Lessons will appear here." /></CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
