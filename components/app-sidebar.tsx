'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Code2,
  FileText,
  FolderGit2,
  GraduationCap,
  Home,
  LayoutDashboard,
  MessageSquare,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

export const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/resume', label: 'Resume Builder', icon: FileText },
  { href: '/dashboard/interviews', label: 'Mock Interviews', icon: MessageSquare },
  { href: '/dashboard/coding', label: 'Coding Tracker', icon: Code2 },
  { href: '/dashboard/internships', label: 'Internships', icon: Briefcase },
  { href: '/dashboard/learning', label: 'Learning Hub', icon: BookOpen },
  { href: '/dashboard/assessments', label: 'Assessments', icon: Target },
  { href: '/dashboard/projects', label: 'Project Hub', icon: FolderGit2 },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export const RECRUITER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/internships', label: 'Internships', icon: Briefcase },
  { href: '/dashboard/candidates', label: 'Candidates', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export const PLACEMENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', icon: GraduationCap },
  { href: '/dashboard/internships', label: 'Drives', icon: Building2 },
  { href: '/dashboard/analytics', label: 'Reports', icon: BarChart3 },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Users', icon: Users },
  { href: '/dashboard/internships', label: 'Companies', icon: Building2 },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const nav = profile?.role === 'recruiter' ? RECRUITER_NAV
    : profile?.role === 'placement_officer' ? PLACEMENT_NAV
    : profile?.role === 'admin' ? ADMIN_NAV
    : STUDENT_NAV;

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-md lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-bold">SkillBridge</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-3">
        <div className="rounded-lg bg-gradient-to-br from-primary/15 to-chart-4/15 p-4">
          <Trophy className="h-5 w-5 text-warning" />
          <div className="mt-2 text-sm font-semibold">Go Pro</div>
          <p className="mt-1 text-xs text-muted-foreground">Unlock unlimited mock interviews and AI coach.</p>
          <Link href="/#pricing" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
            Upgrade now →
          </Link>
        </div>
      </div>
    </aside>
  );
}
