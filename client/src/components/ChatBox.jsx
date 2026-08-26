import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { apiFetch, API_BASE } from '../services/api';

export default function ChatBox({ collectionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsScrolledUp(!isNearBottom);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const convos = await apiFetch(`/chat/${collectionId}/conversations`);
        if (convos && convos.length > 0) {
          const latestConvoId = convos[0]._id;
          setConversationId(latestConvoId);
          const msgs = await apiFetch(`/chat/${collectionId}/conversations/${latestConvoId}/messages`);
          if (msgs) setMessages(msgs);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };
    
    fetchHistory();

    const handleUpdate = (e) => setDocCount(e.detail);
    window.addEventListener('doc-count-update', handleUpdate);
    return () => window.removeEventListener('doc-count-update', handleUpdate);
  }, [collectionId]);

  useEffect(() => {
    if (!isScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isScrolledUp]);

  const handleQuickAction = async (prompt) => {
    if (docCount === 0) {
      alert("Please upload at least 1 document to the sidebar first before asking me to analyze it!");
      return;
    }
    
    if (prompt === 'Compare documents' && docCount < 2) {
      alert("Please upload at least 2 documents before comparing them!");
      return;
    }

    handleSubmit(null, prompt);
  };

  const handleSubmit = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || isStreaming) return;

    if (docCount === 0) {
      alert("Please upload at least 1 document to the sidebar first before chatting!");
      return;
    }

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Initial placeholder for assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '', citations: [] }]);

    try {
      const response = await fetch(`${API_BASE}/chat/${collectionId}/query`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: userMessage.content, conversationId })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n').filter(Boolean);
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'conversation_info') {
                setConversationId(data.conversationId);
              } else if (data.type === 'citations') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  newMsgs[newMsgs.length - 1] = { ...lastMsg, citations: data.citations };
                  return newMsgs;
                });
              } else if (data.content) {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  newMsgs[newMsgs.length - 1] = { ...lastMsg, content: lastMsg.content + data.content };
                  return newMsgs;
                });
              } else if (data.type === 'done') {
                // stream finished
              }
            } catch (err) {
              console.error('Error parsing SSE data', err);
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = 'Sorry, an error occurred while processing your request.';
        return newMsgs;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-secondary relative min-h-0">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-10 px-6 min-h-0"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          {messages.length === 0 && (
            <div className="text-center text-text-secondary mt-20 flex flex-col items-center">
              <div className="inline-flex p-5 bg-white/5 rounded-[20px] mb-6 border border-white/5">
                <Bot size={40} className="text-text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary mb-2">How can I help you today?</h2>
              <p className="text-[15px] mb-10">Upload your documents and I'll analyze them for you.</p>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                {['Summarize a document', 'Ask a question', 'Extract key points', 'Compare documents'].map(prompt => (
                  <button 
                    key={prompt}
                    className="btn-secondary py-2.5 px-4 rounded-full text-[13px] bg-white/5 border-white/10"
                    onClick={() => handleQuickAction(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`animate-fade-in flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.role === 'user' ? 'bg-gradient-to-br from-accent-primary to-accent-hover' : 'bg-bg-glass'}`}>
                {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-accent-primary" />}
              </div>
              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {(() => {
                  let displayContent = msg.content;
                  let visibleCitations = msg.citations || [];
                  
                  if (msg.role === 'assistant') {
                    const citeMatch = displayContent.match(/<cite>(.*?)<\/cite>/);
                    if (citeMatch) {
                      const citedIndices = citeMatch[1].split(',').map(n => parseInt(n.trim()) - 1);
                      visibleCitations = citedIndices.map(i => visibleCitations[i]).filter(Boolean);
                      displayContent = displayContent.replace(/<cite>.*?<\/cite>/g, '').trim();
                    } else {
                      // If it's still streaming, or if the AI never output a <cite> tag at all 
                      // (e.g. it said "I couldn't find info"), we should hide all citations.
                      visibleCitations = [];
                    }
                  }

                  return (
                    <>
                      <div className={`py-4 px-5 leading-relaxed text-text-primary text-[15px] whitespace-pre-wrap shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-500/15 border border-blue-500/30 rounded-[20px_20px_4px_20px]' 
                          : 'bg-bg-glass border border-border-color rounded-[20px_20px_20px_4px]'
                      }`}>
                        {displayContent}
                        {msg.role === 'assistant' && msg.content === '' && isStreaming && <span className="animate-pulse">▌</span>}
                      </div>
                      
                      {visibleCitations.length > 0 && (
                        <div className="mt-3 text-xs flex flex-wrap gap-2">
                          {visibleCitations.map((c, i) => (
                            <div key={i} className="bg-bg-glass py-1.5 px-3 rounded-xl border border-border-highlight text-text-secondary flex items-center gap-1.5">
                              <span className="text-accent-primary">Source:</span> {c.documentName}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="py-8 px-6 bg-gradient-to-t from-bg-secondary via-bg-secondary/90 to-transparent">
        <div className="max-w-3xl mx-auto relative">
          {isScrolledUp && (
            <button
              onClick={() => {
                setIsScrolledUp(false);
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-bg-glass border border-border-color text-text-primary py-2 px-4 rounded-full text-xs cursor-pointer shadow-md z-10 hover:bg-white/10 transition-colors"
            >
              ↓ Scroll to bottom
            </button>
          )}
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your documents..."
              className="input-field pr-16 rounded-full bg-bg-primary border-border-color h-14 text-[15px]"
              disabled={isStreaming}
            />
            <button 
              type="submit" 
              className={`absolute right-2 w-10 h-10 flex items-center justify-center rounded-full border-none transition-all duration-200 ${
                input.trim() && !isStreaming 
                  ? 'bg-gradient-to-br from-accent-primary to-accent-hover text-white cursor-pointer shadow-md hover:scale-105 active:scale-95' 
                  : 'bg-bg-glass text-text-secondary cursor-default'
              }`}
              disabled={!input.trim() || isStreaming}
            >
              <Send size={18} className="-translate-x-px" />
            </button>
          </form>
          <div className="text-center mt-3 text-[11px] text-text-secondary opacity-60">
            DocQ can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  );
}
