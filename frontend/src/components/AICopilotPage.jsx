import React, { useState, useEffect, useRef } from 'react';
import { aiChatService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AICopilotPage() {
  const { user } = useAuth();
  const storageKey = `capitallens_chat_history_${user?.id || 'guest'}`;

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
        content: 'Hello! Main aapka Capitallens AI Advisor hoon. Main aapke portfolio, active savings goals aur expense analytics ka use karke suggestions de sakta hoon. \n\nKaise madad karu aapki?'
      }
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);

  const messageEndRef = useRef(null);

  // Sync messages with localStorage and trigger custom event for floating widget
  const saveAndSyncMessages = (newMsgs) => {
    setMessages(newMsgs);
    localStorage.setItem(storageKey, JSON.stringify(newMsgs));
    window.dispatchEvent(new Event('capitallens_chat_sync'));
  };

  // Listen for changes from the floating widget
  useEffect(() => {
    const syncLogs = () => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('capitallens_chat_sync', syncLogs);
    return () => window.removeEventListener('capitallens_chat_sync', syncLogs);
  }, [storageKey]);

  // Auto Scroll
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Clear chat
  const handleClearChat = () => {
    const defaultMsg = [
      {
        role: 'assistant',
        content: 'Hello! Main aapka Capitallens AI Advisor hoon. Main aapke portfolio, active savings goals aur expense analytics ka use karke suggestions de sakta hoon. \n\nKaise madad karu aapki?'
      }
    ];
    saveAndSyncMessages(defaultMsg);
  };

  const presets = [
    { text: 'Mera savings rate kaisa hai?', cmd: 'Aap mere income, expenses aur savings rate ko compare karke ek general review dein.' },
    { text: 'Mera expense runway kitna safe hai?', cmd: 'Mera expense runway kitna safe hai aur isko calculate kaise kiya jata hai?' },
    { text: 'Portfolio status review', cmd: '/summary' },
    { text: 'Portfolio diversification check', cmd: 'Check if my current asset distribution is diversified enough and matches my risk profile.' }
  ];

  const slashCommands = [
    { name: '/summary', desc: 'Get portfolio summary', query: 'Summarize my overall financial health and suggest key actions.' },
    { name: '/savings', desc: 'Analyze active savings goals', query: 'List my current savings goals, show their progress, and evaluate if I am saving enough.' },
    { name: '/invest', desc: 'Get investment advisory picks', query: 'What are the top customized investment recommendations based on my risk profile and available cash?' },
    { name: '/help', desc: 'Explain chat capabilities', query: 'Show me what commands I can use and how this context-aware advisor can help me.' }
  ];

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    const updatedMsgs = [...messages, userMsg];
    saveAndSyncMessages(updatedMsgs);
    setInputVal('');
    setShowCommands(false);
    setIsLoading(true);

    try {
      const historyToSend = updatedMsgs.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiChatService.sendMessage(text, 'dashboard', historyToSend);
      saveAndSyncMessages([...updatedMsgs, { role: 'assistant', content: res.response || 'No response received.' }]);
    } catch (err) {
      saveAndSyncMessages([...updatedMsgs, { role: 'assistant', content: 'Connection issue. I was unable to connect to the advisor backend.' }]);
    } finally {
      setIsLoading(false);
    }
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

  // Export report
  const handleExportChat = () => {
    let reportContent = `========================================================\n`;
    reportContent += `       CAPITALLENS FINANCIAL ADVISORY REPORT (FULL WORKSPACE)\n`;
    reportContent += `========================================================\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

    messages.forEach((m, idx) => {
      const prefix = m.role === 'user' ? 'USER' : 'ADVISOR';
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
    link.download = `Capitallens_AI_FullReport_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Inline spacious rendering parser for full-page ChatGPT experience
  const renderMessageContent = (text) => {
    const parts = [];
    let lastIdx = 0;

    const comboRegex = /\[(?:action:navigate:[^:]+:[^\]]+|progress:[^:]+:\d+|chart:[^:]+:labels=[^:]+:values=[^:]+:title=[^\]]+|table:headers=[^:]+:rows=[^:]+:title=[^\]]+)\]/g;
    let match;

    while ((match = comboRegex.exec(text)) !== null) {
      const matchStr = match[0];
      const matchIdx = match.index;

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
      <div className="space-y-4 leading-relaxed whitespace-pre-line text-sm md:text-base font-normal">
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return <span key={idx} className="block text-[#dde2f3]">{part.content}</span>;
          } else if (part.type === 'action') {
            return (
              <span key={idx} className="block mt-2">
                <span className="text-xs text-on-surface-variant/70 italic mr-2">Quick Navigation:</span>
                <span className="bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-lg text-primary text-xs font-bold inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">explore</span>
                  {part.label} (Use Sidebar to switch)
                </span>
              </span>
            );
          } else if (part.type === 'progress') {
            return (
              <span key={idx} className="block my-3 p-4 bg-slate-900/60 rounded-xl border border-glass-border/30 max-w-sm">
                <span className="flex justify-between items-center text-sm font-bold text-text-primary mb-1">
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
            const chartLabels = part.labels.split(',');
            const chartValues = part.values.split(',').map(Number);
            const maxVal = Math.max(...chartValues, 1);

            return (
              <span key={idx} className="block my-4 p-5 bg-slate-950/70 border border-glass-border/30 rounded-xl max-w-2xl shadow-xl">
                <span className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                  <span className="font-headline font-bold text-sm text-text-primary">{part.title}</span>
                </span>
                
                {/* Inline SVGs Bar chart */}
                <div className="h-48 flex items-end justify-around gap-4 pt-4 border-b border-glass-border/15 relative">
                  {chartValues.map((val, bIdx) => {
                    const heightPct = (val / maxVal) * 80;
                    return (
                      <div key={bIdx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                        <span className="text-[10px] md:text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-[#080d19] border border-primary/20 px-1.5 py-0.5 rounded">
                          Rs. {val.toLocaleString('en-IN')}
                        </span>
                        <div
                          className="w-10 bg-gradient-to-t from-primary/70 to-secondary/90 rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(90,240,179,0.1)] group-hover:brightness-110 group-hover:shadow-[0_0_20px_rgba(90,240,179,0.3)]"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] md:text-xs text-on-surface-variant font-bold truncate max-w-[80px]">
                          {chartLabels[bIdx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </span>
            );
          } else if (part.type === 'table') {
            const headers = part.headers.split(',');
            const rows = part.rows.split(';').map(r => r.split('|'));

            return (
              <span key={idx} className="block my-4 overflow-x-auto border border-glass-border/30 rounded-xl shadow-xl max-w-3xl">
                <div className="p-3 bg-[#0c1220]/75 border-b border-glass-border/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">table_rows</span>
                  <span className="font-bold text-xs md:text-sm text-text-primary">{part.title}</span>
                </div>
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-[#05070e]/80 text-on-surface-variant/70 border-b border-glass-border/20 font-bold uppercase text-[10px]">
                      {headers.map((h, i) => (
                        <th key={i} className="py-3 px-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/10 bg-[#080d19]/40">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40 text-on-surface-variant/90 transition-all">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-3 px-4 font-medium">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </span>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full relative z-10 animate-fade-in">
      {/* Header bar */}
      <header className="flex justify-between items-center p-4 midnight-glass border border-glass-border/40 rounded-t-2xl bg-[#090e1c]/90">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <span className="material-symbols-outlined text-2xl">psychology</span>
          </div>
          <div>
            <h3 className="font-display-lg text-lg font-bold text-text-primary tracking-tight">AI Copilot Workspace</h3>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Console active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 hover:bg-rose-500/10 border border-glass-border/20 hover:border-rose-500/30 rounded-lg text-on-surface-variant hover:text-rose-expense text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Clear Chat History"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Clear History
          </button>

          <button
            onClick={handleExportChat}
            className="px-3 py-1.5 hover:bg-primary/10 border border-glass-border/20 hover:border-primary/30 rounded-lg text-on-surface-variant hover:text-primary text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Export Advisor logs"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export report
          </button>
        </div>
      </header>

      {/* Main chat viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#04060d]/65 border-x border-glass-border/40 scrollbar-thin">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-4`}
          >
            {m.role !== 'user' && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
            )}

            <div
              className={`p-4 max-w-[85%] rounded-2xl ${
                m.role === 'user'
                  ? 'bg-primary text-on-primary rounded-tr-none shadow-[0_4px_15px_rgba(90,240,179,0.15)] font-semibold'
                  : 'bg-[#0b101f]/80 border border-glass-border/25 rounded-tl-none shadow-md'
              }`}
            >
              {renderMessageContent(m.content)}
            </div>
          </div>
        ))}

        {/* Typing compilation indicator */}
        {isLoading && (
          <div className="flex justify-start items-start gap-4 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center flex-shrink-0 mt-1">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div className="bg-[#0b101f]/80 border border-glass-border/25 p-4 rounded-2xl rounded-tl-none flex flex-col gap-2 shadow-md">
              <div className="flex gap-1.5 items-center py-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-[10px] text-on-surface-variant/70 font-semibold uppercase tracking-wider animate-pulse">
                Copilot is compiling financial insights...
              </span>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Preset pills box */}
      {!isLoading && messages.length <= 6 && (
        <div className="px-6 py-3 border-x border-glass-border/40 bg-[#060a14]/65 flex gap-2 flex-wrap items-center">
          <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-wider mr-1">Suggestions:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset.cmd)}
              className="px-3 py-1.5 bg-[#162238]/40 hover:bg-[#1e2e4a]/75 border border-glass-border/20 text-on-surface-variant hover:text-text-primary rounded-full text-xs font-medium transition-all cursor-pointer"
            >
              {preset.text}
            </button>
          ))}
        </div>
      )}

      {/* Input panel container */}
      <footer className="p-4 midnight-glass border border-glass-border/40 rounded-b-2xl bg-[#090e1c]/95 relative">
        {/* Slash Commands Dropdown */}
        {showCommands && (
          <div className="absolute bottom-full left-4 right-4 mb-2 midnight-glass border border-glass-border rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-glass-border/15 z-50 animate-fade-in">
            <div className="px-4 py-2 text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest bg-slate-950/50">
              Copilot Shortcuts
            </div>
            {slashCommands.map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCommandSelect(cmd)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary/15 transition-all flex justify-between items-center text-xs md:text-sm font-bold group cursor-pointer"
              >
                <span className="text-primary font-outfit">{cmd.name}</span>
                <span className="text-on-surface-variant/70 group-hover:text-text-primary font-normal text-xs">
                  {cmd.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className="flex gap-3 relative"
        >
          <input
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            className="flex-1 bg-[#04060c] border border-glass-border/80 rounded-xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:border-primary/80 transition-all font-body placeholder:text-on-surface-variant/50 shadow-inner"
            placeholder="Type your message, ask for advisory portfolio suggestion, or use '/' for commands..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="px-5 bg-primary text-on-primary hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all rounded-xl flex items-center justify-center shadow-lg hover:shadow-primary/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </footer>
    </div>
  );
}
