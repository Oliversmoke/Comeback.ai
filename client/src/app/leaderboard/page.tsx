'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Users, Zap, Flame, Crown } from 'lucide-react';
import { leaderboardAPI } from '@/lib/api';
import { AnimatedPage, FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '@/components/animations/MotionComponents';
import type { LeaderboardEntry, GroupLeaderboardEntry } from '@/types';

const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
const rankBgColors = ['bg-yellow-500/20', 'bg-gray-400/20', 'bg-orange-500/20'];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'users' | 'groups'>('users');
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [groups, setGroups] = useState<GroupLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [tab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const [boardRes, rankRes] = await Promise.all([
          leaderboardAPI.getUsers({ limit: '50' }),
          leaderboardAPI.getUserRank(),
        ]);
        setUsers(boardRes.data.data);
        setUserRank(rankRes.data.data);
      } else {
        const { data } = await leaderboardAPI.getGroups({ limit: '30' });
        setGroups(data.data);
      }
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <AnimatedPage>
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-dark-400 text-sm mt-1">See how you stack up</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn>
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTab('users')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              tab === 'users'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'bg-dark-800 text-dark-400 border border-dark-700'
            }`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              tab === 'groups'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'bg-dark-800 text-dark-400 border border-dark-700'
            }`}
          >
            <Trophy className="w-4 h-4" /> Groups
          </button>
        </div>
      </FadeIn>

      {userRank && tab === 'users' && (
        <ScaleIn>
          <div className="glass-card p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-sm text-dark-400">Your Rank</p>
                <p className="text-xl font-bold">#{userRank.rank} of {userRank.totalUsers}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-dark-400">Top {userRank.percentile}%</p>
              <div className="w-24 h-2 rounded-full bg-dark-700 mt-1">
                <motion.div
                  className="h-full rounded-full bg-primary-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - userRank.percentile}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </div>
        </ScaleIn>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <StaggerContainer className="space-y-2">
          {(tab === 'users' ? users : groups).slice(0, 3).map((entry: any, i: number) => (
            <StaggerItem key={entry.userId || entry.id}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`glass-card p-4 flex items-center gap-4 ${
                  i === 0 ? 'border-yellow-500/30' : i === 1 ? 'border-gray-400/20' : i === 2 ? 'border-orange-500/20' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${rankBgColors[i] || 'bg-dark-700'} flex items-center justify-center`}>
                  {i === 0 ? (
                    <Crown className={`w-5 h-5 ${rankColors[i]}`} />
                  ) : (
                    <Medal className={`w-5 h-5 ${rankColors[i] || 'text-dark-400'}`} />
                  )}
                </div>

                {tab === 'users' ? (
                  <>
                    <img
                      src={(entry as LeaderboardEntry).avatar}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{(entry as LeaderboardEntry).displayName || (entry as LeaderboardEntry).username}</p>
                      <div className="flex items-center gap-3 text-xs text-dark-400">
                        <span>Level {(entry as LeaderboardEntry).level}</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" /> {(entry as LeaderboardEntry).streak}d
                        </span>
                        <span>{(entry as LeaderboardEntry).completedTasks || 0} tasks</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-400">{(entry as LeaderboardEntry).xp.toLocaleString()}</p>
                      <p className="text-xs text-dark-400">XP</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{(entry as GroupLeaderboardEntry).name}</p>
                      <p className="text-xs text-dark-400">{(entry as GroupLeaderboardEntry).memberCount} members</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-400">{(entry as GroupLeaderboardEntry).totalXp.toLocaleString()}</p>
                      <p className="text-xs text-dark-400">Total XP</p>
                    </div>
                  </>
                )}
              </motion.div>
            </StaggerItem>
          ))}

          {/* Rest of entries (no special styling) */}
          {(tab === 'users' ? users : groups).slice(3).map((entry: any, i: number) => (
            <StaggerItem key={entry.userId || entry.id}>
              <motion.div
                whileHover={{ x: 4 }}
                className="glass-card-hover p-4 flex items-center gap-4"
              >
                <div className="w-8 text-center font-bold text-dark-400">#{i + 4}</div>

                {tab === 'users' ? (
                  <>
                    <img src={(entry as LeaderboardEntry).avatar} alt="" className="w-9 h-9 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{(entry as LeaderboardEntry).displayName || (entry as LeaderboardEntry).username}</p>
                      <p className="text-xs text-dark-400">Level {(entry as LeaderboardEntry).level}</p>
                    </div>
                    <span className="text-purple-400 font-semibold">{(entry as LeaderboardEntry).xp.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
                      <Users className="w-4 h-4 text-dark-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{(entry as GroupLeaderboardEntry).name}</p>
                      <p className="text-xs text-dark-400">{(entry as GroupLeaderboardEntry).memberCount} members</p>
                    </div>
                    <span className="text-purple-400 font-semibold">{(entry as GroupLeaderboardEntry).totalXp.toLocaleString()}</span>
                  </>
                )}
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </AnimatedPage>
  );
}
