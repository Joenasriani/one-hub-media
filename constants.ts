import { Tool, ToolOutput, ContextBrief, BlogBlock, ThemeAccent } from './types';

export const MOCK_AUDIO_BLOB = "https://actions.google.com/sounds/v1/science_fiction/computer_beeps.ogg";

export const TOOLS: Tool[] = [
  { id: 'blog-studio', name: 'Interactive Blog Studio', category: 'Creation', description: 'Draft a structured article and optional generated header image.', icon: 'PenTool', requiredCapabilities: ['text', 'image'] },
  { id: 'storyboard', name: 'Cinematic Storyboard', category: 'Creation', description: 'Turn a subject into a configurable sequence of storyboard frames.', icon: 'Film', requiredCapabilities: ['text', 'image'] },
  { id: 'podcast', name: 'Podcast Generator', category: 'Creation', description: 'Prepare a podcast outline and script when audio and TTS providers are configured.', icon: 'Mic', availableInFree: false, requiredCapabilities: ['audio', 'tts'] },
  { id: 'ad-creator', name: 'Ad Post Creator', category: 'Creation', description: 'Draft an advertising concept, headline, image prompt, and call to action.', icon: 'Megaphone', requiredCapabilities: ['text', 'image'] },
  { id: 'podcaster-shots', name: 'Podcaster Shots', category: 'Creation', description: 'Preview reference portrait combinations for podcast promotion layouts.', icon: 'Camera', requiredCapabilities: ['image'] },
  { id: 'landing-page', name: 'Landing Page Architect', category: 'Strategy', description: 'Draft a landing page structure around the supplied subject.', icon: 'Layout', requiredCapabilities: ['text'] },
  { id: 'campaign-master', name: 'Campaign Targeting Master', category: 'Strategy', description: 'Draft audience hypotheses and messaging angles for review.', icon: 'Target', requiredCapabilities: ['text', 'research'] },
  { id: 'email-sequence', name: 'Email Sequence Builder', category: 'Strategy', description: 'Draft a three message email sequence around the supplied subject.', icon: 'Mail', requiredCapabilities: ['text'] },
  { id: 'meme-lord', name: 'The Meme Lord', category: 'Wildcard', description: 'Generate meme concepts and image prompts around the supplied subject.', icon: 'Smile', requiredCapabilities: ['text', 'image'] },
  { id: 'devils-advocate', name: 'The Devil\'s Advocate', category: 'Wildcard', description: 'Generate skeptical counterpoints and weaknesses to inspect.', icon: 'AlertTriangle', requiredCapabilities: ['text'] },
  { id: 'quiz-magnet', name: 'The Quiz Magnet', category: 'Wildcard', description: 'Create a draft quiz structure that requires fact checking before publication.', icon: 'HelpCircle', requiredCapabilities: ['text'] },
  { id: 'short-video', name: 'Short Video Generator', category: 'Misc', description: 'Video generation requires a configured external video provider.', icon: 'Video', availableInFree: false, requiredCapabilities: ['video'] },
  { id: 'carousel', name: 'LinkedIn/IG Carousel', category: 'Misc', description: 'Draft a short slide sequence with copy and optional image prompts.', icon: 'Layers', requiredCapabilities: ['text', 'image'] },
];

