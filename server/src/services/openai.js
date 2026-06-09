import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

const callOpenAI = async (messages, maxTokens = 500, temperature = 0.7) => {
  if (!openai) {
    return simulateResponse(messages);
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return simulateResponse(messages);
  }
};

const simulateResponse = (messages) => {
  const lastMsg = messages[messages.length - 1]?.content || '';
  if (lastMsg.includes('Generate daily tasks') || lastMsg.includes('taskGenerator')) {
    return JSON.stringify([
      { title: 'Review and update your main goal progress', description: 'Spend 10 minutes reviewing what you accomplished yesterday', estimatedMinutes: 10, difficulty: 'easy', category: 'planning' },
      { title: 'Complete one focused work session', description: 'Use Pomodoro technique: 25 min work, 5 min break', estimatedMinutes: 30, difficulty: 'medium', category: 'productivity' },
      { title: 'Share a progress update with your group', description: 'Post what you learned or achieved today', estimatedMinutes: 5, difficulty: 'easy', category: 'social' },
    ]);
  }
  if (lastMsg.includes('insight') || lastMsg.includes('Insight')) {
    return JSON.stringify({
      insight: 'You tend to be most productive in the morning hours. Your completion rate increases by 40% when you schedule tasks before noon.',
      suggestion: 'Try scheduling your most important task for the first hour of your day.',
      encouragement: 'You have a 5-day streak! Keep the momentum going — consistency beats intensity.',
    });
  }
  return "Keep pushing forward! Remember: small daily improvements lead to massive results. Focus on your top priority today and celebrate each completed task.";
};

export const generateDailyTasks = async (user, goals, recentTasks) => {
  const goalsSummary = goals.map((g) => `- ${g.title} (${g.status}, ${g.progress}% complete)`).join('\n');
  const tasksSummary = recentTasks.slice(-5).map((t) => `- ${t.title} (${t.status})`).join('\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.taskGenerator },
    { role: 'user', content: `User: ${user.username}\nCurrent streak: ${user.streak} days\nXP: ${user.xp}\nLevel: ${user.level}\n\nActive Goals:\n${goalsSummary || 'No active goals'}\n\nRecent Tasks:\n${tasksSummary || 'No recent tasks'}\n\nGenerate daily tasks.` },
  ];

  const response = await callOpenAI(messages, 500, 0.8);
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

  const response = await callOpenAI(messages, 300, 0.7);
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

  const response = await callOpenAI(messages, 300, 0.8);
  return response || 'Consider setting a group challenge to boost collective progress!';
};

export const chatWithCoach = async (user, message, context) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.coach },
    { role: 'user', content: `Context: ${JSON.stringify(context)}\nUser message: ${message}` },
  ];
  return callOpenAI(messages, 300, 0.7);
};
