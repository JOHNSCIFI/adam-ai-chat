export interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  isNew?: boolean;
  route: string;
  type?: 'free' | 'pro';
}

export const aiModels: AIModel[] = [
  {
    id: 'openai-gpt-4o-mini',
    name: 'OpenAI GPT-4o mini',
    description: 'Fast and efficient OpenAI model for everyday tasks',
    icon: 'openai',
    route: '/openai-gpt-4o-mini',
    type: 'free'
  },
  {
    id: 'openai-gpt-4o',
    name: 'OpenAI GPT-4o',
    description: 'Access to OpenAI\'s powerful GPT-4o model for complex tasks',
    icon: 'openai',
    route: '/openai-gpt-4o',
    type: 'pro'
  },
  {
    id: 'openai-gpt-4-1',
    name: 'OpenAI GPT-4.1',
    description: 'The flagship GPT-4 model for reliable and accurate responses',
    icon: 'openai',
    route: '/openai-gpt-4-1',
    type: 'pro'
  },
  {
    id: 'openai-gpt-5',
    name: 'OpenAI GPT-5',
    description: 'OpenAI\'s most advanced and powerful AI model',
    icon: 'openai',
    route: '/openai-gpt-5',
    type: 'pro',
    isNew: true
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    description: 'Anthropic\'s most capable and intelligent AI model',
    icon: 'claude',
    route: '/claude-opus-4',
    type: 'pro',
    isNew: true
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    description: 'High-performance Claude model with exceptional reasoning',
    icon: 'claude',
    route: '/claude-sonnet-4',
    type: 'pro',
    isNew: true
  },
  {
    id: 'deepseek-v31-terminus',
    name: 'DeepSeek-V3.1 Terminus',
    description: 'Advanced AI model great for most questions and tasks',
    icon: 'deepseek',
    route: '/deepseek-v31-terminus',
    type: 'pro',
    isNew: true
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    description: 'Latest DeepSeek model with enhanced reasoning capabilities',
    icon: 'deepseek',
    route: '/deepseek-r1',
    type: 'pro',
    isNew: true
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google\'s latest and most capable AI for a wide range of tasks',
    icon: 'gemini',
    route: '/gemini-2-5-flash',
    type: 'pro',
    isNew: true
  },
  {
    id: 'grok-4',
    name: 'Grok-4',
    description: 'Advanced AI model for tackling intricate challenges',
    icon: 'grok',
    route: '/grok-4',
    type: 'pro'
  }
];

// Legacy model mappings for backward compatibility
export const legacyModelMappings = {
  'gpt-4o-mini': 'openai-gpt-4o-mini',
  'gpt-4o': 'openai-gpt-4o',
  'gpt-5': 'openai-gpt-5',
  'claude': 'claude-opus-4',
  'deepseek': 'deepseek-v31-terminus',
  'gemini': 'gemini-2-5-flash'
};

// Get models in the legacy format for backward compatibility
export const getLegacyModels = () => {
  return [
    { id: 'gpt-4o-mini', name: 'OpenAI GPT-4o mini', description: "OpenAI's Fastest Model", type: 'free' },
    { id: 'gpt-4o', name: 'OpenAI GPT-4o', description: "OpenAI's Most Accurate Model", type: 'pro' },
    { id: 'gpt-5', name: 'OpenAI GPT-5', description: "OpenAI's Most Advanced Model", type: 'pro' },
    { id: 'claude', name: 'Claude', description: "Anthropic's latest AI model", type: 'pro' },
    { id: 'deepseek', name: 'DeepSeek', description: "Great for most questions", type: 'pro' },
    { id: 'gemini', name: 'Google Gemini', description: "Google's most capable AI", type: 'pro' }
  ];
};

// Get available models in the format expected by Index.tsx
export const getAvailableModels = () => {
  return [
    {
      id: 'gpt-4o-mini',
      name: 'OpenAI GPT-4o mini',
      description: 'GPT-4o mini, developed by OpenAI, stands as one of the most efficient AI models available.',
      icon: 'openai'
    },
    {
      id: 'gpt-4o',
      name: 'OpenAI GPT-4o',
      description: 'GPT-4o, OpenAI\'s newest flagship model, is designed for complex reasoning tasks.',
      icon: 'openai'
    },
    {
      id: 'gpt-5',
      name: 'OpenAI GPT-5',
      description: 'OpenAI\'s GPT-5 sets a new standard in artificial intelligence capabilities.',
      icon: 'openai'
    },
    {
      id: 'claude',
      name: 'Claude',
      description: 'Claude, Anthropic\'s advanced AI model, excels at detailed analysis and reasoning.',
      icon: 'claude'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'DeepSeek offers powerful AI capabilities for a wide range of applications.',
      icon: 'deepseek'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Gemini, Google\'s most advanced AI, is designed for multimodal understanding.',
      icon: 'gemini'
    }
  ];
};