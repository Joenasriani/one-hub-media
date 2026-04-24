import { Tool, ToolOutput, ContextBrief, BlogBlock, ThemeAccent } from './types';

// EXACT Constant required by prompt
export const MOCK_AUDIO_BLOB = "https://actions.google.com/sounds/v1/science_fiction/computer_beeps.ogg";

export const TOOLS: Tool[] = [
  // Creation
  { id: 'blog-studio', name: 'Interactive Blog Studio', category: 'Creation', description: 'Generate viral blog posts with imagery.', icon: 'PenTool' },
  { id: 'storyboard', name: 'Cinematic Storyboard', category: 'Creation', description: 'Visualise scripts with 4-panel scenes.', icon: 'Film' },
  { id: 'podcast', name: 'Podcast Generator', category: 'Creation', description: 'Turn text into audio scripts & voice.', icon: 'Mic' },
  { id: 'ad-creator', name: 'Ad Post Creator', category: 'Creation', description: 'High-conversion social ads.', icon: 'Megaphone' },
  { id: 'podcaster-shots', name: 'Podcaster Shots', category: 'Creation', description: 'Studio-quality promo images.', icon: 'Camera' },
  
  // Strategy
  { id: 'landing-page', name: 'Landing Page Architect', category: 'Strategy', description: 'AIDA structured wireframes.', icon: 'Layout' },
  { id: 'campaign-master', name: 'Campaign Targeting Master', category: 'Strategy', description: 'Audience segmentation reports.', icon: 'Target' },
  { id: 'email-sequence', name: 'Email Sequence Builder', category: 'Strategy', description: 'Drip campaigns that convert.', icon: 'Mail' },
  
  // Wildcard
  { id: 'meme-lord', name: 'The Meme Lord', category: 'Wildcard', description: 'Viral humor concepts.', icon: 'Smile' },
  { id: 'devils-advocate', name: 'The Devil\'s Advocate', category: 'Wildcard', description: 'Ruthless critique of your ideas.', icon: 'AlertTriangle' },
  { id: 'quiz-magnet', name: 'The Quiz Magnet', category: 'Wildcard', description: 'Engagement quizzes.', icon: 'HelpCircle' },

  // Misc
  { id: 'short-video', name: 'Short Video Generator', category: 'Misc', description: 'Text-to-Video processing.', icon: 'Video' },
  { id: 'carousel', name: 'LinkedIn/IG Carousel', category: 'Misc', description: 'Slide deck generation.', icon: 'Layers' },
];

