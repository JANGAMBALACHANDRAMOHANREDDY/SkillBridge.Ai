'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  change?: number;
  changeLabel?: string;
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'chart';
  delay?: number;
}

const ACCENTS: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  chart: 'bg-chart-4/10 text-chart-4',
};

export function StatCard({ icon: Icon, label, value, change, changeLabel, accent = 'primary', delay = 0 }: StatCardProps) {
  const positive = (change ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-card-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', ACCENTS[accent])}>
              <Icon className="h-5 w-5" />
            </div>
            {typeof change === 'number' ? (
              <div className={cn('flex items-center gap-1 text-xs font-medium', positive ? 'text-success' : 'text-destructive')}>
                {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(change)}%
              </div>
            ) : null}
          </div>
          <div className="mt-4 font-display text-2xl font-bold">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{label}</div>
          {changeLabel ? <div className="mt-1 text-xs text-muted-foreground">{changeLabel}</div> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
