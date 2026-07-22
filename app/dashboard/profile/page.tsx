'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const [form, setForm] = React.useState({
    full_name: '',
    headline: '',
    bio: '',
    phone: '',
    location: '',
    college: '',
    graduation_year: '',
    major: '',
    target_role: '',
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        college: profile.college ?? '',
        graduation_year: profile.graduation_year ? String(profile.graduation_year) : '',
        major: profile.major ?? '',
        target_role: profile.target_role ?? '',
        skills: profile.skills ?? [],
      });
    }
  }, [profile]);

  async function save() {
    setSaving(true);
    const completion = Math.min(100, Math.round(
      [
        form.full_name, form.headline, form.bio, form.phone, form.location,
        form.college, form.graduation_year, form.major, form.target_role,
        form.skills.length >= 3 ? 'x' : '',
      ].filter(Boolean).length / 10 * 100,
    ));
    const { error } = await updateProfile({
      full_name: form.full_name || null,
      headline: form.headline || null,
      bio: form.bio || null,
      phone: form.phone || null,
      location: form.location || null,
      college: form.college || null,
      graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
      major: form.major || null,
      target_role: form.target_role || null,
      skills: form.skills,
      profile_completion: completion,
    });
    setSaving(false);
    if (error) { toast.error(error); return; }
    toast.success('Profile updated');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Keep your profile up to date for better matches and recommendations."
        actions={<Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save changes</Button>}
      />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><UserIcon className="h-5 w-5" /> Profile completion</CardTitle>
          <CardDescription>{profile?.profile_completion ?? 0}% complete</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={profile?.profile_completion ?? 0} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader><CardTitle className="font-display text-lg">Basic info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Headline</Label><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Final-year CS student @ IIT Madras" /></div>
            <div className="space-y-2"><Label>Bio</Label><Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle className="font-display text-lg">Academic & career</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>College</Label><Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Graduation year</Label><Input type="number" value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} /></div>
              <div className="space-y-2"><Label>Major</Label><Input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Target role</Label><Input value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} placeholder="e.g. SDE Intern" /></div>
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {form.skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">{s}<button onClick={() => setForm({ ...form, skills: form.skills.filter((_, idx) => idx !== i) })} className="ml-1">×</button></Badge>
                ))}
              </div>
              <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Type a skill and press Enter" onKeyDown={(e) => {
                if (e.key === 'Enter' && skillInput.trim()) {
                  e.preventDefault();
                  setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
                  setSkillInput('');
                }
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Save changes</Button>
      </div>
    </div>
  );
}
