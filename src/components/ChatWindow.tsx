'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';

interface ChatWindowProps {
    messages: ChatMessage[];
    typingText: string;      // text revealed so far by typewriter
    isFetching: boolean;     // waiting for AI response (show dots)
    isTyping: boolean;       // typewriter animation in progress (show bubble)
    onSendMessage: (message: string) => void;
}

const SUGGESTIONS = [
    'How should I warm up?',
    'Best exercises for chest?',
    'How much protein do I need?',
    'Tips for progressive overload',
];

function Cursor() {
    return (
        <span style={{
            display: 'inline-block', width: '2px', height: '1em',
            background: 'var(--color-accent)', marginLeft: '2px', verticalAlign: 'text-bottom',
            animation: 'blink 0.7s step-end infinite',
        }} />
    );
}

function AiAvatar() {
    return (
        <div style={{
            width: '28px', height: '28px', borderRadius: '10px', flexShrink: 0,
            background: 'var(--color-accent-soft)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', marginRight: '8px', marginTop: '2px',
        }}>🤖</div>
    );
}

export default function ChatWindow({ messages, typingText, isFetching, isTyping, onSendMessage }: ChatWindowProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const blocked = isFetching || isTyping;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingText]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !blocked) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 5rem)' }}>

            {/* ── MESSAGES AREA ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>

                {/* Empty state */}
                {messages.length === 0 && !blocked && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', height: '100%', textAlign: 'center', gap: '20px',
                    }}>
                        <div style={{
                            width: '74px', height: '74px', borderRadius: '24px',
                            background: 'linear-gradient(135deg, var(--color-accent-soft), var(--color-violet-soft))',
                            border: '1px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.25rem',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}>🤖</div>
                        <div>
                            <h3 style={{
                                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                                fontSize: '1.5rem', color: 'var(--color-text-primary)', marginBottom: '8px',
                            }}>AI Coach</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '300px', lineHeight: 1.6 }}>
                                Ask me anything about training, nutrition, or levelling up your performance.
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '400px' }}>
                            {SUGGESTIONS.map((s) => (
                                <button key={s} onClick={() => onSendMessage(s)} style={{
                                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)', borderRadius: '99px', padding: '8px 16px',
                                    fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)';
                                        (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-soft)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                                        (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-card)';
                                    }}
                                >{s}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map((msg) => {
                        const isUser = msg.sender === 'user';
                        return (
                            <div key={msg.id} style={{
                                display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                                animation: 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                            }}>
                                {!isUser && <AiAvatar />}
                                <div style={{
                                    maxWidth: '78%',
                                    ...(isUser ? {
                                        background: 'linear-gradient(135deg, var(--color-accent), var(--color-violet))',
                                        borderRadius: '20px 20px 4px 20px', padding: '12px 18px',
                                        boxShadow: '0 4px 20px var(--color-accent-glow)',
                                    } : {
                                        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                                        borderRadius: '20px 20px 20px 4px', padding: '12px 18px',
                                    }),
                                }}>
                                    {!isUser && (
                                        <p style={{
                                            fontSize: '0.65rem', fontFamily: "'Space Grotesk', sans-serif",
                                            fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                                            color: 'var(--color-accent)', marginBottom: '6px',
                                        }}>AI Coach</p>
                                    )}
                                    <p style={{
                                        fontSize: '0.925rem', lineHeight: 1.65,
                                        color: isUser ? 'white' : 'var(--color-text-primary)',
                                        whiteSpace: 'pre-wrap',
                                    }}>{msg.message}</p>
                                    <p style={{
                                        fontSize: '0.65rem', marginTop: '8px',
                                        color: isUser ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)',
                                        textAlign: isUser ? 'right' : 'left',
                                        fontFamily: "'Space Grotesk', sans-serif"
                                    }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Thinking dots — waiting for API response */}
                    {isFetching && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'slide-up 0.3s ease both' }}>
                            <AiAvatar />
                            <div style={{
                                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                                borderRadius: '18px 18px 18px 4px', padding: '16px 20px',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                {[0, 150, 300].map((delay) => (
                                    <div key={delay} style={{
                                        width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)',
                                        animation: `dotBounce 1.2s ${delay}ms infinite`,
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Typewriter bubble — typing out the response */}
                    {isTyping && typingText && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'slide-up 0.3s ease both' }}>
                            <AiAvatar />
                            <div style={{
                                maxWidth: '78%', background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-accent-soft)',
                                borderRadius: '20px 20px 20px 4px', padding: '12px 18px',
                            }}>
                                <p style={{
                                    fontSize: '0.65rem', fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                                    color: 'var(--color-accent)', marginBottom: '6px',
                                }}>AI Coach</p>
                                <p style={{ fontSize: '0.925rem', lineHeight: 1.65, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {typingText}<Cursor />
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT BAR ── */}
            <div style={{
                borderTop: '1px solid var(--color-border)', padding: '16px',
                background: 'var(--color-bg-primary)', position: 'relative',
                zIndex: 10
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isFetching ? 'Thinking...' : isTyping ? 'AI Coach is typing...' : 'Ask your AI coach anything...'}
                            disabled={blocked}
                            style={{
                                width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                                borderRadius: '16px', padding: '14px 18px', fontSize: '0.95rem',
                                color: blocked ? 'var(--color-text-muted)' : 'var(--color-text-primary)', outline: 'none',
                                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--color-accent)';
                                e.target.style.boxShadow = '0 0 0 4px var(--color-accent-soft)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--color-border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <button type="submit" disabled={blocked || !input.trim()} className="btn-primary"
                        style={{
                            padding: '14px 28px', flexShrink: 0,
                            opacity: blocked || !input.trim() ? 0.4 : 1,
                            cursor: blocked || !input.trim() ? 'not-allowed' : 'pointer',
                        }}>
                        {isFetching ? '...' : 'Send →'}
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes dotBounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
                    40% { transform: translateY(-8px); opacity: 1; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
