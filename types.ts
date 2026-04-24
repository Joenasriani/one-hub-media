
export interface Tool {
  id: string;
  name: string;
  category: 'Creation' | 'Strategy' | 'Wildcard' | 'Misc';
  description: string;
  icon: string;
}

export interface ContextBrief {
  summary: string;
  headlines: { title: string; source: string; time: string }[];
  hashtags: string[];
}

export type BlogBlock = 
  | { type: 'heading'; content: string; level: number }
  | { type: 'paragraph'; content: string }
  | { type: 'quote'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'separator' };

export type ThemeAccent = 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose';

export type ToolOutput = 
  | { type: 'blog'; ideas: string[]; finalPost: { title: string; subtitle: string; blocks: BlogBlock[]; imageUrl: string } }
  | { type: 'storyboard'; scenes: { description: string; imageUrl: string }[] }
  | { type: 'audio'; topicOptions: string[]; script: string; audioUrl: string }
  | { type: 'ad'; imageUrl: string; headline: string; cta: string }
  | { type: 'podcaster'; characterA: string[]; characterB: string[] }
  | { type: 'gallery'; images: string[] } // Keep for generic use if needed
  | { type: 'text'; title: string; content: string }
  | { type: 'video'; videoUrl: string; duration: string }
  | { type: 'carousel'; slides: { title: string; content: string; color: string }[] }
  | { type: 'quiz'; questions: { q: string; options: string[]; answer: string }[] }
  | { type: 'email'; emails: { subject: string; body: string; type: string }[] }
  | { type: 'landing'; sections: { type: 'hero' | 'features' | 'social'; title: string; content: string }[] }
  | { type: 'strategy'; title: string; sections: { heading: string; items: string[] }[] }
  | { type: 'meme'; memes: { imageUrl: string; topText: string; bottomText: string }[] };

export interface MockResponse {
  toolId: string;
  data: ToolOutput;
}

export interface AppContextType {
  globalTopic: string;
  setGlobalContext: (topic: string) => void;
  themeAccent: ThemeAccent;
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
}
