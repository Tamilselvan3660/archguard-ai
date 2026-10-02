import React, { useState } from 'react';

export default function AICopilot({ scanData, initialPrompt, onShowToast }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I am your **ARCHGUARD AI Architecture Copilot**.\n\nI have parsed **${scanData?.elements?.length || 9} software components** and detected **${scanData?.violations?.length || 3} architectural drift violations** with an overall system health score of **${scanData?.health?.overallHealth || 81}/100**.\n\nHow can I help you refactor, inspect dependency cycles, or draft architectural decision records today?`,
      evidence: null,
      recommendation: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (queryText) => {
    const text = queryText || inputQuery;
    if (!text || isLoading) return;

    const userMsg = { 
      sender: 'user', 
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      const data = await res.json();

      const aiMsg = {
        sender: 'ai',
        text: data.answer,
        evidence: data.evidence,
        recommendation: data.recommendation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Apologies, failed to connect to the ARCHGUARD AI Copilot backend engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (content) => {
    navigator.clipboard?.writeText(content);
    if (onShowToast) onShowToast('Copied response to clipboard!');
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">AI Architect Copilot</h1>
          <div className="page-subtitle">
            Context-aware LLM intelligence grounded strictly in verified static analysis AST graphs and empirical drift telemetry.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ 
            fontSize: '0.78rem', 
            background: 'rgba(168,85,247,0.12)', 
            border: '1px solid rgba(168,85,247,0.3)', 
            color: 'var(--accent-purple)', 
            padding: '5px 12px', 
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-mono)' 
          }}>
            ⚡ ARCHGUARD LLM REASONER
          </span>
        </div>
      </div>

      {/* Main Chat Shell */}
      <div className="copilot-container">
        {/* Chat Messages */}
        <div className="chat-log">
          {messages.map((m, index) => (
            <div 
              key={index} 
              className={`chat-bubble ${m.sender}`}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ 
                  color: m.sender === 'user' ? 'var(--accent-cyan)' : 'var(--accent-purple)', 
                  fontWeight: 700 
                }}>
                  {m.sender === 'user' ? '👤 LEAD ARCHITECT' : '🤖 ARCHGUARD AI AGENT'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {m.timestamp}
                </span>
              </div>

              <div style={{ fontSize: '0.94rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {m.text}
              </div>

              {m.evidence && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    EMPIRICAL GRAPH TELEMETRY EVIDENCE:
                  </div>
                  <div className="code-box" style={{ fontSize: '0.8rem' }}>
                    {m.evidence}
                  </div>
                </div>
              )}

              {m.recommendation && (
                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '0.86rem', 
                  color: 'var(--accent-emerald)', 
                  background: 'rgba(16,185,129,0.08)', 
                  padding: '10px 14px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid rgba(16,185,129,0.2)' 
                }}>
                  💡 <strong>Suggested Refactoring Action:</strong> {m.recommendation}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  className="btn-secondary" 
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => handleCopyText(m.text)}
                >
                  📋 Copy
                </button>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="pulse-dot" style={{ background: 'var(--accent-purple)' }}></span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                AI Architect is querying AST dependency matrices and evaluating refactoring steps...
              </span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="prompt-chips-wrap">
          <button 
            className="prompt-chip" 
            onClick={() => handleSend('Why is my architecture unhealthy?')}
          >
            ❓ Why is my architecture unhealthy?
          </button>
          <button 
            className="prompt-chip" 
            onClick={() => handleSend('Show circular dependencies')}
          >
            🔄 Show circular dependencies
          </button>
          <button 
            className="prompt-chip" 
            onClick={() => handleSend('Which module is most coupled?')}
          >
            🔥 Which module is most coupled?
          </button>
          <button 
            className="prompt-chip" 
            onClick={() => handleSend('Draft an ADR for presentation layer isolation')}
          >
            📜 Draft an ADR for presentation isolation
          </button>
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input 
            type="text" 
            className="chat-input"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Architect about drift violations, refactoring patterns, or ADR rules..."
          />
          <button 
            className="btn-primary" 
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuery.trim()}
            style={{ padding: '12px 20px' }}
          >
            Send Query →
          </button>
        </div>
      </div>
    </div>
  );
}
