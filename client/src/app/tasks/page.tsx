'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListTodo, Plus, CheckCircle2, Clock, Sparkles, Filter, Search, Zap, Trash2,
} from 'lucide-react';
import { tasksAPI, aiAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AnimatedPage, FadeIn, StaggerContainer, StaggerItem } from '@/components/animations/MotionComponents';
import { getPriorityColor, getStatusColor, formatTimeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Task } from '@/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const { updateXp, updateStreak } = useAuthStore();

  useEffect(() => { loadTasks(); }, [filter]);

  const loadTasks = async () => {
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filter !== 'all') params.status = filter;
      const { data } = await tasksAPI.list(params);
      setTasks(data.data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const completeTask = async (taskId: string) => {
    try {
      const { data } = await tasksAPI.complete(taskId);
      if (data.data.xp) updateXp(data.data.xp.totalXp, data.data.xp.level);
      if (data.data.streak) updateStreak(data.data.streak);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success(`Task completed! +${data.data.xp?.xpAwarded || 10}XP`);
    } catch { toast.error('Failed to complete task'); }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const generateAiTasks = async () => {
    setAiGenerating(true);
    try {
      await aiAPI.generateTasks();
      toast.success('AI tasks generated!');
      loadTasks();
    } catch { toast.error('Failed to generate'); }
    finally { setAiGenerating(false); }
  };

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatedPage>
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-dark-400 text-sm mt-1">Manage your daily tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={generateAiTasks}
              disabled={aiGenerating}
              whileHover={{ scale: 1.02 }}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Sparkles className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} />
              AI Generate
            </motion.button>
          </div>
        </div>
      </FadeIn>

      <FadeIn>
        <div className="flex flex-wrap gap-3 mb-6">
          {['all', 'pending', 'in_progress', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === s
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-500'
              }`}
            >
              {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 py-2 text-sm w-48"
            />
          </div>
        </div>
      </FadeIn>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">All clear!</h3>
          <p className="text-dark-400">No tasks in this category</p>
        </div>
      ) : (
        <StaggerContainer className="space-y-2">
          {filtered.map((task) => (
            <StaggerItem key={task._id}>
              <motion.div
                layout
                className="glass-card-hover p-4 flex items-center gap-4"
              >
                <button
                  onClick={() => completeTask(task._id)}
                  className="w-6 h-6 rounded-full border-2 border-dark-400 flex items-center justify-center hover:border-green-400 hover:bg-green-500/20 transition-all flex-shrink-0"
                >
                  <div className="w-3 h-3 rounded-full hover:bg-green-400 transition-colors" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-dark-400' : ''}`}>
                      {task.title}
                    </p>
                    {task.isAiGenerated && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  {task.description && (
                    <p className="text-xs text-dark-400 truncate mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    {task.goal && (
                      <span className="badge bg-dark-700 text-dark-300">{task.goal.title}</span>
                    )}
                    <span className="text-xs text-dark-400">{formatTimeAgo(task.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-purple-400 font-medium">+{task.xpReward}XP</span>
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </AnimatedPage>
  );
}
