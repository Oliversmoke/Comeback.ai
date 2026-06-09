class OpenAIProvider {
  constructor() {
    this.name = 'openai';
  }

  async initialize() {
    const { default: OpenAI } = await import('openai');
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async chat(messages, options = {}) {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature ?? 0.7,
    });
    return response.choices[0].message.content;
  }
}

class AnthropicProvider {
  constructor() {
    this.name = 'anthropic';
  }

  async initialize() {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(messages, options = {}) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options.model || 'claude-3-haiku-20240307',
      max_tokens: options.maxTokens || 500,
      system: systemMsg?.content,
      messages: userMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
    });
    return response.content[0].text;
  }
}

class GeminiProvider {
  constructor() {
    this.name = 'gemini';
  }

  async initialize() {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.client.getGenerativeModel({ model: options?.model || 'gemini-pro' });
  }

  async chat(messages, options = {}) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const history = chatMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg) return '';

    const chat = this.model.startChat({
      history,
      systemInstruction: systemMsg?.content,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 500,
        temperature: options.temperature ?? 0.7,
      },
    });

    const result = await chat.sendMessage(lastMsg.content);
    return result.response.text();
  }
}

class FallbackProvider {
  constructor() {
    this.name = 'fallback';
  }

  async initialize() {}

  async chat(messages, options = {}) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const combined = lastMsg;

    if (combined.includes('taskGenerator') || combined.includes('Generate daily tasks')) {
      return JSON.stringify([
        { title: 'Review and update your main goal progress', description: 'Spend 10 minutes reviewing what you accomplished yesterday', estimatedMinutes: 10, difficulty: 'easy', category: 'planning' },
        { title: 'Complete one focused work session', description: 'Use Pomodoro technique: 25 min work, 5 min break', estimatedMinutes: 30, difficulty: 'medium', category: 'productivity' },
        { title: 'Share a progress update with your group', description: 'Post what you learned or achieved today', estimatedMinutes: 5, difficulty: 'easy', category: 'social' },
      ]);
    }
    if (combined.includes('insight') || combined.includes('Insight')) {
      return JSON.stringify({
        insight: 'You tend to be most productive in the morning hours. Your completion rate increases by 40% when you schedule tasks before noon.',
        suggestion: 'Try scheduling your most important task for the first hour of your day.',
        encouragement: 'You have a 5-day streak! Keep the momentum going — consistency beats intensity.',
      });
    }
    return "Keep pushing forward! Remember: small daily improvements lead to massive results. Focus on your top priority today and celebrate each completed task.";
  }
}

const PROVIDER_MAP = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  fallback: FallbackProvider,
};

let activeProvider = null;

export const getAIProvider = () => {
  if (activeProvider) return activeProvider;
  return null;
};

export const initializeAI = async () => {
  const preferredProvider = process.env.AI_PROVIDER || 'openai';
  const ProviderClass = PROVIDER_MAP[preferredProvider];

  if (!ProviderClass) {
    console.warn(`Unknown AI provider "${preferredProvider}", falling back to mock responses`);
    activeProvider = new FallbackProvider();
    await activeProvider.initialize();
    return activeProvider;
  }

  const apiKey = process.env[`${preferredProvider.toUpperCase()}_API_KEY`];
  if (!apiKey) {
    console.warn(`No API key found for "${preferredProvider}", using fallback provider`);
    activeProvider = new FallbackProvider();
    await activeProvider.initialize();
    return activeProvider;
  }

  try {
    activeProvider = new ProviderClass();
    await activeProvider.initialize();
    console.log(`AI provider initialized: ${preferredProvider}`);
    return activeProvider;
  } catch (error) {
    console.warn(`Failed to initialize "${preferredProvider}": ${error.message}. Using fallback.`);
    activeProvider = new FallbackProvider();
    await activeProvider.initialize();
    return activeProvider;
  }
};

export const chat = async (messages, options = {}) => {
  const provider = getAIProvider();
  if (!provider) {
    const fallback = new FallbackProvider();
    await fallback.initialize();
    return fallback.chat(messages, options);
  }
  return provider.chat(messages, options);
};