// TEXT ENGINE: SANITIZATION
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // 1. Filter Forbidden Vocabulary (Strict List from Prompt)
  const forbidden = /(Delve|Dive|Embark|Explore|Unlock|Unleash|Realm|Tapestry|Game-changer)/gi;
  let clean = text.replace(forbidden, (match) => {
    return ""; // Replace with empty string
  });

  // 2. Markdown Strip (*, #, _)
  clean = clean.replace(/[*#_]/g, '');

  // 3. HTML Allow-list check
  clean = clean.replace(/<(?!\/?(strong|em|br))[^>]+>/gi, '');

  return clean.trim();
};

// DEEP SUBJECT INFERENCE ENGINE
// Extracts the "Core Subject" from URLs or Brand names
interface InferredContext {
  subject: string;
  keywords: string; // The "Unsplash Safety" keywords
  theme: ThemeAccent;
}

export const inferSubject = (input: string): InferredContext => {
  const lower = input.toLowerCase();
  
  // Robotics / Tech / URL detection (e.g. robomarket.ae)
  if (lower.includes('robo') || lower.includes('bot') || lower.includes('ai') || lower.includes('autom') || lower.includes('.ae') || lower.includes('.com')) {
    if (lower.includes('robo') || lower.includes('.ae')) {
      return { 
        subject: 'Robotics & Automation', 
        keywords: 'robotics,cyborg,futuristic,lab,automation,technology', 
        theme: 'cyan' 
      };
    }
    if (lower.includes('tech')) {
      return { 
        subject: 'Emerging Technology', 
        keywords: 'server,code,data,future,network', 
        theme: 'violet' 
      };
    }
  }

  // Sports / Nike
  if (lower.includes('nike') || lower.includes('sport') || lower.includes('run') || lower.includes('fit')) {
    return { 
      subject: 'Athletic Performance', 
      keywords: 'fitness,running,gym,sneakers,athlete,workout', 
      theme: 'rose' 
    };
  }

  // Coffee / Food
  if (lower.includes('coffee') || lower.includes('brew') || lower.includes('cafe') || lower.includes('food')) {
    return { 
      subject: 'Modern Coffee Culture', 
      keywords: 'coffee,latte,barista,cafe,espresso,beans', 
      theme: 'amber' 
    };
  }

  // Nature / Health
  if (lower.includes('health') || lower.includes('nature') || lower.includes('eco') || lower.includes('plant')) {
    return { 
      subject: 'Sustainable Living', 
      keywords: 'forest,plant,sunlight,nature,leaf,organic', 
      theme: 'emerald' 
    };
  }

  // Space
  if (lower.includes('space') || lower.includes('mars') || lower.includes('rocket')) {
    return { 
      subject: 'Space Exploration', 
      keywords: 'space,rocket,mars,galaxy,astronaut,stars', 
      theme: 'violet' 
    };
  }

  // Default Fallback
  const safeInput = sanitizeText(input);
  return { 
    subject: safeInput || 'Innovation', 
    keywords: safeInput || 'abstract,technology', 
    theme: 'cyan' 
  };
};

export const getTheme = (topic: string): ThemeAccent => {
  return inferSubject(topic).theme;
};

// SMART KNOWLEDGE GRAPH (Real Data Simulation)
// Keys are based on INFERRED SUBJECTS or KEYWORDS (partial match)
const REAL_DATA_LOOKUP: Record<string, ContextBrief> = {
  "robot": {
    summary: "Robotics is an interdisciplinary branch of electronics and engineering. It involves the design, construction, operation, and use of robots.",
    headlines: [
      { title: "Boston Dynamics reveals Atlas 2.0: Now fully autonomous", source: "TechCrunch", time: "2h ago" },
      { title: "Tesla Optimus Gen 2 enters mass production phase", source: "Reuters", time: "5h ago" },
      { title: "AI-driven warehouse bots increase efficiency by 400%", source: "Wired", time: "8h ago" }
    ],
    hashtags: ["#Robotics", "#Automation", "#FutureTech", "#AI"]
  },
  "athletic": {
    summary: "The athletic industry is shifting towards sustainable materials and personalized data-driven performance gear.",
    headlines: [
      { title: "Nike unveils new carbon-neutral running line", source: "Hypebeast", time: "30m ago" },
      { title: "Smart fabrics are changing how athletes train", source: "ESPN", time: "6h ago" },
      { title: "Global marathon participation hits all-time high", source: "Runner's World", time: "12h ago" }
    ],
    hashtags: ["#JustDoIt", "#Performance", "#Fitness", "#Run"]
  },
  "coffee": {
    summary: "Coffee is a brewed drink prepared from roasted coffee beans, the seeds of berries from certain Coffea species. It is one of the most popular drinks in the world.",
    headlines: [
      { title: "Arabica prices surge to 12-year high amid global supply crunch", source: "Financial Times", time: "1h ago" },
      { title: "Study: Daily caffeine intake linked to increased longevity", source: "Healthline", time: "4h ago" },
      { title: "The rise of hyper-specialty fermentation in modern roasteries", source: "Sprudge", time: "10h ago" }
    ],
    hashtags: ["#SpecialtyCoffee", "#BaristaLife", "#ThirdWave", "#Brewing"]
  },
  "space": {
    summary: "Space Exploration Technologies Corp. is an American spacecraft manufacturer, launch service provider, and satellite communications company.",
    headlines: [
      { title: "Starship Flight 4: FAA License Pending for Next Launch", source: "SpaceNews", time: "2h ago" },
      { title: "Elon Musk outlines ambitious timeline for Mars colonization", source: "TechCrunch", time: "5h ago" },
      { title: "SpaceX secures massive Pentagon contract for satellite network", source: "Bloomberg", time: "8h ago" }
    ],
    hashtags: ["#Starship", "#Mars", "#Falcon9", "#SpaceX"]
  }
};

export const getMockBrief = (context: string): ContextBrief => {
  const { subject } = inferSubject(context);
  const lowerSub = subject.toLowerCase();
  
  // 1. Check Real Data Lookup using partial match on keys
  const knownKey = Object.keys(REAL_DATA_LOOKUP).find(k => lowerSub.includes(k));
  if (knownKey) {
    return REAL_DATA_LOOKUP[knownKey];
  }

  // 2. Fallback: Smart Template Generation (Simulating Real News)
  return {
    summary: sanitizeText(`Market analysis indicates ${subject} is experiencing a paradigm shift. Industry leaders are prioritizing innovation and scalability to meet growing global demand.`),
    headlines: [
      { title: sanitizeText(`Global markets react to new ${subject} regulations`), source: "International Business Times", time: "2h ago" },
      { title: sanitizeText(`Why experts are rethinking the future of ${subject}`), source: "The Atlantic", time: "5h ago" },
      { title: sanitizeText(`Top 10 innovations driving ${subject} forward`), source: "Fast Company", time: "9h ago" }
    ],
    hashtags: [`#${subject.replace(/\s/g, '')}`, `#FutureOf${subject.split(' ')[0]}`, `#Innovation`, `#Trending`]
  };
};

// Dynamic Image URL Generator (Unsplash Safety Valve)
// Uses "Safe Keywords" from inference, never the raw URL
export const generateImageURL = (safeKeywords: string, width: number, height: number, seed: number) => {
  // Double safety: Ensure no dots or slashes in keywords to prevent URL leakage
  const cleanKeywords = safeKeywords.replace(/[./]/g, ' ');
  const encoded = encodeURIComponent(cleanKeywords);
  return `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=flux`;
};

// CONSTANT Unsplash IDs for Podcaster Shots (ID Cheat)
export const CHARACTER_A_IDS = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80", 
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80"
];
export const CHARACTER_B_IDS = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80", 
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80"
];

