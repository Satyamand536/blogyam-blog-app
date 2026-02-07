import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AIAssistant({ contextContent, initialContext }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: "Hello! I'm your AI-powered reading assistant. Ask me to summarize this blog or explain complex terms." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (initialContext) {
            setIsOpen(true);
            const userMsg = { role: 'user', content: initialContext.prompt };
            setMessages(prev => [...prev, userMsg]);
            handleSend(initialContext.prompt, initialContext.type, true);
        }
    }, [initialContext]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (text = input, type = 'chat', isInitial = false) => {
        if (!text.trim()) return;

        // AUTH GATE: AI is for Registered Members
        if (!user) {
            setMessages(prev => [...prev, { 
                role: 'system', 
                content: "I'd love to help you with that! 😊 But first, you'll need to join our community to unlock AI features.",
                isAuthPrompt: true
            }]);
            setInput('');
            return;
        }
        
        let newMessages = messages;
        if (!isInitial) {
             const userMsg = { role: 'user', content: text };
             newMessages = [...messages, userMsg];
             setMessages(newMessages);
        } else {
            // For initial, messages state is already updated in useEffect, but we need the array for API
            // However, state update is async, so best to construct it here exactly as we expect it
            newMessages = [...messages, { role: 'user', content: text }];
        }

        setInput('');
        setLoading(true);

        try {
            let payload = { type, content: text };

            if (type === 'chat') {
                // If chat, send full history.
                // Filter out system greeting from the API payload if needed, or keep it.
                // OpenRouter/My Backend expects standard roles. The first "system" message in state is actually visible text.
                // The REAL system prompt is injected in backend. 
                // So we can send everything, but maybe map "system" (our greeting) to "assistant" or just send user/assistant pairs.
                // Let's send all user/assistant messages.
                // Important: If contextContent exists (we are on a blog), prepend it as context if it's the first query or just let backend handle?
                // Plan: Append context to the *latest* user message if it's not already there? 
                // Better: If we have contextContent, add a hidden system/user message with context?
                // Actually, the simplest way is to rely on what I wrote in the plan: "Context: ... Question: ..."
                // But since we are sending history, we should only add context ONCE.
                // Let's just pass `messages`. My backend `apiController` takes `messages`.
                
                // transform messages for API: remove our local "system" greeting if strictly needed, 
                // but "system" role is fine for history.
                // However, I'll filter the very first greeting if it's just ID greeting. 
                // Actually, let's just send the whole thing.
                
                // If context exists, and it's a new chat, we might want to inject it.
                // But for now, let's stick to the prompt engineering in backend or just passing current text.
                // WAIT: If I use `messages` in backend, I need to send `messages` here.
                
                const apiMessages = newMessages.map(m => ({
                    role: m.role === 'system' ? 'assistant' : m.role, // changing our visible system greeting to assistant for API consistency
                    content: m.content
                }));
                
                // If we have blog context, maybe insert it as a system message at start?
                if (contextContent) {
                    apiMessages.unshift({
                        role: 'user',
                        content: `Context for the following questions (Blog Content):\n"${contextContent.substring(0, 2000)}..."` // Truncate to avoid huge payload
                    });
                }
                
                payload = { type: 'chat', messages: apiMessages };
            } else if (type === 'summarize') {
                 // Summarize expects 'content'
                 payload = { type: 'summarize', content: contextContent || text };
            } else if (type === 'explain') {
                 payload = { type: 'explain', content: text };
            }

            const { data } = await api.post('/ai/assist', payload);
            
            if (data.success) {
                setMessages(prev => [...prev, { role: 'system', content: data.response }]); // Display as system/assistant
            } else {
                 setMessages(prev => [...prev, { role: 'system', content: "Sorry, I encountered an issue." }]);
            }
        } catch (error) {
            console.error("AI Error:", error);
            if (error.response && error.response.status === 429) {
                setNotification("you can ask only 5 questions in a minute");
                setMessages(prev => [...prev, { role: 'system', content: "Rate limit reached. Please wait a moment." }]);
            } else {
                setMessages(prev => [...prev, { role: 'system', content: "Error communicating with AI service." }]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="fixed sm:bottom-6 sm:right-6 bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 animate-bounce"
                >
                    <Bot size={24} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div 
                    className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[500px] sm:max-h-[80vh] sm:rounded-2xl shadow-2xl border flex flex-col z-50 animate-slide-up overflow-hidden transition-all duration-500 backdrop-blur-xl bg-opacity-70 dark:bg-opacity-60 border-slate-200/50 dark:border-slate-700/50"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                    {/* Header with Glassmorphism */}
                    <div className="bg-gradient-to-r from-primary-600/90 to-indigo-600/90 backdrop-blur-sm p-4 flex justify-between items-center text-white border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2">
                             <Bot size={20} />
                             <h3 className="font-medium font-serif">AI Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Rate Limit Warning Notification */}
                    {notification && (
                        <div className="mx-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-between gap-2 border border-red-400/50">
                                <span className="text-xs font-bold leading-tight flex-1">
                                    {notification}
                                </span>
                                <button 
                                    onClick={() => setNotification(null)}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
                                >
                                    <X size={14} />
                                </button>
                             </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-primary)] dark:bg-slate-900/40 transition-colors duration-500 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary-600 text-white rounded-tr-none' 
                                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none'
                                }`}
                                style={msg.role !== 'user' ? { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' } : {}}
                                >
                                    {msg.content}
                                    {msg.isAuthPrompt && (
                                        <div className="mt-3">
                                            <Link 
                                                to={user ? "/create" : "/signup"} 
                                                onClick={() => setIsOpen(false)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold text-xs hover:bg-primary-700 transition-all"
                                            >
                                                <UserPlus size={14} /> Join Now
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 transition-colors duration-500">
                                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div 
                        className="p-4 border-t transition-colors duration-500 shrink-0"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                        <div className="relative flex items-end gap-2 w-full">
                            <div className="relative flex-1 group">
                                <textarea
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto'; 
                                        e.target.style.height = (Math.min(e.target.scrollHeight, 120)) + 'px';
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                            e.target.style.height = 'auto'; 
                                        }
                                    }}
                                    placeholder="Ask about this blog..."
                                    className="w-full pl-4 pr-16 py-3 border border-[var(--border-color)] dark:border-slate-600 bg-[var(--bg-primary)] dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm placeholder-slate-500 resize-none overflow-y-auto custom-scrollbar transition-all duration-300 min-h-[48px] max-h-[120px] leading-relaxed shadow-sm"
                                    rows={1}
                                />
                                <button 
                                    onClick={() => handleSend()}
                                    disabled={loading || !input.trim()}
                                    className="absolute right-5 bottom-2 p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-full transition-all disabled:opacity-30 flex items-center justify-center z-10"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
