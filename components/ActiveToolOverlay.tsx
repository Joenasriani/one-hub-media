import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Play, Pause, Share2, ChevronRight, Sliders, RotateCcw, Image as ImageIcon, Video, Layout, Mail, Smile, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Tool, ToolOutput, BlogBlock } from '../types';
import { generateContent } from '../services/mockService';
import { Button } from './ui/Button';
import { useApp } from '../context/AppContext';

interface ActiveToolOverlayProps {
  tool: Tool;
  onClose: () => void;
}

export const ActiveToolOverlay: React.FC<ActiveToolOverlayProps> = ({ tool, onClose }) => {
  const { globalTopic, themeAccent, setIsGenerating } = useApp();
  
  const [result, setResult] = useState<ToolOutput | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Storyboard State
  const [storyboardFrames, setStoryboardFrames] = useState(4);
  const [storyboardGenerated, setStoryboardGenerated] = useState(false);
  
  // Tool Specific UI States
  const [blogStep, setBlogStep] = useState<'ideas' | 'post'>('ideas');
  const [podcastStep, setPodcastStep] = useState<'topics' | 'audio'>('topics');
  const [emailTab, setEmailTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [regenKey, setRegenKey] = useState(0);

  const exportRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setIsGenerating(true);
    setResult(null);
    
    // Reset Flow States
    setBlogStep('ideas'); 
    setPodcastStep('topics');
    setEmailTab(0);
    
    try {
      // Pass storyboard frames if applicable
      const options = { frameCount: storyboardFrames };
      const data = await generateContent(tool.id, globalTopic, options);
      setResult(data);
      if (tool.id === 'storyboard') setStoryboardGenerated(true);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setRegenKey(prev => prev + 1);
    handleGenerate();
  };

  // Initial Generation Effect
  useEffect(() => {
    // For storyboard, wait for user input first
    if (tool.id !== 'storyboard') {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async (text: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    if (exportRef.current) {
      try {
        const canvas = await html2canvas(exportRef.current, { 
          useCORS: true, 
          scale: 2,
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`storyboard-${Date.now()}.pdf`);
      } catch (e) {
        console.error("PDF Export failed", e);
      }
    }
  };

  const handleExportPNG = async () => {
    if (exportRef.current) {
      try {
        const canvas = await html2canvas(exportRef.current, { useCORS: true, backgroundColor: null });
        const link = document.createElement('a');
        link.download = `one-hub-export-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (e) {
        console.error("Export failed", e);
      }
    }
  };

  const handleSaveMeme = async (index: number) => {
    const element = document.getElementById(`meme-visual-${index}`);
    if (element) {
      try {
        const canvas = await html2canvas(element, { useCORS: true, backgroundColor: null });
        const link = document.createElement('a');
        link.download = `meme-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (e) {
        console.error("Meme export failed", e);
      }
    }
  };

  const handleSaveAudio = () => {
    if (result?.type === 'audio') {
      const link = document.createElement('a');
      link.href = result.audioUrl;
      link.download = `podcast-${Date.now()}.wav`;
      link.click();
    }
  };

  const renderBlogBlock = (block: BlogBlock, idx: number) => {
    switch (block.type) {
      case 'heading':
        const HTag = block.level === 2 ? 'h2' : 'h3';
        const hClass = block.level === 2 
          ? "text-xl md:text-2xl text-cyan-100/80 font-light leading-relaxed mb-8 border-b border-white/10 pb-8" 
          : "text-lg font-bold text-white mb-4 mt-6";
        return <HTag key={idx} className={hClass}>{block.content}</HTag>;
      case 'paragraph':
        return <p key={idx} className="text-lg text-slate-300 leading-8 font-normal mb-6">{block.content}</p>;
      case 'quote':
        return <blockquote key={idx} className="border-l-4 border-cyan-500 pl-4 italic text-xl text-white mb-8">{block.content}</blockquote>;
      case 'list':
        return (
          <ul key={idx} className="space-y-3 mb-8 pl-4">
            {block.items?.map((item, i) => (
              <li key={i} className="text-slate-300 list-disc">{item}</li>
            ))}
          </ul>
        );
      case 'separator':
        return <hr key={idx} className="border-white/10 my-10" />;
      default:
        return null;
    }
  };

  // LOADING SKELETON
  const LoadingSkeleton = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-[400px] flex flex-col items-center justify-center text-slate-500 space-y-6"
    >
        {tool.id === 'short-video' ? (
          <div className="w-64 space-y-2">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyan-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>
            <p className="text-xs text-center text-cyan-500 animate-pulse">Rendering Video Frames...</p>
          </div>
        ) : tool.id === 'podcaster-shots' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl animate-pulse">
             {[1,2,3,4].map(i => (
                <div key={i} className="aspect-[3/4] bg-slate-800 rounded-xl"></div>
             ))}
          </div>
        ) : (
          <div className="relative w-16 h-16">
             <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
             <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin" />
          </div>
        )}
    </motion.div>
  );

  // Storyboard Control Phase
  if (tool.id === 'storyboard' && !storyboardGenerated && !loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          layoutId={`tool-${tool.id}`}
          className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-8"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Cinematic Storyboard</h2>
            <button onClick={onClose}><X className="text-slate-400" /></button>
          </div>
          
          <div className="space-y-8 mb-8">
            <div>
              <label className="block text-cyan-400 text-sm font-semibold mb-4 uppercase tracking-wider">Frame Count: {storyboardFrames}</label>
              <input 
                type="range" 
                min="1" 
                max="6" 
                value={storyboardFrames} 
                onChange={(e) => setStoryboardFrames(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1 Frame</span>
                <span>6 Frames</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 italic border-l-2 border-cyan-500 pl-4">
              "Generates a visual narrative with a guaranteed clever twist at the end."
            </p>
          </div>
          
          <Button onClick={handleGenerate} className="w-full py-4 text-lg">Generate Storyboard</Button>
        </motion.div>
      </div>
    );
  }

  const renderOutput = () => {
    if (!result) return null;

    // 1. Interactive Blog Studio
    if (result.type === 'blog') {
      const getBlogHTML = () => {
        let html = `<h1>${result.finalPost.title}</h1>`;
        html += `<h3>${result.finalPost.subtitle}</h3>`;
        html += `<img src="${result.finalPost.imageUrl}" alt="Banner" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />`;
        
        result.finalPost.blocks.forEach(block => {
          switch (block.type) {
            case 'heading': html += `<h${block.level}>${block.content}</h${block.level}>`; break;
            case 'paragraph': html += `<p>${block.content}</p>`; break;
            case 'quote': html += `<blockquote style="border-left: 4px solid #06b6d4; padding-left: 1rem; font-style: italic;">${block.content}</blockquote>`; break;
            case 'list': 
              html += `<ul>`;
              block.items?.forEach(item => html += `<li>${item}</li>`);
              html += `</ul>`;
              break;
            case 'separator': html += `<hr />`; break;
          }
        });
        return html;
      };

      const getBlogMarkdown = () => {
        let md = `# ${result.finalPost.title}\n\n`;
        md += `## ${result.finalPost.subtitle}\n\n`;
        md += `![Banner](${result.finalPost.imageUrl})\n\n`;
        
        result.finalPost.blocks.forEach(block => {
          switch (block.type) {
            case 'heading': md += `${'#'.repeat(block.level)} ${block.content}\n\n`; break;
            case 'paragraph': md += `${block.content}\n\n`; break;
            case 'quote': md += `> ${block.content}\n\n`; break;
            case 'list': 
              block.items?.forEach(item => md += `- ${item}\n`);
              md += `\n`;
              break;
            case 'separator': md += `---\n\n`; break;
          }
        });
        return md;
      };

      const handleShareToBlogger = () => {
        const title = encodeURIComponent(result.finalPost.title);
        const body = encodeURIComponent(getBlogHTML());
        window.open(`https://www.blogger.com/blog-post.g?t=${title}&b=${body}`, '_blank');
      };

      if (blogStep === 'ideas') {
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-lg font-semibold text-cyan-400">Select a Headline:</h3>
             <div className="grid gap-4">
                {result.ideas.map((idea, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => setBlogStep('post')}
                    className="text-left p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all"
                  >
                    <span className="text-lg font-medium text-slate-200">{idea}</span>
                  </motion.button>
                ))}
             </div>
          </div>
        );
      }
      return (
        <div className="space-y-8">
          <div ref={exportRef} className="bg-slate-900 p-8 md:p-12 rounded-xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-20 bg-cyan-500/5 blur-3xl rounded-full" />
            <img 
              src={result.finalPost.imageUrl} 
              alt="Cover" 
              className="w-full h-[300px] object-cover rounded-lg mb-10 shadow-lg border border-white/5" 
              crossOrigin="anonymous"
            />
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 leading-tight">{result.finalPost.title}</h1>
              <p className="text-xl md:text-2xl text-cyan-100/60 font-light leading-relaxed mb-10 border-b border-white/10 pb-8 italic">
                {result.finalPost.subtitle}
              </p>
              <div className="prose prose-invert max-w-none">
                {result.finalPost.blocks?.map((block, idx) => renderBlogBlock(block, idx))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
               <h4 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Professional Export</h4>
               <div className="grid grid-cols-2 gap-3">
                 <Button onClick={() => handleCopy(getBlogHTML())} variant="secondary" className="text-xs py-2">
                   <Copy size={14} className="mr-2" /> Copy HTML
                 </Button>
                 <Button onClick={() => handleCopy(getBlogMarkdown())} variant="secondary" className="text-xs py-2">
                   <Copy size={14} className="mr-2" /> Copy Markdown
                 </Button>
                 <Button onClick={handleShareToBlogger} variant="primary" className="text-xs py-2 bg-orange-600 hover:bg-orange-500 border-none col-span-2">
                   <Share2 size={14} className="mr-2" /> Share to Blogger
                 </Button>
               </div>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-center gap-3">
               <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Universal Formats</h4>
               <Button onClick={() => handleCopy(JSON.stringify(result.finalPost))} variant="ghost" className="text-xs justify-start">
                 <FileText size={14} className="mr-2" /> Copy Professional JSON
               </Button>
               <Button onClick={handleRegenerate} variant="ghost" className="text-xs justify-start">
                 <RotateCcw size={14} className="mr-2" /> Try Different Angle
               </Button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Cinematic Storyboard
    if (result.type === 'storyboard') {
       return (
          <div className="space-y-6">
             <div ref={exportRef} className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x p-2">
               {result.scenes.map((scene, i) => (
                  <div key={i} className="min-w-[300px] md:min-w-[400px] bg-slate-900 p-4 rounded-xl border border-white/10 snap-center flex-shrink-0">
                     <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
                       <img 
                         src={scene.imageUrl} 
                         className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700" 
                         alt={`Scene ${i+1}`} 
                         crossOrigin="anonymous"
                       />
                       <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">Frame {i + 1}</span>
                     </div>
                     <p className="font-mono text-sm text-slate-300 leading-relaxed">{scene.description}</p>
                  </div>
               ))}
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleExportPDF} className="w-full">
                  <FileText size={16} className="mr-2" /> Export PDF
                </Button>
                <Button onClick={() => handleCopy(JSON.stringify(result.scenes))} variant="secondary" className="w-full">Copy Script</Button>
             </div>
          </div>
       );
    }

    // 3. Podcast Generator
    if (result.type === 'audio') {
      if (podcastStep === 'topics') {
        return (
           <div className="space-y-6 animate-in fade-in">
             <h3 className="text-lg font-semibold text-cyan-400">Choose Episode Angle:</h3>
             <div className="grid gap-4">
                {result.topicOptions?.map((t, i) => (
                  <motion.button key={i} onClick={() => setPodcastStep('audio')} className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-left">
                    {t}
                  </motion.button>
                ))}
             </div>
           </div>
        );
      }
      return (
         <div className="space-y-8">
           <div className="bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center border border-white/10 relative overflow-hidden">
             <div className="w-full flex items-center justify-center mb-6">
                <div className="flex gap-1 items-end h-16">
                  {[...Array(20)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [20, 40 + Math.random() * 40, 20] }}
                      transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                      className="w-1 bg-cyan-500 rounded-full" 
                    />
                  ))}
                </div>
             </div>
             <audio controls src={result.audioUrl} className="w-full relative z-10 mix-blend-screen" />
           </div>
           <div className="h-64 overflow-y-auto bg-slate-800/50 p-6 rounded-xl border border-white/5 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed custom-scrollbar">
             {result.script}
           </div>
           <div className="grid grid-cols-2 gap-4">
             <Button onClick={handleSaveAudio} variant="primary" className="w-full">
                <Download size={16} className="mr-2" /> Save Audio
             </Button>
             <Button onClick={() => handleCopy(result.script)} variant="secondary" className="w-full">
                {copied ? 'Copied!' : 'Copy Transcript'}
             </Button>
           </div>
         </div>
      );
    }

    // 4. Ad Post Creator
    if (result.type === 'ad') {
      return (
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
          <div className="flex-1 w-full flex flex-col items-center">
             <div ref={exportRef} className="relative w-[320px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
                <img src={result.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Ad Creative" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                   <h2 className="text-2xl font-bold text-white leading-tight mb-6 drop-shadow-xl">{result.headline}</h2>
                   <div className="inline-block bg-white text-black font-bold py-3 px-8 rounded-full uppercase tracking-widest text-xs shadow-lg transform transition-transform group-hover:scale-105">
                      {result.cta}
                   </div>
                </div>
             </div>
          </div>
          <div className="w-full md:w-64 space-y-4 shrink-0">
             <div className="p-4 bg-white/5 rounded-xl border border-white/10">
               <h4 className="text-xs text-slate-500 uppercase font-bold mb-2">Smart Copy</h4>
               <p className="text-sm text-white">{result.headline}</p>
             </div>
             <Button onClick={handleExportPNG} className="w-full">
               <Download size={16} className="mr-2" /> Export PNG
             </Button>
             <Button onClick={() => handleCopy(result.headline)} variant="secondary" className="w-full">
               Copy Headline
             </Button>
          </div>
        </div>
      );
    }

    // 5. Podcaster Shots
    if (result.type === 'podcaster') {
       return (
          <div className="space-y-8">
            <div>
              <h3 className="text-slate-400 mb-4 uppercase text-xs font-bold flex items-center gap-2"><ImageIcon size={14} /> Character A (Male)</h3>
              <div className="grid grid-cols-2 gap-4">
                {result.characterA.map((img, i) => (
                   <img key={i} src={img} className="rounded-xl w-full aspect-[3/4] object-cover border border-white/10 hover:border-cyan-500/50 transition-colors" alt="Host A" />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-slate-400 mb-4 uppercase text-xs font-bold flex items-center gap-2"><ImageIcon size={14} /> Character B (Female)</h3>
              <div className="grid grid-cols-2 gap-4">
                {result.characterB.map((img, i) => (
                   <img key={i} src={img} className="rounded-xl w-full aspect-[3/4] object-cover border border-white/10 hover:border-cyan-500/50 transition-colors" alt="Host B" />
                ))}
              </div>
            </div>
          </div>
       );
    }

    // 6. Short Video Generator
    if (result.type === 'video') {
      return (
        <div className="flex flex-col items-center space-y-6">
           <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <video 
                 src={result.videoUrl} 
                 className="w-full h-full object-cover" 
                 autoPlay 
                 muted 
                 loop 
                 playsInline
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur rounded-lg p-2 flex items-center gap-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                 <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                       className="h-full bg-white"
                       animate={{ width: ["0%", "100%"] }}
                       transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />
                 </div>
                 <span className="text-[10px] font-mono">{result.duration}</span>
              </div>
           </div>
           <Button variant="secondary" className="w-full max-w-sm">
              <Download size={16} className="mr-2" /> Save Video
           </Button>
        </div>
      );
    }

    // 7. LinkedIn/IG Carousel
    if (result.type === 'carousel') {
      return (
         <div className="space-y-6">
             <div ref={exportRef} className="flex overflow-x-auto gap-4 pb-6 custom-scrollbar snap-x p-2">
               {result.slides.map((slide, i) => (
                  <div key={i} className={`min-w-[280px] md:min-w-[400px] aspect-[4/5] ${slide.color} p-8 rounded-xl shadow-lg flex flex-col justify-between snap-center shrink-0 border border-white/10 relative overflow-hidden`}>
                     <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                     <div>
                       <span className="text-xs font-bold opacity-50 uppercase tracking-widest mb-2 block">Slide {i + 1}</span>
                       <h3 className="text-2xl font-bold text-white leading-tight">{slide.title}</h3>
                     </div>
                     <p className="text-white/90 text-lg font-medium">{slide.content}</p>
                     <div className="flex justify-between items-center">
                        <div className="w-8 h-1 bg-white/30 rounded-full" />
                        <ChevronRight className="text-white/50" size={20} />
                     </div>
                  </div>
               ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Button onClick={handleExportPDF} className="w-full">
                  <FileText size={16} className="mr-2" /> Export PDF
               </Button>
               <Button onClick={() => handleCopy(JSON.stringify(result.slides))} variant="secondary" className="w-full">
                  <Copy size={16} className="mr-2" /> Copy Slide Content
               </Button>
            </div>
         </div>
      );
    }

    // 8. Landing Page Architect
    if (result.type === 'landing') {
       return (
          <div className="space-y-6">
             <div className="bg-slate-100 rounded-xl overflow-hidden border border-white/10 shadow-xl text-slate-900">
                {/* Mock Browser Header */}
                <div className="bg-slate-200 px-4 py-2 flex items-center gap-2 border-b border-slate-300">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                {result.sections.map((section, i) => (
                   <div key={i} className={`p-8 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      {section.type === 'hero' && (
                         <div className="text-center space-y-4">
                            <h1 className="text-3xl font-black text-slate-900">{section.title}</h1>
                            <p className="text-slate-600 max-w-md mx-auto">{section.content}</p>
                            <div className="bg-blue-600 text-white px-6 py-2 rounded-full inline-block text-sm font-bold">CTA Button</div>
                         </div>
                      )}
                      {section.type === 'features' && (
                         <div className="grid grid-cols-3 gap-4 text-center">
                            {[1,2,3].map(j => (
                               <div key={j} className="p-4 border rounded bg-slate-50">
                                  <div className="w-8 h-8 bg-blue-100 rounded mb-2 mx-auto" />
                                  <div className="h-3 bg-slate-200 w-2/3 mx-auto rounded" />
                               </div>
                            ))}
                         </div>
                      )}
                      {section.type === 'social' && (
                         <div className="text-center opacity-50 font-mono text-xs">
                            {section.content}
                         </div>
                      )}
                   </div>
                ))}
             </div>
             <Button onClick={() => handleCopy(JSON.stringify(result.sections))} variant="secondary" className="w-full">
                Copy Wireframe Code
             </Button>
          </div>
       );
    }

    // 9. Email Sequence
    if (result.type === 'email') {
       return (
          <div className="space-y-6">
             <div className="flex gap-2 overflow-x-auto pb-2">
                {result.emails.map((email, i) => (
                   <button 
                     key={i} 
                     onClick={() => setEmailTab(i)}
                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        emailTab === i ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                     }`}
                   >
                      {email.type}
                   </button>
                ))}
             </div>
             <div className="bg-slate-900 p-6 rounded-xl border border-white/10 min-h-[300px]">
                <div className="border-b border-white/10 pb-4 mb-4 space-y-2">
                   <div className="text-sm text-slate-500">Subject:</div>
                   <div className="text-white font-medium">{result.emails[emailTab].subject}</div>
                </div>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                   {result.emails[emailTab].body}
                </div>
             </div>
             <Button onClick={() => handleCopy(result.emails[emailTab].body)} variant="secondary" className="w-full">
                Copy Email Content
             </Button>
          </div>
       );
    }

    // 11. Meme Lord
    if (result.type === 'meme') {
       return (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.memes.map((meme, i) => (
                   <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10">
                      {/* Visual to Capture */}
                      <div id={`meme-visual-${i}`} className="relative aspect-square w-full h-full">
                        <img src={meme.imageUrl} className="w-full h-full object-cover" alt="Meme" crossOrigin="anonymous" />
                        <div className="absolute inset-0 flex flex-col justify-between p-4 text-center pointer-events-none">
                          <span className="font-black text-white text-2xl uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] stroke-black stroke-2" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>{meme.topText}</span>
                          <span className="font-black text-white text-2xl uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] stroke-black stroke-2" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>{meme.bottomText}</span>
                        </div>
                      </div>

                      {/* Hover Controls (Outside Capture Area) */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm z-20">
                         <Button onClick={() => handleSaveMeme(i)} variant="primary" className="text-xs py-2 h-auto min-h-0">
                            <Download size={14} className="mr-2" /> Save
                         </Button>
                         <Button onClick={() => handleCopy(meme.topText + " " + meme.bottomText)} variant="ghost" className="text-xs py-2 h-auto min-h-0">
                            <Copy size={14} className="mr-2" /> Copy Text
                         </Button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       );
    }

    // 12 & 13. Quiz & Strategy (Generic List Render)
    if ('questions' in result || 'sections' in result) {
       return (
          <div className="space-y-4">
             <div className="bg-slate-900 p-6 rounded-xl border border-white/10 max-h-[500px] overflow-y-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap text-slate-300 font-sans text-sm leading-7">{JSON.stringify(result, null, 2)}</pre>
             </div>
             <Button onClick={() => handleCopy(JSON.stringify(result))} variant="secondary" className="w-full">{copied ? 'Copied!' : 'Copy Data'}</Button>
          </div>
       );
    }

    // Fallback
    return (
        <div className="p-4 text-center text-slate-400">Output visualization under construction.</div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        layoutId={`tool-${tool.id}`}
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/50 backdrop-blur shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${
              themeAccent === 'amber' ? 'bg-amber-500' : themeAccent === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'
            }`}>
               <Sliders size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">{tool.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-950/50">
          <div className="flex justify-between items-center mb-6">
             <div className="text-sm text-slate-400">Context: <span className="text-white font-medium">{globalTopic}</span></div>
             <Button onClick={handleRegenerate} disabled={loading} variant="ghost" className="text-sm">
                <RotateCcw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
                Regenerate
             </Button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingSkeleton key="loader" />
            ) : (
              <motion.div
                key={`result-${regenKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                {renderOutput()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};