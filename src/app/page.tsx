"use client";

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { TaskList } from '@/components/task/TaskList';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useTask } from '@/contexts/TaskContext';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { Task } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, BarChart3, Clock } from 'lucide-react';

export default function HomePage() {
  const { setUserId } = useTask();
  const { setCurrentTask } = usePomodoro();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Set default user on mount
  useEffect(() => {
    setMounted(true);
    const defaultUserId = '6896489d2dab362ba354ecfd'; // Demo user ID
    setCurrentUserId(defaultUserId);
    setUserId(defaultUserId);
  }, [setUserId]);

  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId);
    setUserId(userId);
  };

  const handleStartPomodoro = (task: Task) => {
    setCurrentTask(task);
    // The user can then manually start the timer from the PomodoroTimer component
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background animate-pulse">
        <div className="h-14 bg-muted"></div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentUserId={currentUserId}
        onUserChange={handleUserChange}
      />

      <main className="container mx-auto px-4 py-4">
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="timer" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Content - Tasks */}
              <div className="lg:col-span-2">
                <TaskList onStartPomodoro={handleStartPomodoro} />
              </div>

              {/* Sidebar - Pomodoro Timer */}
              <div className="lg:col-span-1">
                <div className="sticky top-16">
                  <PomodoroTimer />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-3">
            <AnalyticsDashboard userId={currentUserId} />
          </TabsContent>

          <TabsContent value="timer" className="space-y-3">
            <div className="max-w-md mx-auto">
              <PomodoroTimer />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}