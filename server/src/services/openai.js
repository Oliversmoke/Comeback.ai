import { chat } from './ai/providers.js';

const SYSTEM_PROMPTS = {
  coach: `You are an expert productivity coach in a social productivity app. 
    Analyze user goals, generate personalized daily tasks, and provide motivational insights.
    Adapt recommendations based on group progress and individual performance.
    Be encouraging but honest. Use data-driven insights. Keep responses concise (2-3 sentences).`,

  taskGenerator: `Generate 3-5 specific, actionable daily tasks based on the user's goals.
    Tasks should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound).
    Return as JSON array with fields: title, description, estimatedMinutes, difficulty, category.
    Consider the user's current progress, streaks, and overdue tasks.`,

  insightGenerator: `Analyze the user's productivity data and generate:
    1. One key insight about their patterns
    2. One specific suggestion for improvement
    3. One encouragement based on their progress
    Return as JSON with fields: insight, suggestion, encouragement.`,
};

export const generateDailyTasks = async (user, goals, recentTasks) => {
  const goalsSummary = goals.map((g) => `- ${g.title} (${g.status}, ${g.progress}% complete)`).join('\n');
  const tasksSummary = recentTasks.slice(-5).map((t) => `- ${t.title} (${t.status})`).join('\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.taskGenerator },
    { role: 'user', content: `User: ${user.username}\nCurrent streak: ${user.streak} days\nXP: ${user.xp}\nLevel: ${user.level}\n\nActive Goals:\n${goalsSummary || 'No active goals'}\n\nRecent Tasks:\n${tasksSummary || 'No recent tasks'}\n\nGenerate daily tasks.` },
  ];

  const response = await chat(messages, { maxTokens: 500, temperature: 0.8 });
  try {
    const tasks = JSON.parse(response);
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [{
      title: 'Review your goals for today',
      description: response.slice(0, 200),
      estimatedMinutes: 10,
      difficulty: 'easy',
      category: 'planning',
    }];
  }
};

export const generateInsights = async (user, goals, tasks, groupData) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.insightGenerator },
    { role: 'user', content: `User: ${user.username}\nLevel: ${user.level}\nXP: ${user.xp}\nStreak: ${user.streak} days\nCompleted tasks: ${user.completedTasks}\n\nActive Goals: ${goals.length}\nPending Tasks: ${tasks.filter((t) => t.status === 'pending').length}\nCompleted Today: ${tasks.filter((t) => t.status === 'completed' && new Date(t.updatedAt).toDateString() === new Date().toDateString()).length}\n\nMember of ${groupData?.groupCount || 0} groups.` },
  ];

  const response = await chat(messages, { maxTokens: 300, temperature: 0.7 });
  try {
    return JSON.parse(response);
  } catch {
    return {
      insight: 'Consistency is your superpower. Keep showing up every day.',
      suggestion: 'Try breaking larger goals into smaller daily actions.',
      encouragement: `You're doing great! Every task completed is a step toward your goals.`,
    };
  }
};

export const adaptTasksForGroup = async (group, members, goals) => {
  const messages = [
    { role: 'system', content: `You are a group productivity coach. Analyze the group's collective progress and suggest adaptive tasks. Focus on collaboration and mutual growth.` },
    { role: 'user', content: `Group: ${group.name}\nMembers: ${members.length}\nTotal XP: ${group.totalXp}\nStreak: ${group.streak}\n\nMember Goals: ${goals.slice(0, 10).map((g) => g.title).join(', ')}\n\nSuggest 2 collaborative tasks.` },
  ];

  const response = await chat(messages, { maxTokens: 300, temperature: 0.8 });
  return response || 'Consider setting a group challenge to boost collective progress!';
};

export const chatWithCoach = async (user, message, context) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.coach },
    { role: 'user', content: `Context: ${JSON.stringify(context)}\nUser message: ${message}` },
  ];
  return chat(messages, { maxTokens: 300, temperature: 0.7 });
};