const generateProfessionalBlog = (subject: string): BlogBlock[] => {
  return [
    // Introduction (APP Formula)
    { type: 'paragraph', content: sanitizeText(`If you've been paying attention to the latest trends in ${subject}, you know one thing for certain: the rules have changed. What worked six months ago is now obsolete.`) },
    { type: 'paragraph', content: sanitizeText(`But here is the good news: mastering this new landscape is easier than you think, provided you have the right roadmap. In this guide, we are going to break down exactly how to leverage ${subject} to gain a competitive edge.`) },
    { type: 'paragraph', content: sanitizeText(`By the end of this post, you will have a step-by-step strategy to implement immediately. Let's get started.`) },
    
    { type: 'separator' },

    // Deep Dive Section
    { type: 'heading', content: sanitizeText(`Why ${subject} Matters More Than Ever`), level: 2 },
    { type: 'paragraph', content: sanitizeText(`The data is undeniable. A recent industry study showed that organizations prioritizing ${subject} outperformed their competitors by 40% in Q4 alone. This isn't just a trend; it's a fundamental shift in market dynamics.`) },
    { type: 'paragraph', content: sanitizeText(`Consider the implications for your daily workflow. Efficiency isn't just about speed; it's about precision. ${subject} allows for a level of precision that was previously impossible.`) },

    // Actionable List
    { type: 'heading', content: 'Key Benefits at a Glance', level: 3 },
    { type: 'list', items: [
      sanitizeText(`Enhanced Scalability: ${subject} systems grow with you.`),
      sanitizeText(`Cost Reduction: Automate the mundane to focus on the strategic.`),
      sanitizeText(`Data Integrity: Make decisions based on facts, not guesses.`)
    ]},

    // Pitfalls Section
    { type: 'heading', content: sanitizeText(`Common Pitfalls in ${subject} Adoption`), level: 2 },
    { type: 'paragraph', content: sanitizeText(`However, it is not all smooth sailing. Many rush into execution without a clear strategy. The result? Wasted resources and frustration.`) },
    { type: 'quote', content: sanitizeText(`"The biggest mistake people make with ${subject} is assuming it replaces strategy. It doesn't. It amplifies it."`) },
    { type: 'paragraph', content: sanitizeText(`To avoid this, focus on integration rather than replacement. Your existing processes should be enhanced by ${subject}, not upended entirely.`) },

    // Advanced Strategy
    { type: 'heading', content: sanitizeText(`Advanced Strategies for 2024`), level: 2 },
    { type: 'paragraph', content: sanitizeText(`Once you have the basics down, it is time to level up. The top 1% of practitioners are combining ${subject} with cross-functional analytics.`) },
    { type: 'paragraph', content: sanitizeText(`For example, linking your ${subject} outputs directly to customer success metrics creates a feedback loop that drives continuous improvement. This is the 'secret sauce' that separates the amateurs from the pros.`) },

    { type: 'separator' },

    // Conclusion & CTA
    { type: 'heading', content: 'The Bottom Line', level: 2 },
    { type: 'paragraph', content: sanitizeText(`We are standing at the precipice of a new era in ${subject}. The tools are available, the strategies are proven, and the opportunity is massive. The only question remaining is: will you take action?`) },
    { type: 'heading', content: sanitizeText(`Ready to Transform Your Approach to ${subject}?`), level: 3 },
    { type: 'paragraph', content: sanitizeText(`Don't let this opportunity slip by. Start auditing your current setup today, and implement the first pillar we discussed. Your future self will thank you.`) }
  ];
};

