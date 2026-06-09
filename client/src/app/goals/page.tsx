'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Filter, Search, MoreVertical, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { goalsAPI } from '@/lib/api';
import { AnimatedPage, FadeIn, StaggerContainer, StaggerItem } from '@/components/animations/MotionComponents';
import { getCategoryColor, getStatusColor, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Goal } from '@/types';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  useEffect(() => { loadGoals(); }, [filter]);

  const loadGoals = async () => {
    try {
      const { data } = await goalsAPI.list({ status: filter, limit: '50' });
      setGoals(data.data);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  const deleteGoal = async (id: string) => {
    try {
      await goalsAPI.delete(id);
      setGoals((prev) => prev.filter((g) => g._id !== id));
      toast.success('Goal deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = goals.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatedPage>
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Goals</h1>
            <p className="text-dark-400 text-sm mt-1">Track and achieve what matters</p>
          </div>
          <Link href="/goals/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Goal
          </Link>
        </div>
      </FadeIn>

      <FadeIn>
        <div className="flex flex-wrap gap-3 mb-6">
          {['active', 'paused', 'completed', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === s
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-500'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search goals..."
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
          <Target className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No goals yet</h3>
          <p className="text-dark-400 mb-4">Create your first goal to get started</p>
          <Link href="/goals/new" className="btn-primary">Create Goal</Link>
        </div>
      ) : (
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((goal) => (
            <StaggerItem key={goal._id}>
              <motion.div
                whileHover={{ y: -2 }}
                className="glass-card-hover p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${goal.progress >= 100 ? 'bg-green-400' : 'bg-primary-400'}`} />
                    <span className={`badge ${getCategoryColor(goal.category)}`}>{goal.category}</span>
                  </div>
                  <div className="relative">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-dark-700">
                      <MoreVertical className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                </div>

                <Link href={`/goals/${goal._id}`}>
                  <h3 className="font-semibold mb-1 hover:text-primary-300 transition-colors">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-dark-400 line-clamp-2 mb-3">{goal.description}</p>
                  )}
                </Link>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-dark-400 mb-1">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="xp-bar">
                    <motion.div
                      className="xp-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-dark-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(goal.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getStatusColor(goal.status)}`}>{goal.status}</span>
                    <span className="text-purple-400">{goal.milestones?.filter((m) => m.isCompleted).length}/{goal.milestones?.length} ms</span>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </AnimatedPage>
  );
}
