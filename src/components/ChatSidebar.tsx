'use client';

import { ChatConversation } from '@/types';

interface ChatSidebarProps {
    conversations: ChatConversation[];
    activeId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    onNewChat: () => void;
    onDelete: (id: string) => void;
}

export default function ChatSidebar({ conversations, activeId, isOpen, onClose, onSelect, onNewChat, onDelete }: ChatSidebarProps) {
    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 100,
                    }}
                    className="mobile-overlay"
                />
            )}

            <div style={{
                position: 'fixed',
                top: '71px', // Below Navbar
                bottom: 0,
                left: 0,
                width: '280px',
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 71px)',
                zIndex: 110,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                <div style={{
                    padding: '24px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <button
                        onClick={onNewChat}
                        className="btn-primary"
                        style={{
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '14px',
                            width: '100%',
                            boxShadow: '0 4px 12px var(--color-accent-glow)'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>⊕</span> New Chat
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    <p className="label-caps" style={{ margin: '8px 12px 16px', fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>Previous Chats</p>

                    {conversations.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            Start a new conversation to see history
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => { onSelect(conv.id); if (window.innerWidth < 768) onClose(); }}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        background: activeId === conv.id ? 'var(--color-accent-soft)' : 'transparent',
                                        border: activeId === conv.id ? '1px solid var(--color-border)' : '1px solid transparent',
                                        transition: 'all 0.25s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    className="chat-item-hover"
                                >
                                    {activeId === conv.id && (
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '20%',
                                            bottom: '20%',
                                            width: '3px',
                                            background: 'var(--color-accent)',
                                            borderRadius: '0 4px 4px 0'
                                        }} />
                                    )}
                                    <div style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.9rem',
                                        fontWeight: activeId === conv.id ? 700 : 500,
                                        color: activeId === conv.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        fontFamily: "'Space Grotesk', sans-serif"
                                    }}>
                                        {conv.title}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            marginLeft: '8px',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        className="delete-item-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .chat-item-hover:hover {
                        background: var(--color-bg-card) !important;
                    }
                    .chat-item-hover:hover .delete-item-btn {
                        color: var(--color-text-secondary) !important;
                    }
                    .delete-item-btn:hover {
                        color: var(--color-error) !important;
                        background: rgba(239, 68, 68, 0.1) !important;
                    }
                    @media (min-width: 768px) {
                        .mobile-overlay { display: none !important; }
                    }
                `}</style>
            </div>
        </>
    );
}