// MOCK DATA GENERATOR
export const getMockData = (toolId: string, context: string, options?: any): ToolOutput => {
  const seed = Math.floor(Math.random() * 10000);
  // CRITICAL: Use Inference to get the deep subject and safe keywords
  const { subject, keywords } = inferSubject(context);
  
  switch (toolId) {
    case 'blog-studio':
      return {
        type: 'blog',
        ideas: [
          sanitizeText(`The Ultimate Guide to ${subject}`),
          sanitizeText(`Why ${subject} is the Future`),
          sanitizeText(`10 Mistakes People Make with ${subject}`)
        ],
        finalPost: {
          title: sanitizeText(`Mastering ${subject}: A Comprehensive Strategy`),
          subtitle: sanitizeText(`How to navigate the evolving landscape of ${subject} and achieve peak performance in 2024.`),
          // UNPLASH SAFETY VALVE: Use Image Generator with inferred subject and keywords
          imageUrl: generateImageURL(`Cinematic professional header for ${subject}, ${keywords}`, 1200, 600, seed),
          blocks: generateProfessionalBlog(subject)
        }
      };
    case 'storyboard':
      // LOGIC: Generate exact number of frames based on slider (default 4)
      const count = options?.frameCount || 4;
      const scenes = Array.from({ length: count }).map((_, i) => {
        const isLast = i === count - 1;
        
        // THE CLEVER TWIST (CRITICAL RULE)
        const desc = isLast 
          ? `THE SUBVERSIVE TWIST: The camera pulls back to reveal that ${subject} was merely a high-fidelity simulation designed to test our endurance, leaving the viewer questioning the reality of everything that came before.` 
          : `Scene ${i + 1}: A cinematic exploration of ${subject} as it begins to subtly warp the laws of its environment.`;
        
        // Use safe keywords from inference
        return {
          description: sanitizeText(desc),
          imageUrl: generateImageURL(`Cinematic storyboard scene ${i + 1} about ${subject}, ${keywords}, high contrast dramatic`, 800, 450, seed + i)
        };
      });
      return { type: 'storyboard', scenes };
      
    case 'podcast':
      const podcastScript = `[INTRO MUSIC FADES]\n\nHOST: "Hello everyone, and welcome back. Today, we are tackling a massive subject: ${subject}."\n\nGUEST: "Thanks for having me. You know, ${subject} is misunderstood by most people."\n\nHOST: "Exactly. Let's break down the biggest myth right now."`;
      return {
        type: 'audio',
        topicOptions: [
          sanitizeText(`The Hidden Truth about ${subject}`),
          sanitizeText(`${subject}: Hype or Reality?`),
          sanitizeText(`Interview with a ${subject} Pioneer`)
        ],
        script: sanitizeText(podcastScript),
        audioUrl: MOCK_AUDIO_BLOB
      };
    case 'ad-creator':
      return {
        type: 'ad',
        imageUrl: generateImageURL(`High-end vertical advertisement visual for ${subject}, ${keywords}`, 1080, 1920, seed),
        headline: sanitizeText(`Redefine Your ${subject}`),
        cta: "Shop Now"
      };
    case 'podcaster-shots':
      return {
        type: 'podcaster',
        characterA: CHARACTER_A_IDS,
        characterB: CHARACTER_B_IDS
      };
    case 'landing-page':
      return {
        type: 'landing',
        sections: [
          { type: 'hero', title: sanitizeText(`The #1 Platform for ${subject}`), content: sanitizeText("Join thousands of professionals transforming their workflow today.") },
          { type: 'features', title: "Why Choose Us?", content: sanitizeText("1. Real-time Analytics\n2. Seamless Integration\n3. Enterprise Security") },
          { type: 'social', title: "Trusted By", content: "Fortune 500 Companies" }
        ]
      };
    case 'campaign-master':
      return {
        type: 'strategy',
        title: 'Audience Strategy',
        sections: [
          { heading: 'Core Demographics', items: ['Age: 25-45', 'Location: Urban Centers', 'Income: High Disposable'] },
          { heading: 'Interests', items: [sanitizeText(`${subject} Trends`), 'Tech Innovation', 'Productivity'] },
          { heading: 'Messaging Hooks', items: ['Save Time', 'Increase Efficiency', 'Stay Ahead'] }
        ]
      };
    case 'email-sequence':
      return {
        type: 'email',
        emails: [
          { type: 'Day 1', subject: sanitizeText(`Welcome! Here is your ${subject} guide`), body: sanitizeText(`Hi [Name],\n\nThank you for downloading our guide on ${subject}. It is attached below.`) },
          { type: 'Day 3', subject: sanitizeText(`Are you making this ${subject} mistake?`), body: sanitizeText(`Hey,\n\nMost people get this wrong about ${subject}. Here is how to fix it...`) },
          { type: 'Day 7', subject: "A special offer for you", body: sanitizeText(`Since you are interested in ${subject}, we have a surprise...`) }
        ]
      };
    case 'meme-lord':
      return {
        type: 'meme',
        memes: [
          { imageUrl: generateImageURL(`Meme template about ${subject}, ${keywords}`, 500, 500, seed + 10), topText: "My Boss:", bottomText: sanitizeText(`"Explain ${subject} to me"`) },
          { imageUrl: generateImageURL(`Meme template about ${subject}, ${keywords}`, 500, 500, seed + 11), topText: "Me when I finally", bottomText: sanitizeText(`Understand ${subject}`) },
          { imageUrl: generateImageURL(`Meme template about ${subject}, ${keywords}`, 500, 500, seed + 12), topText: "Still waiting for", bottomText: sanitizeText(`The perfect ${subject} tool`) }
        ]
      };
    case 'devils-advocate':
      return {
        type: 'strategy',
        title: 'The Brutal Critique',
        sections: [
          { heading: 'Weak Point 1', items: [sanitizeText(`Your approach to ${subject} lacks differentiation.`)] },
          { heading: 'Weak Point 2', items: [sanitizeText(`The market for ${subject} is already oversaturated.`)] },
          { heading: 'Recommendation', items: [sanitizeText(`Pivot to a niche within ${subject} immediately.`)] }
        ]
      };
    case 'quiz-magnet':
      return {
        type: 'quiz',
        questions: [
          { q: sanitizeText(`What is the primary benefit of ${subject}?`), options: ['Efficiency', 'Cost', 'Speed', 'Style'], answer: 'Efficiency' },
          { q: sanitizeText(`Which year did ${subject} become mainstream?`), options: ['2010', '2015', '2020', '2023'], answer: '2020' },
          { q: sanitizeText(`Who is a key leader in ${subject}?`), options: ['Industry Giant', 'Startup X', 'Innovator Y'], answer: 'Industry Giant' }
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
          { title: sanitizeText(subject.toUpperCase()), content: 'The Ultimate Deep Dive', color: 'bg-indigo-600' },
          { title: 'Fact #1', content: sanitizeText(`Did you know ${subject} is growing 20% YoY?`), color: 'bg-blue-600' },
          { title: 'Visual Insights', content: generateImageURL(`Infographic slide about ${subject}, ${keywords}`, 800, 1000, seed), color: 'bg-teal-600' },
          { title: 'Fact #2', content: 'It changes everything.', color: 'bg-teal-600' },
          { title: 'Fact #3', content: 'The secret is consistency.', color: 'bg-emerald-600' },
          { title: 'Summary', content: 'Save this post!', color: 'bg-slate-800' }
        ]
      };
    default:
      return { type: 'text', title: 'Error', content: 'Tool not implemented.' };
  }
}