'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, Loader2, LogOut, Moon, Palette, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/auth-provider';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notif, setNotif] = React.useState({ email: true, push: true, reminders: true });
  React.useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`notif_prefs_${user.id}`);
        if (saved) setNotif(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, [user]);
  const [saving, setSaving] = React.useState(false);

  async function handleSignOut() {
    await signOut();
    router.push('/auth/signin');
  }

  async function saveNotif() {
    if (!user) return;
    setSaving(true);
    try {
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(notif));
    } catch {
      // localStorage may be unavailable; preferences are session-only
    }
    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
    toast.success('Preferences saved');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg"><Palette className="h-5 w-5" /> Appearance</CardTitle>
            <CardDescription>Customize how SkillBridge looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Moon className="h-4 w-4" /><Label>Dark mode</Label></div>
              <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Choose what you want to hear about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Email notifications</Label>
              <Switch checked={notif.email} onCheckedChange={(c) => setNotif({ ...notif, email: c })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Push notifications</Label>
              <Switch checked={notif.push} onCheckedChange={(c) => setNotif({ ...notif, push: c })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Interview & deadline reminders</Label>
              <Switch checked={notif.reminders} onCheckedChange={(c) => setNotif({ ...notif, reminders: c })} />
            </div>
            <Button onClick={saveNotif} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save preferences
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg"><Shield className="h-5 w-5" /> Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Email</span><span>{user?.email}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Role</span><Badge variant="secondary" className="capitalize">{profile?.role?.replace('_', ' ')}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Member since</span><span>{profile ? new Date(profile.created_at).toLocaleDateString() : '—'}</span></div>
            <Button variant="destructive" onClick={handleSignOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
