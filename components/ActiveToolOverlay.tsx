import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Play, Pause, Share2, ChevronRight, Sliders, RotateCcw, Image as ImageIcon, Video, Layout, Mail, Smile, FileText, Zap, PenTool, Code } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Tool, ToolOutput, BlogBlock } from '../types';
import { generateContent } from '../services/mockService';
import { Button } from './ui/Button';
import { useApp } from '../context/AppContext';
import { generateImageURL, inferSubject } from '../constants';

interface ActiveToolOverlayProps {
  tool: Tool;
  onClose: () => void;
}

export const ActiveToolOverlay: React.FC<ActiveToolOverlayProps> = ({ tool, onClose }) => {
  const { globalTopic, themeAccent, setIsGenerating } = useApp();
  
  const [result, setResult] = useState<ToolOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
  const isUnavailableInFree = tool.availableInFree === false;

  const handleGenerate = async () => {
    setLoading(true);
    setIsGenerating(true);
    setErrorMessage(null);
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
    } catch (error: any) {
      setErrorMessage(error?.message || 'Generation failed. Please verify provider configuration and try again.');
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
    if (isUnavailableInFree) return;
    // For storyboard, wait for user input first
    if (tool.id !== 'storyboard') {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnavailableInFree]);

  if (isUnavailableInFree) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          layoutId={`tool-${tool.id}`}
          className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{tool.name}</h2>
            <button onClick={onClose}><X className="text-slate-400" /></button>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            Not available in free version.
          </p>
          <Button onClick={onClose} className="w-full py-4 text-lg">Close</Button>
        </motion.div>
      </div>
    );
  }

  const handleCopy = async (text: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    try {
      const content = exportRef.current.innerText?.trim();
      if (!content) {
        setErrorMessage('Cannot export empty content to PDF.');
        return;
      }

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(content, 180);
      doc.text(lines, 15, 20);
      doc.save(`one-hub-export-${Date.now()}.pdf`);
    } catch (e: any) {
      setErrorMessage(e?.message || 'PDF export failed.');
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
        let html = `<article style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; line-height: 1.8; max-width: 720px; margin: 40px auto; padding: 20px;">`;
        html += `<header style="margin-bottom: 40px; text-align: center;">`;
        html += `<h1 style="font-size: 42px; margin-bottom: 12px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1;">${result.finalPost.title}</h1>`;
        html += `<p style="font-size: 22px; color: #666; font-style: italic; font-weight: 300;">${result.finalPost.subtitle}</p>`;
        html += `</header>`;
        html += `<div style="margin-bottom: 40px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">`;
        html += `<img src="${result.finalPost.imageUrl}" alt="Banner" style="width: 100%; height: auto; display: block;" />`;
        html += `</div>`;
        
        result.finalPost.blocks.forEach(block => {
          switch (block.type) {
            case 'heading': 
              const size = block.level === 2 ? '30px' : '24px';
              html += `<h${block.level} style="font-size: ${size}; margin: 48px 0 20px; font-weight: 700; color: #000;">${block.content}</h${block.level}>`; 
              break;
            case 'paragraph': 
              html += `<p style="margin-bottom: 24px; font-size: 18px;">${block.content}</p>`; 
              break;
            case 'quote': 
              html += `<blockquote style="border-left: 6px solid #06b6d4; padding: 20px 30px; font-style: italic; color: #444; background: #f8fafc; margin: 40px 0; font-size: 20px; border-radius: 0 8px 8px 0;">${block.content}</blockquote>`; 
              break;
            case 'list': 
              html += `<ul style="margin-bottom: 24px; padding-left: 24px; font-size: 18px;">`;
              block.items?.forEach(item => html += `<li style="margin-bottom: 12px;">${item}</li>`);
              html += `</ul>`;
              break;
            case 'separator': 
              html += `<hr style="border: 0; border-top: 1px solid #eee; margin: 60px 0;" />`; 
              break;
          }
        });
        html += `</article>`;
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
        // Updated URL template for Blogger compose
        const bloggerUrl = `https://www.blogger.com/blog-main.g?pli=1#posteditor/title=${title};body=${body}`;
        window.open(bloggerUrl, '_blank');
      };

      if (blogStep === 'ideas') {
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <PenTool size={20} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white tracking-tight">Blog Studio</h3>
                   <p className="text-sm text-slate-500">Select the narrative angle for your post</p>
                </div>
             </div>
             <div className="grid gap-4">
                {result.ideas.map((idea, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.01, x: 5 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setBlogStep('post')}
                    className="group text-left p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all flex justify-between items-center"
                  >
                    <span className="text-lg font-medium text-slate-200 group-hover:text-cyan-400 transition-colors italic tracking-tight">{idea}</span>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-cyan-500 transition-colors" />
                  </motion.button>
                ))}
             </div>
          </div>
        );
      }
      return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div ref={exportRef} className="bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-40 bg-cyan-500/5 blur-3xl rounded-full" />
            <div className="w-full max-h-[60vh] overflow-hidden border-b border-white/5 flex justify-center items-center bg-black/80">
              <img 
                src={result.finalPost.imageUrl} 
                alt="Cover" 
                className="w-full max-h-[60vh] object-contain transition-transform duration-[30s] hover:scale-110" 
                
              />
            </div>
            <div className="max-w-3xl mx-auto p-12 md:p-20 relative">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] italic uppercase">{result.finalPost.title}</h1>
                  <p className="text-2xl text-cyan-200/60 font-light leading-relaxed italic border-l-4 border-cyan-500/50 pl-8">
                    {result.finalPost.subtitle}
                  </p>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-headings:italic prose-headings:tracking-tighter">
                  {result.finalPost.blocks?.map((block, idx) => renderBlogBlock(block, idx))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl md:col-span-2">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-6">Omni-Channel Deployment</h4>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Button onClick={() => handleCopy(getBlogHTML())} variant="secondary" className="text-[10px] uppercase font-black py-4">
                   <Code size={14} className="mr-2" /> Export HTML
                 </Button>
                 <Button onClick={() => handleCopy(getBlogMarkdown())} variant="secondary" className="text-[10px] uppercase font-black py-4">
                   <FileText size={14} className="mr-2" /> Markdown
                 </Button>
                 <Button onClick={handleShareToBlogger} variant="primary" className="text-[10px] uppercase font-black py-4 bg-[#ff5722] hover:bg-[#e64a19] border-none shadow-[0_10px_30px_-5px_rgba(255,87,34,0.4)]">
                   <Share2 size={14} className="mr-2" /> Publish Now
                 </Button>
               </div>
            </div>
            
            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl flex flex-col justify-center gap-4">
               <Button onClick={handleExportPDF} variant="ghost" className="text-[10px] font-black uppercase tracking-widest justify-start hover:bg-white/10 py-4">
                 <Download size={14} className="mr-2" /> Generate PDF
               </Button>
               <Button onClick={handleRegenerate} variant="ghost" className="text-[10px] font-black uppercase tracking-widest justify-start hover:bg-white/10 py-4">
                 <RotateCcw size={14} className="mr-2" /> Refine Angle
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
                     <div className="relative aspect-video w-full max-h-[60vh] mb-4 overflow-hidden rounded-lg bg-black">
                       <img 
                         src={scene.imageUrl} 
                         className="w-full h-full object-contain opacity-90 hover:scale-105 transition-transform duration-700" 
                         alt={`Scene ${i+1}`} 
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
             <div ref={exportRef} className="relative w-auto h-[60vh] md:h-[70vh] max-w-full aspect-[9/16] mx-auto rounded-2xl overflow-hidden shadow-2xl group border border-white/10 bg-black">
                <img 
                  src={result.imageUrl} 
                  className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105" 
                  alt="Ad Creative" 
                   
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-sky-500/5 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center pb-12">
                   <h2 className="text-2xl font-black text-white leading-tight mb-8 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] italic uppercase tracking-tighter">{result.headline}</h2>
                   <div className="inline-block bg-white text-black font-black py-4 px-10 rounded-full uppercase tracking-widest text-[10px] shadow-2xl transform transition-all group-hover:scale-105 active:scale-95 cursor-pointer">
                      {result.cta}
                   </div>
                </div>
             </div>
          </div>
          <div className="w-full md:w-80 space-y-4 shrink-0">
             <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md space-y-6">
                <div className="flex justify-between items-end">
                   <h4 className="text-[10px] text-cyan-400 uppercase font-black tracking-widest flex items-center gap-2">
                    <Zap size={12} /> AI Strategy
                   </h4>
                   <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Viral Potential: 94%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: "94%" }}
                     transition={{ duration: 1, ease: "easeOut" }}
                     className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                   />
                </div>
               <p className="text-sm text-slate-300 leading-relaxed italic">"Designed with high-velocity triggers to capture urban dwell-time focus. Optimized for Gen-Z scroll patterns."</p>
             </div>
             <div className="grid gap-3">
               <Button onClick={handleExportPNG} className="w-full">
                 <Download size={16} className="mr-2" /> Export to Social
               </Button>
               <Button onClick={() => handleCopy(result.headline)} variant="secondary" className="w-full">
                 Copy Campaign Copy
               </Button>
             </div>
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
                   <div key={i} className="rounded-xl w-full max-h-[50vh] overflow-hidden border border-white/10 bg-black hover:border-cyan-500/50 transition-colors">
                     <img src={img} className="w-full h-full object-contain aspect-[3/4]" alt="Host A" />
                   </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-slate-400 mb-4 uppercase text-xs font-bold flex items-center gap-2"><ImageIcon size={14} /> Character B (Female)</h3>
              <div className="grid grid-cols-2 gap-4">
                {result.characterB.map((img, i) => (
                   <div key={i} className="rounded-xl w-full max-h-[50vh] overflow-hidden border border-white/10 bg-black hover:border-cyan-500/50 transition-colors">
                     <img src={img} className="w-full h-full object-contain aspect-[3/4]" alt="Host B" />
                   </div>
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
           <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden border-[8px] border-slate-900 shadow-2xl ring-1 ring-white/10">
              <video 
                 src={result.videoUrl} 
                 className="w-full h-full object-cover" 
                 autoPlay 
                 muted 
                 loop 
                 playsInline
              />
              {/* Overlays */}
              <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border border-white/20" />
                  <div className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">One AI Hub</div>
                </div>
                <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter animate-pulse">Live Rendering</div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    <span className="text-[10px] text-white/70 font-mono tracking-tighter">4.2k active viewers</span>
                 </div>
                 <div className="space-y-2">
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full bg-cyan-500"
                          animate={{ width: ["0%", "100%"] }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                       />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-white/50">
                       <span>{result.duration}</span>
                       <span>Auto-Loop Enabled</span>
                    </div>
                 </div>
              </div>
           </div>
           <div className="w-full max-w-[320px] grid grid-cols-2 gap-3">
             <Button variant="primary" className="w-full">
                <Download size={14} className="mr-2" /> Save Render
             </Button>
             <Button variant="secondary" className="w-full">
                <Share2 size={14} className="mr-2" /> Share Clip
             </Button>
           </div>
        </div>
      );
    }

    // 7. LinkedIn/IG Carousel
    if (result.type === 'carousel') {
      return (
         <div className="space-y-6">
             <div ref={exportRef} className="flex overflow-x-auto gap-4 pb-6 custom-scrollbar snap-x p-2">
               {result.slides.map((slide, i) => (
                  <div key={i} className={`min-w-[280px] md:min-w-[400px] aspect-[4/5] ${slide.color || 'bg-slate-800'} p-0 rounded-xl shadow-lg flex flex-col justify-between snap-center shrink-0 border border-white/10 relative overflow-hidden group`}>
                     <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                     {slide.imageUrl ? (
                       <img src={slide.imageUrl} alt={slide.title} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700 pointer-events-none"  />
                     ) : (slide.content?.startsWith('http') && (
                       <img src={slide.content} alt={slide.title} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700 pointer-events-none"  />
                     ))}
                     <div className="p-8 flex flex-col justify-between h-full relative z-10">
                       <div>
                         <span className="text-xs font-bold opacity-50 uppercase tracking-widest mb-2 block">Slide {i + 1}</span>
                         <h3 className="text-2xl font-bold text-white leading-tight">{slide.title}</h3>
                       </div>
                       {!slide.content?.startsWith('http') && (
                         <p className="text-white/90 text-lg font-medium">{slide.content}</p>
                       )}
                       <div className="flex justify-between items-center mt-6">
                          <div className="w-8 h-1 bg-white/30 rounded-full" />
                          <ChevronRight className="text-white/50" size={20} />
                       </div>
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
       const { subject, keywords } = inferSubject(globalTopic);
       return (
          <div className="space-y-6">
             <div className="bg-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl text-slate-900 font-sans">
                {/* Mock Browser Header */}
                <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-green-400" />
                   <div className="ml-4 h-6 w-full max-w-sm bg-white rounded border border-slate-200 px-3 text-[10px] text-slate-400 flex items-center">
                     https://hub.one-ai.com/{globalTopic.toLowerCase().replace(/\s+/g, '-')}
                   </div>
                </div>
                {result.sections.map((section, i) => (
                   <div key={i} className={`p-10 md:p-16 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      {section.type === 'hero' && (
                         <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6 text-left">
                               <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{section.title}</h1>
                               <p className="text-lg text-slate-600 leading-relaxed">{section.content}</p>
                               <div className="flex gap-4">
                                 <div className="bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer">Get Started</div>
                                 <div className="border border-slate-200 text-slate-600 px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-100 transition-all cursor-pointer">Learn More</div>
                               </div>
                            </div>
                            <div className="relative aspect-square md:aspect-video max-h-[60vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-100 flex items-center justify-center">
                               <img 
                                 src={result.heroImageUrl || generateImageURL(`High fidelity hero visual for ${subject}, ${keywords}`, 1000, 800, 123)} 
                                 className="w-full h-full object-contain"
                                 alt="Hero"
                                 
                               />
                            </div>
                         </div>
                      )}
                      {section.type === 'features' && (
                         <div className="space-y-12 text-center">
                            <h2 className="text-3xl font-bold text-slate-900">{section.title}</h2>
                            <div className="grid md:grid-cols-3 gap-8">
                               {[1,2,3].map(j => (
                                  <div key={j} className="p-8 border border-slate-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                     <div className="w-12 h-12 bg-blue-50 rounded-2xl mb-6 flex items-center justify-center mx-auto text-blue-600">
                                        <Layout size={24} />
                                     </div>
                                     <h4 className="font-bold mb-2 text-slate-800">Feature {j}</h4>
                                     <p className="text-sm text-slate-500 leading-relaxed">Advanced AI-driven logic ensuring maximum engagement for your brand.</p>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                      {section.type === 'social' && (
                         <div className="text-center py-8">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">{section.title}</p>
                            <div className="flex flex-wrap justify-center gap-10 opacity-30 grayscale contrast-125">
                               <span className="text-xl font-bold italic">FORBES</span>
                               <span className="text-xl font-bold italic">TECHCRUNCH</span>
                               <span className="text-xl font-bold italic">WIRED</span>
                               <span className="text-xl font-bold italic">REUTERS</span>
                            </div>
                         </div>
                      )}
                   </div>
                ))}
             </div>
             <div className="flex gap-4">
                <Button onClick={handleExportPNG} className="flex-1">
                  <Download size={16} className="mr-2" /> Save Wireframe image
                </Button>
                <Button onClick={() => handleCopy(JSON.stringify(result.sections))} variant="secondary" className="flex-1">
                  <Copy size={16} className="mr-2" /> Copy UI Props
                </Button>
             </div>
          </div>
       );
    }

    // 9. Email Sequence
    if (result.type === 'email') {
       return (
          <div className="space-y-6">
             <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {result.emails.map((email, i) => (
                   <button 
                     key={i} 
                     onClick={() => setEmailTab(i)}
                     className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap border ${
                        emailTab === i 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]' 
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                     }`}
                   >
                      Step {i + 1}: {email.type}
                   </button>
                ))}
             </div>
             <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6">
                   <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                     <Mail size={20} />
                   </div>
                   <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Subject Line</div>
                      <div className="text-white font-bold text-lg">{result.emails[emailTab].subject}</div>
                   </div>
                </div>
                <div className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap font-sans min-h-[250px]">
                   {result.emails[emailTab].body}
                </div>
             </div>
             <div className="flex gap-4">
               <Button onClick={() => handleCopy(result.emails[emailTab].body)} variant="primary" className="flex-1">
                  <Copy size={16} className="mr-2" /> {copied ? 'Copied Content!' : 'Copy Body Text'}
               </Button>
               <Button onClick={() => handleCopy(result.emails[emailTab].subject)} variant="secondary" className="flex-1">
                  Copy Subject
               </Button>
             </div>
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
                      <div id={`meme-visual-${i}`} className="relative max-h-[60vh] aspect-square mx-auto w-full h-full bg-black">
                        <img src={meme.imageUrl} className="w-full h-full object-contain mix-blend-screen" alt="Meme"  />
                        <div className="absolute inset-x-0 h-full flex flex-col justify-between py-6 px-4 text-center pointer-events-none">
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

    // 12 & 13. Quiz & Strategy (Professional Report / Cards)
    if (result.type === 'quiz') {
      return (
        <div className="space-y-8 max-w-2xl mx-auto py-10">
          <div className="text-center space-y-2 mb-10">
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Engagement Quiz</h3>
            <p className="text-cyan-400 text-sm font-bold tracking-widest uppercase">Subject: {globalTopic}</p>
          </div>
          <div className="space-y-6">
            {result.questions?.map((q, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group"
               >
                  <p className="text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Question {i + 1}</p>
                  <h4 className="text-xl font-bold text-white mb-6 leading-tight">{q.q}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, j) => (
                      <div key={j} className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                        opt === q.answer 
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                        : 'bg-white/5 border-white/5 text-slate-400'
                      }`}>
                        {opt}
                      </div>
                    ))}
                  </div>
               </motion.div>
            ))}
          </div>
          <Button onClick={() => handleCopy(JSON.stringify(result.questions))} variant="secondary" className="w-full">
            <Download size={16} className="mr-2" /> Export to LMS / Forms
          </Button>
        </div>
      );
    }

    if (result.type === 'strategy') {
      return (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-8 mb-8">
            <div>
              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">{result.title || "Strategic Dossier"}</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Generated for: <span className="text-cyan-400">{globalTopic}</span></p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 flex flex-col items-center">
              <span className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">Risk Level</span>
              <span className="text-2xl font-black text-white italic">CRITICAL</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {result.sections?.map((section, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-xl flex flex-col gap-6"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                     <h4 className="font-black text-white uppercase tracking-widest text-sm">{section.heading}</h4>
                  </div>
                  <ul className="space-y-4">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex gap-4 items-start text-slate-300 leading-relaxed group">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 shrink-0 group-hover:bg-cyan-500 transition-colors" />
                        {item}
                      </li>
                    ))}
                  </ul>
               </motion.div>
            ))}
          </div>
          
          <div className="p-10 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-3xl border border-cyan-500/20 text-center space-y-6">
             <h4 className="text-xl font-bold text-white tracking-tight">Ready to implement this roadmap?</h4>
             <p className="text-slate-400 max-w-md mx-auto leading-relaxed italic">"Execution is the only differentiator in a market flooded with mediocre ideas."</p>
             <div className="flex gap-4 justify-center">
               <Button onClick={() => handleCopy(JSON.stringify(result))} variant="primary">
                 <Copy size={16} className="mr-2" /> Copy Full Dossier
               </Button>
               <Button onClick={handleExportPDF} variant="secondary">
                 <FileText size={16} className="mr-2" /> Export to PDF
               </Button>
             </div>
          </div>
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
            {errorMessage && (
              <motion.div
                key="error-message"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {errorMessage}
              </motion.div>
            )}
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
