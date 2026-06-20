import React, { useState, useEffect, useRef } from 'react';
import { aiChatService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatAssistant({ activeTab, setActiveTab, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }) {
  const { user } = useAuth();
  const storageKey = `capitallens_chat_history_${user?.id || 'guest'}`;

  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
  const setIsOpen = externalSetIsOpen !== undefined ? externalSetIsOpen : setLocalIsOpen;
  const [zoomType, setZoomType] = useState(null); // 'chart' | 'table' | null
  const [zoomData, setZoomData] = useState(null);
  
  // Load messages from localStorage, or use default welcome message
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: "Hello! I'm your **Capitallens AI Advisor**. I can analyze your portfolio, savings goals, and expense data to give you personalized suggestions.\n\nYou can ask me about any section (Dashboard, Savings, Analytics, Investments). How can I help you today? [action:navigate:analytics:View Spending Trends]"
      }
    ];
  });
  
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);

  const messageEndRef = useRef(null);

  // Sync messages with localStorage whenever they change (cap at 50 to avoid quota errors)
  useEffect(() => {
    const capped = messages.slice(-50);
    localStorage.setItem(storageKey, JSON.stringify(capped));
  }, [messages, storageKey]);

  // Escape keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCommands) {
          setShowCommands(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommands, isOpen]);

  // Clear history handler
  const handleClearChat = () => {
    const defaultMsg = [
      {
        role: 'assistant',
        content: "Hello! I'm your **Capitallens AI Advisor**. I can analyze your portfolio, savings goals, and expense data to give you personalized suggestions.\n\nYou can ask me about any section (Dashboard, Savings, Analytics, Investments). How can I help you today? [action:navigate:analytics:View Spending Trends]"
      }
    ];
    setMessages(defaultMsg);
  };

  // Auto Scroll to Bottom on new messages
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Tab presets to show at the top of the chat area
  const presetsByTab = {
    dashboard: [
      { text: 'Portfolio status review', cmd: '/summary' },
      { text: 'Mera savings rate kaisa hai?', cmd: 'Aap mere income, expenses aur savings rate ko compare karke ek general review dein.' },
      { text: 'Runway detail explain karein', cmd: 'Mera expense runway kitna safe hai aur isko calculate kaise kiya jata hai?' }
    ],
    analytics: [
      { text: 'Compare income vs expenses', cmd: 'Mere current active budget range me income aur expense dynamics ko analyze karein.' },
      { text: 'Where am I spending most?', cmd: 'Mera major expense categories breakdown dikhayein aur suggest karein budget savings.' },
      { text: 'How to reduce expenses?', cmd: 'Hinglish me bataiye ki main apne discretionary spendings ko kaise cut-down kar sakta hoon?' }
    ],
    savings: [
      { text: 'Check savings goals progress', cmd: '/savings' },
      { text: 'Emergency fund benchmark check', cmd: 'Am I safe with my emergency fund reserves? Calculate standard benchmark.' },
      { text: 'How to achieve car goal faster?', cmd: 'Hinglish me advice dein ki main apne target goals ko fast kaise achieve karu.' }
    ],
    investments: [
      { text: 'Suggest allocation for ₹10,000', cmd: '/invest' },
      { text: 'Portfolio diversification check', cmd: 'Check if my current asset distribution is diversified enough and matches my risk profile.' },
      { text: 'Explain CAGR returns', cmd: 'Investments me historical CAGR return aur absolute returns ke significance ko samjhayein.' }
    ]
  };

  const activePresets = presetsByTab[activeTab] || presetsByTab['dashboard'];

  // Slash commands mapping
  const slashCommands = [
    { name: '/summary', desc: 'Get portfolio summary', query: 'Summarize my overall financial health and suggest key actions.' },
    { name: '/savings', desc: 'Analyze active savings goals', query: 'List my current savings goals, show their progress, and evaluate if I am saving enough.' },
    { name: '/invest', desc: 'Get investment advisory picks', query: 'What are the top customized investment recommendations based on my risk profile and available cash?' },
    { name: '/help', desc: 'Explain chat capabilities', query: 'Show me what commands I can use and how this context-aware advisor can help me.' }
  ];

  // Send request to API
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setShowCommands(false);
    setIsLoading(true);

    try {
      // Keep only last 10 messages for prompt efficiency
      const historyToSend = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiChatService.sendMessage(text, activeTab, historyToSend);
      setMessages(prev => [...prev, { role: 'assistant', content: res.response || 'No response received.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. I was unable to connect to the advisor backend.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (preset) => {
    handleSendMessage(preset.cmd);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    if (val.startsWith('/')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (cmd) => {
    setInputVal('');
    setShowCommands(false);
    handleSendMessage(cmd.query);
  };

  // Helper to change dashboard tabs dynamically from chat action buttons
  const handleActionNavigate = (targetTab) => {
    if (['dashboard', 'analytics', 'savings', 'investments', 'transactions'].includes(targetTab)) {
      setActiveTab(targetTab);
    }
  };

  // Export report logic (TXT/Markdown download format)
  const handleExportChat = () => {
    let reportContent = `========================================================\n`;
    reportContent += `       CAPITALLENS FINANCIAL ADVISORY REPORT\n`;
    reportContent += `========================================================\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n`;
    reportContent += `Current Dashboard Tab: ${activeTab.toUpperCase()}\n\n`;

    messages.forEach((m, idx) => {
      const prefix = m.role === 'user' ? 'USER' : 'ADVISOR';
      // Strip action/progress/chart/table codes from printed output for clean aesthetics
      const cleanContent = m.content
        .replace(/\[action:navigate:[^:]+:[^\]]+\]/g, '')
        .replace(/\[progress:([^:]+):(\d+)\]/g, '$1 ($2%)')
        .replace(/\[chart:[^:]+:labels=[^:]+:values=[^:]+:title=([^\]]+)\]/g, '[$1 Chart Preview]')
        .replace(/\[table:headers=[^:]+:rows=[^:]+:title=([^\]]+)\]/g, '[$1 Table Preview]');

      reportContent += `[${prefix}] (${idx + 1}):\n${cleanContent}\n\n`;
      reportContent += `--------------------------------------------------------\n`;
    });

    reportContent += `\n*Disclaimer: AI-generated advisory logs are for educational purposes. Consult SEBI-registered professionals for active market allocations.*\n`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Capitallens_AI_Report_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Content rendering parser to display beautiful markdown layout, actions, and progress UI
  const renderMessageContent = (text) => {
    const parts = [];
    let lastIdx = 0;

    // We process the text sequentially to find progress, action, chart, or table tags
    const comboRegex = /\[(?:action:navigate:[^:]+:[^\]]+|progress:[^:]+:\d+|chart:[^:]+:labels=[^:]+:values=[^:]+:title=[^\]]+|table:headers=[^:]+:rows=[^:]+:title=[^\]]+)\]/g;
    let match;

    while ((match = comboRegex.exec(text)) !== null) {
      const matchStr = match[0];
      const matchIdx = match.index;

      // Push raw text leading to the tag
      if (matchIdx > lastIdx) {
        parts.push({ type: 'text', content: text.substring(lastIdx, matchIdx) });
      }

      if (matchStr.startsWith('[action:')) {
        const details = /\[action:navigate:([^:]+):([^\]]+)\]/.exec(matchStr);
        if (details) {
          parts.push({ type: 'action', tab: details[1], label: details[2] });
        }
      } else if (matchStr.startsWith('[progress:')) {
        const details = /\[progress:([^:]+):(\d+)\]/.exec(matchStr);
        if (details) {
          parts.push({ type: 'progress', label: details[1], percentage: parseInt(details[2], 10) });
        }
      } else if (matchStr.startsWith('[chart:')) {
        const details = /\[chart:([^:]+):labels=([^:]+):values=([^:]+):title=([^\]]+)\]/.exec(matchStr);
        if (details) {
          parts.push({ type: 'chart', chartType: details[1], labels: details[2], values: details[3], title: details[4] });
        }
      } else if (matchStr.startsWith('[table:')) {
        const details = /\[table:headers=([^:]+):rows=([^:]+):title=([^\]]+)\]/.exec(matchStr);
        if (details) {
          parts.push({ type: 'table', headers: details[1], rows: details[2], title: details[3] });
        }
      }

      lastIdx = comboRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIdx) });
    }

    return (
      <div className="space-y-2 leading-relaxed whitespace-pre-line text-xs md:text-sm font-medium">
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            // Render simple markdown: **bold**, *italic*, \n line breaks
            const renderMarkdownText = (raw) => {
              const lines = raw.split('\n');
              return lines.map((line, li) => {
                // Split on **bold** and *italic*
                const segments = [];
                const mdRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
                let last = 0;
                let m;
                while ((m = mdRegex.exec(line)) !== null) {
                  if (m.index > last) segments.push({ t: 'plain', v: line.slice(last, m.index) });
                  if (m[0].startsWith('**')) segments.push({ t: 'bold', v: m[0].slice(2, -2) });
                  else segments.push({ t: 'italic', v: m[0].slice(1, -1) });
                  last = mdRegex.lastIndex;
                }
                if (last < line.length) segments.push({ t: 'plain', v: line.slice(last) });
                return (
                  <span key={li}>
                    {segments.map((s, si) =>
                      s.t === 'bold' ? <strong key={si} className="font-bold text-text-primary">{s.v}</strong>
                      : s.t === 'italic' ? <em key={si} className="italic">{s.v}</em>
                      : <span key={si}>{s.v}</span>
                    )}
                    {li < lines.length - 1 && <br />}
                  </span>
                );
              });
            };
            return <span key={idx}>{renderMarkdownText(part.content)}</span>;
          } else if (part.type === 'action') {
            return (
              <span key={idx} className="block mt-1">
                <button
                  onClick={() => handleActionNavigate(part.tab)}
                  className="px-3 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">explore</span>
                  {part.label}
                </button>
              </span>
            );
          } else if (part.type === 'progress') {
            return (
              <span key={idx} className="block my-2 p-3 bg-slate-900/50 rounded-xl border border-glass-border/20 max-w-xs">
                <span className="flex justify-between items-center text-xs font-bold text-text-primary mb-1">
                  <span>{part.label}</span>
                  <span className="text-primary">{part.percentage}%</span>
                </span>
                <span className="block w-full bg-[#1e293b]/60 h-2 rounded-full overflow-hidden">
                  <span
                    className="block bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${part.percentage}%` }}
                  />
                </span>
              </span>
            );
          } else if (part.type === 'chart') {
            return (
              <span key={idx} className="block my-2 p-3 bg-slate-900/60 rounded-xl border border-glass-border/25 flex items-center justify-between gap-3 text-text-primary">
                <span className="flex items-center gap-2 text-left">
                  <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                  <span className="block">
                    <span className="text-xs font-bold text-text-primary block">{part.title}</span>
                    <span className="text-[10px] text-on-surface-variant/70">Interactive Bar Graph</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setZoomType('chart');
                    setZoomData({
                      type: part.chartType,
                      labels: part.labels.split(','),
                      values: part.values.split(',').map(Number),
                      title: part.title
                    });
                  }}
                  className="px-2.5 py-1 bg-primary text-on-primary hover:brightness-110 text-[10px] md:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  Open Chart
                </button>
              </span>
            );
          } else if (part.type === 'table') {
            return (
              <span key={idx} className="block my-2 p-3 bg-slate-900/60 rounded-xl border border-glass-border/25 flex items-center justify-between gap-3 text-text-primary">
                <span className="flex items-center gap-2 text-left">
                  <span className="material-symbols-outlined text-primary text-xl">table_rows</span>
                  <span className="block">
                    <span className="text-xs font-bold text-text-primary block">{part.title}</span>
                    <span className="text-[10px] text-on-surface-variant/70">Structured Data Table</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setZoomType('table');
                    setZoomData({
                      headers: part.headers.split(','),
                      rows: part.rows.split(';').map(r => r.split('|')),
                      title: part.title
                    });
                  }}
                  className="px-2.5 py-1 bg-primary text-on-primary hover:brightness-110 text-[10px] md:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  View Table
                </button>
              </span>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className={isOpen 
      ? "fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[99] flex flex-col" 
      : "fixed bottom-6 right-6 z-[99] flex flex-col items-end"
    }>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-on-primary border border-glass-border/30 animate-fade-in group cursor-pointer"
          title="Open AI Command Advisor"
        >
          <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">
            forum
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="w-full sm:w-[400px] h-full sm:h-[500px] midnight-glass border-0 sm:border border-glass-border rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in transition-all">
          {/* Header Panel */}
          <header 
            onClick={(e) => {
              if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                setIsOpen(false);
              }
            }}
            className="p-3.5 border-b border-glass-border/30 bg-[#0a0f1d]/90 flex justify-between items-center cursor-pointer select-none"
            title="Click to minimize"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-text-primary font-headline">AI Command Advisor</h4>
                <p className="text-[10px] text-on-surface-variant/70 font-semibold tracking-wider">
                  Context: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Clear Chat History */}
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-rose-500/10 rounded-lg text-on-surface-variant hover:text-rose-expense transition-all cursor-pointer"
                title="Clear History"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>

              {/* Export PDF/TXT Button */}
              <button
                onClick={handleExportChat}
                className="p-1.5 hover:bg-[#1e293b]/60 rounded-lg text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                title="Export Chat Log"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
              </button>

              {/* Minimize/Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-rose-500/10 rounded-lg text-on-surface-variant hover:text-rose-expense transition-all cursor-pointer"
                title="Minimize Advisor"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </header>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
              >
                {m.role !== 'user' && (
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-lg text-[16px] flex-shrink-0 mt-1">
                    smart_toy
                  </span>
                )}
                
                <div
                  className={`p-3 max-w-[82%] rounded-2xl text-xs md:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-none'
                      : 'bg-[#111827]/70 border border-glass-border/20 text-text-primary rounded-tl-none font-medium'
                  }`}
                >
                  {renderMessageContent(m.content)}
                </div>
              </div>
            ))}

            {/* Generating response indicator (SaaS Typing indicator) */}
            {isLoading && (
              <div className="flex justify-start items-start gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-lg text-[16px] flex-shrink-0 mt-1">
                  smart_toy
                </span>
                <div className="bg-[#111827]/70 border border-glass-border/20 p-3.5 rounded-2xl rounded-tl-none flex flex-col gap-1.5">
                  <div className="flex gap-1 items-center py-1 px-0.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/70 font-semibold uppercase tracking-wider animate-pulse">
                    Advisor is compiling insights
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messageEndRef} />
          </div>

          {/* Command Presets Box */}
          {!isLoading && messages.length <= 6 && (
            <div className="relative w-full border-t border-glass-border/10 bg-[#070b14]/50 overflow-hidden">
              {/* Left scroll fade */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#070b14] to-transparent pointer-events-none z-10"></div>
              {/* Right scroll fade */}
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#070b14] to-transparent pointer-events-none z-10"></div>

              <div className="px-3.5 py-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
                {activePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset)}
                    className="px-2.5 py-1 bg-[#1e293b]/40 hover:bg-[#1e293b]/70 border border-glass-border/20 text-on-surface-variant hover:text-text-primary rounded-full text-[10px] md:text-xs font-bold transition-all cursor-pointer"
                  >
                    {preset.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Form Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="p-3 border-t border-glass-border/20 bg-[#0a0f1d]/90 relative"
          >
            {/* Slash Commands Dropdown */}
            {showCommands && (
              <div className="absolute bottom-full left-0 right-0 m-2 midnight-glass border border-glass-border rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-glass-border/15 z-50">
                <div className="px-3 py-1.5 text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest bg-slate-950/40">
                  Quick Shortcuts
                </div>
                {slashCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCommandSelect(cmd)}
                    className="w-full text-left px-3 py-2 hover:bg-primary/15 transition-all flex justify-between items-center text-xs font-bold group cursor-pointer"
                  >
                    <span className="text-primary font-outfit">{cmd.name}</span>
                    <span className="text-on-surface-variant/70 group-hover:text-text-primary font-normal text-[10px] md:text-xs">
                      {cmd.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 relative">
              <input
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                className="flex-1 bg-[#05070f] border border-glass-border rounded-xl px-3 py-2 text-xs md:text-sm font-medium text-text-primary outline-none focus:border-primary/70 transition-all font-body pr-8 placeholder:text-on-surface-variant/50"
                placeholder="Ask about savings, investments or type '/'..."
                disabled={isLoading}
              />
              
              <button
                type="submit"
                disabled={isLoading || !inputVal.trim()}
                className="px-3.5 bg-primary text-on-primary hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all rounded-xl flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] md:text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zoom Modal Overlay */}
      {zoomType && zoomData && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl midnight-glass border border-glass-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <header className="p-4 border-b border-glass-border/30 bg-[#0a0f1d]/90 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {zoomType === 'chart' ? 'bar_chart' : 'table_chart'}
                </span>
                <h3 className="text-sm md:text-base font-bold text-text-primary font-headline">
                  {zoomData.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setZoomType(null);
                  setZoomData(null);
                }}
                className="text-on-surface-variant hover:text-rose-expense transition-all p-1 bg-surface-variant/10 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>

            {/* Content Body */}
            <div className="flex-1 overflow-auto p-6 bg-slate-950/40 min-h-[300px]">
              {zoomType === 'chart' ? (
                /* Premium Rendered SVG/CSS Chart */
                <div className="h-64 flex flex-col justify-end relative pt-6 px-4 border-b border-glass-border/20">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-glass-border/10 w-full h-0"></div>
                    <div className="border-t border-glass-border/10 w-full h-0"></div>
                    <div className="border-t border-glass-border/10 w-full h-0"></div>
                    <div className="border-t border-glass-border/10 w-full h-0"></div>
                  </div>

                  {/* Bars Container */}
                  <div className="flex items-end justify-around h-full relative z-10 gap-3">
                    {(() => {
                      const maxVal = Math.max(...zoomData.values, 1);
                      return zoomData.values.map((val, idx) => {
                        const heightPct = (val / maxVal) * 82; // Cap at 82% height to leave spacing for values labels
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            {/* Value tooltip */}
                            <div className="text-[10px] md:text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded opacity-90 group-hover:scale-105 transition-all">
                              ₹{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            {/* Styled Bar */}
                            <div
                              className="w-8 md:w-12 bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all duration-700 shadow-md group-hover:brightness-110 group-hover:shadow-primary/25 cursor-pointer"
                              style={{ height: `${heightPct}%` }}
                            />
                            {/* Axis Label */}
                            <div className="text-[9px] md:text-xs text-on-surface-variant font-bold truncate max-w-[80px] md:max-w-[110px]" title={zoomData.labels[idx]}>
                              {zoomData.labels[idx]}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                /* Premium Glassmorphic Table */
                <div className="border border-glass-border/25 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-[#0c1220]/75 border-b border-glass-border/30 text-on-surface-variant/60 font-bold uppercase text-[10px] md:text-xs">
                        {zoomData.headers.map((h, i) => (
                          <th key={i} className="py-3 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/10">
                      {zoomData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/35 font-medium text-text-primary transition-all">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-3 px-4 text-on-surface-variant/90">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="p-4 border-t border-glass-border/30 bg-[#0a0f1d]/90 flex justify-end">
              <button
                onClick={() => {
                  setZoomType(null);
                  setZoomData(null);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Report
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