export const sanitizeText = (text: string): string => {
  if (!text) return '';
  const forbidden = /(Delve|Dive|Embark|Unlock|Unleash|Realm|Tapestry|Game-changer)/gi;
  let clean = text.replace(forbidden, '');
  clean = clean.replace(/[*#_]/g, '');
  clean = clean.replace(/<(?!\/?(strong|em|br))[^>]+>/gi, '');
  return clean.trim();
};

interface InferredContext {
  subject: string;
  keywords: string;
  theme: ThemeAccent;
}

export const inferSubject = (input: string): InferredContext => {
  const lower = input.toLowerCase();

  if (lower.includes('robo') || lower.includes('bot') || lower.includes('autom')) {
    return {
      subject: 'Robotics and Automation',
      keywords: 'robotics,automation,industrial robot,workshop,sensors',
      theme: 'cyan'
    };
  }

  if (lower.includes('ai') || lower.includes('tech') || lower.includes('software')) {
    return {
      subject: 'Technology',
      keywords: 'software,computer,interface,data,technology',
      theme: 'violet'
    };
  }

  if (lower.includes('nike') || lower.includes('sport') || lower.includes('run') || lower.includes('fit')) {
    return {
      subject: 'Athletic Performance',
      keywords: 'fitness,running,gym,athlete,training',
      theme: 'rose'
    };
  }

  if (lower.includes('coffee') || lower.includes('brew') || lower.includes('cafe') || lower.includes('food')) {
    return {
      subject: 'Coffee and Food',
      keywords: 'coffee,cafe,barista,food,table',
      theme: 'amber'
    };
  }

  if (lower.includes('health') || lower.includes('nature') || lower.includes('eco') || lower.includes('plant')) {
    return {
      subject: 'Health and Environment',
      keywords: 'plant,nature,forest,health,environment',
      theme: 'emerald'
    };
  }

  if (lower.includes('space') || lower.includes('mars') || lower.includes('rocket')) {
    return {
      subject: 'Space',
      keywords: 'space,rocket,mars,astronaut,stars',
      theme: 'violet'
    };
  }

  const safeInput = sanitizeText(input);
  return {
    subject: safeInput || 'Untitled Subject',
    keywords: safeInput || 'abstract,subject',
    theme: 'cyan'
  };
};

export const getTheme = (topic: string): ThemeAccent => inferSubject(topic).theme;

const DEMO_CONTEXT_LOOKUP: Record<string, ContextBrief> = {
  robot: {
    summary: 'Demo context only. A live research provider has not supplied current robotics reporting for this fallback response.',
    headlines: [
      { title: 'Example robotics headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example automation headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example sensing headline for layout testing', source: 'Demo data', time: 'not live' }
    ],
    hashtags: ['#Robotics', '#Automation']
  },
  athletic: {
    summary: 'Demo context only. No current sports reporting is asserted by this fallback response.',
    headlines: [
      { title: 'Example training headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example equipment headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example performance headline for layout testing', source: 'Demo data', time: 'not live' }
    ],
    hashtags: ['#Training', '#Sport']
  },
  coffee: {
    summary: 'Demo context only. No current coffee market or health claim is asserted by this fallback response.',
    headlines: [
      { title: 'Example coffee market headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example cafe culture headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example brewing headline for layout testing', source: 'Demo data', time: 'not live' }
    ],
    hashtags: ['#Coffee', '#Cafe']
  },
  space: {
    summary: 'Demo context only. No current launch, contract, or mission status is asserted by this fallback response.',
    headlines: [
      { title: 'Example launch headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example spacecraft headline for layout testing', source: 'Demo data', time: 'not live' },
      { title: 'Example mission headline for layout testing', source: 'Demo data', time: 'not live' }
    ],
    hashtags: ['#Space', '#Spaceflight']
  }
};

export const getMockBrief = (context: string): ContextBrief => {
  const { subject } = inferSubject(context);
  const lowerSubject = subject.toLowerCase();
  const knownKey = Object.keys(DEMO_CONTEXT_LOOKUP).find(key => lowerSubject.includes(key));

  if (knownKey) return DEMO_CONTEXT_LOOKUP[knownKey];

  return {
    summary: sanitizeText(`Demo context for ${subject}. This fallback contains placeholder material only and must not be presented as live research.`),
    headlines: [
      { title: sanitizeText(`Example ${subject} headline A`), source: 'Demo data', time: 'not live' },
      { title: sanitizeText(`Example ${subject} headline B`), source: 'Demo data', time: 'not live' },
      { title: sanitizeText(`Example ${subject} headline C`), source: 'Demo data', time: 'not live' }
    ],
    hashtags: [`#${subject.replace(/\s/g, '')}`, '#Draft']
  };
};

export const generateImageURL = (safeKeywords: string, width: number, height: number, seed: number) => {
  const cleanKeywords = safeKeywords.replace(/[./]/g, ' ');
  const encoded = encodeURIComponent(cleanKeywords);
  return `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=flux`;
};

export const CHARACTER_A_IDS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'
];

export const CHARACTER_B_IDS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80'
];

const generateDraftBlog = (subject: string): BlogBlock[] => [
  { type: 'paragraph', content: sanitizeText(`This is a draft article structure for ${subject}. Statements that depend on external facts need source verification before publication.`) },
  { type: 'separator' },
  { type: 'heading', content: sanitizeText(`Define the ${subject} question`), level: 2 },
  { type: 'paragraph', content: sanitizeText(`Start by stating the problem, intended audience, constraints, and the evidence that would be needed to support factual claims about ${subject}.`) },
  { type: 'heading', content: 'Points to investigate', level: 3 },
  { type: 'list', items: [
    sanitizeText(`What is already established about ${subject}?`),
    sanitizeText(`Which claims about ${subject} require current sources?`),
    sanitizeText(`Which assumptions should be tested before making a recommendation?`)
  ]},
  { type: 'heading', content: 'Publication check', level: 2 },
  { type: 'paragraph', content: 'Replace placeholder statements with verified evidence, named sources, dates, and appropriate uncertainty before publishing.' }
];

export const getMockData = (toolId: string, context: string, options?: any): ToolOutput => {
  const seed = Math.floor(Math.random() * 10000);
  const { subject, keywords } = inferSubject(context);

  switch (toolId) {
    case 'blog-studio':
      return {
        type: 'blog',
        ideas: [
          sanitizeText(`${subject}: questions worth investigating`),
          sanitizeText(`${subject}: evidence and assumptions`),
          sanitizeText(`${subject}: practical decision framework`)
        ],
        finalPost: {
          title: sanitizeText(`${subject}: Draft Working Article`),
          subtitle: 'Demo copy. Verify external claims before publication.',
          imageUrl: generateImageURL(`Editorial header for ${subject}, ${keywords}`, 1200, 600, seed),
          blocks: generateDraftBlog(subject)
        }
      };

    case 'storyboard': {
      const count = options?.frameCount || 4;
      const scenes = Array.from({ length: count }).map((_, i) => ({
        description: sanitizeText(`Frame ${i + 1}: a visual beat exploring ${subject}. This is generated concept copy, not a factual claim.`),
        imageUrl: generateImageURL(`Storyboard frame ${i + 1} about ${subject}, ${keywords}`, 800, 450, seed + i)
      }));
      return { type: 'storyboard', scenes };
    }

    case 'podcast':
      return {
        type: 'audio',
        topicOptions: [
          sanitizeText(`${subject}: what is known?`),
          sanitizeText(`${subject}: competing interpretations`),
          sanitizeText(`${subject}: questions for a specialist`)
        ],
        script: sanitizeText(`HOST: "Today we are examining ${subject}. This draft needs fact checking and source review before publication."\n\nGUEST: "Start with what is established, then separate evidence from assumptions."`),
        audioUrl: MOCK_AUDIO_BLOB
      };

    case 'ad-creator':
      return {
        type: 'ad',
        imageUrl: generateImageURL(`Advertising concept for ${subject}, ${keywords}`, 1080, 1920, seed),
        headline: sanitizeText(`${subject}, stated clearly`),
        cta: 'Learn More'
      };

    case 'podcaster-shots':
      return { type: 'podcaster', characterA: CHARACTER_A_IDS, characterB: CHARACTER_B_IDS };

    case 'landing-page':
      return {
        type: 'landing',
        sections: [
          { type: 'hero', title: sanitizeText(subject), content: 'State the offer, audience, and concrete value without invented rankings or user counts.' },
          { type: 'features', title: 'What it includes', content: 'List only implemented features and explicitly mark planned functionality.' },
          { type: 'social', title: 'Evidence', content: 'Add verified testimonials, case studies, or usage data only when a source exists.' }
        ]
      };

    case 'campaign-master':
      return {
        type: 'strategy',
        title: 'Audience Hypotheses',
        sections: [
          { heading: 'Possible audience', items: ['Define the real buyer or user', 'Separate observed data from assumptions'] },
          { heading: 'Research needed', items: [sanitizeText(`Validate demand around ${subject}`), 'Check competing offers', 'Test language with target users'] },
          { heading: 'Messaging test', items: ['Problem clarity', 'Specific outcome', 'Evidence required'] }
        ]
      };

    case 'email-sequence':
      return {
        type: 'email',
        emails: [
          { type: 'Message 1', subject: sanitizeText(`${subject}: introduction`), body: sanitizeText(`Hi [Name],\n\nThis is a draft introduction to ${subject}. Replace placeholders with verified details before sending.`) },
          { type: 'Message 2', subject: sanitizeText(`${subject}: one concrete question`), body: sanitizeText(`Hi [Name],\n\nHere is one specific question about ${subject} that may be relevant to your work.`) },
          { type: 'Message 3', subject: sanitizeText(`${subject}: follow up`), body: sanitizeText(`Hi [Name],\n\nFollowing up with the relevant context and next step for ${subject}.`) }
        ]
      };

    case 'meme-lord':
      return {
        type: 'meme',
        memes: [
          { imageUrl: generateImageURL(`Meme concept about ${subject}, ${keywords}`, 500, 500, seed + 10), topText: 'Expectation', bottomText: sanitizeText(`${subject} in one slide`) },
          { imageUrl: generateImageURL(`Meme concept about ${subject}, ${keywords}`, 500, 500, seed + 11), topText: 'Reality', bottomText: 'Check the assumptions first' },
          { imageUrl: generateImageURL(`Meme concept about ${subject}, ${keywords}`, 500, 500, seed + 12), topText: 'Before publishing', bottomText: 'Where is the source?' }
        ]
      };

    case 'devils-advocate':
      return {
        type: 'strategy',
        title: 'Counterargument Pass',
        sections: [
          { heading: 'Differentiation', items: [sanitizeText(`What makes this ${subject} approach materially different?`)] },
          { heading: 'Evidence', items: ['Which statements are supported and which are assumptions?'] },
          { heading: 'Next test', items: [sanitizeText(`Identify the cheapest test that could disprove the current ${subject} hypothesis.`)] }
        ]
      };

    case 'quiz-magnet':
      return {
        type: 'quiz',
        questions: [
          { q: sanitizeText(`Which statement about ${subject} is supported by the source material?`), options: ['Option A', 'Option B', 'Option C', 'Insufficient evidence'], answer: 'Insufficient evidence' },
          { q: 'What should happen before publishing a numerical claim?', options: ['Add a source', 'Guess a range', 'Repeat it', 'Remove context'], answer: 'Add a source' },
          { q: 'What should a draft label make clear?', options: ['That content is provisional', 'That it is proven', 'That it is official', 'That it is certified'], answer: 'That content is provisional' }
        ]
      };

    case 'short-video':
      return {
        type: 'video',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        duration: '00:15'
      };

    case 'carousel':
      return {
        type: 'carousel',
        slides: [
          { title: sanitizeText(subject.toUpperCase()), content: 'Draft carousel', color: 'bg-indigo-600' },
          { title: 'Question', content: sanitizeText(`What is actually established about ${subject}?`), color: 'bg-blue-600' },
          { title: 'Evidence', content: generateImageURL(`Editorial evidence slide for ${subject}, ${keywords}`, 800, 1000, seed), color: 'bg-teal-600' },
          { title: 'Assumptions', content: 'Mark assumptions before turning them into claims.', color: 'bg-teal-600' },
          { title: 'Verification', content: 'Attach sources and dates to factual statements.', color: 'bg-emerald-600' },
          { title: 'Next Step', content: 'Publish only after the evidence pass.', color: 'bg-slate-800' }
        ]
      };

    default:
      return { type: 'text', title: 'Not implemented', content: 'This tool does not have a fallback implementation.' };
  }
};
