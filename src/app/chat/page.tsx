'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChatMessage, ChatConversation, Profile, Workout, StrengthScore, PathType } from '@/types';
import { getBestLifts, calculateTSS, calculateBMI } from '@/lib/strength';
import { getTierInfo } from '@/lib/tiers';
import Navbar from '@/components/Navbar';
import ChatWindow from '@/components/ChatWindow';
import ChatSidebar from '@/components/ChatSidebar';

export default function ChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [typingText, setTypingText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userContext, setUserContext] = useState<any>(null);
    const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadConversations = useCallback(async (uid: string) => {
        const { data } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });
        setConversations((data || []) as ChatConversation[]);
        return (data || []) as ChatConversation[];
    }, []);

    const fetchMessages = useCallback(async (uid: string, convId?: string) => {
        if (!convId) {
            setMessages([]);
            return;
        }

        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', uid)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })
            .limit(100);

        setMessages((data || []) as ChatMessage[]);
    }, []);

    const init = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setUserId(user.id);

        const [profileRes, workoutRes, plannedRes, convs] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(10),
            supabase.from('planned_workouts').select('*').eq('user_id', user.id),
            loadConversations(user.id)
        ]);

        if (profileRes.data) {
            const profile = profileRes.data;
            const workouts = (workoutRes.data || []) as Workout[];
            const planned = (plannedRes.data || []) as any[];
            const { squat1RM, bench1RM, deadlift1RM } = getBestLifts(workouts);
            const tss = calculateTSS(squat1RM, bench1RM, deadlift1RM, profile.weight);
            const bmi = calculateBMI(profile.height, profile.weight);
            const tierInfo = getTierInfo(profile.selected_path as PathType, tss, bmi);
            setUserContext({
                path: profile.selected_path, tier: tierInfo.name, bmi,
                lifts: { squat: squat1RM, bench: bench1RM, deadlift: deadlift1RM },
                recentWorkouts: workouts.map(w => ({ date: w.date, exercise: w.exercise_name, weight: w.weight, reps: w.reps, muscle_group: w.muscle_group })),
                plannedRoutine: planned.map(p => ({ day: p.day_of_week, exercise: p.exercise_name, sets: p.target_sets, reps: p.target_rep_range }))
            });
        }

        if (convs.length > 0) {
            setActiveConversationId(convs[0].id);
            await fetchMessages(user.id, convs[0].id);
        }

        if (window.innerWidth < 1024) setSidebarOpen(false); // Narrower threshold for mobile/tablet

        setInitialLoading(false);
    }, [router, loadConversations, fetchMessages]);

    useEffect(() => { init(); }, [init]);

    const selectConversation = async (id: string) => {
        setActiveConversationId(id);
        await fetchMessages(userId, id);
    };

    const deleteConversation = async (id: string) => {
        await supabase.from('chat_conversations').delete().eq('id', id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
            setActiveConversationId(undefined);
            setMessages([]);
        }
    };

    const startNewChat = () => {
        setActiveConversationId(undefined);
        setMessages([]);
        setSidebarOpen(false); // Auto-close sidebar on new chat
    };

    useEffect(() => () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); }, []);

    const runTypewriter = (fullText: string, onDone: () => void) => {
        setIsTyping(true);
        setTypingText('');
        let i = 0;
        const tick = () => {
            if (i < fullText.length) {
                const chunkSize = Math.floor(Math.random() * 3) + 1;
                i = Math.min(i + chunkSize, fullText.length);
                setTypingText(fullText.slice(0, i));
                const ch = fullText[i - 1];
                const delay = /[.,!?;:\n]/.test(ch) ? 60 : 18;
                typewriterRef.current = setTimeout(tick, delay);
            } else {
                setIsTyping(false);
                setTypingText('');
                onDone();
            }
        };
        typewriterRef.current = setTimeout(tick, 18);
    };

    const sendMessage = async (text: string) => {
        if (!userId || isFetching || isTyping) return;
        const tempUserMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            user_id: userId,
            message: text,
            sender: 'user',
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);
        setIsFetching(true);
        try {
            let convId = activeConversationId;
            if (!convId) {
                const { data: newConv } = await supabase
                    .from('chat_conversations')
                    .insert({ user_id: userId, title: text.slice(0, 30) + (text.length > 30 ? '...' : '') })
                    .select().single();
                if (newConv) {
                    convId = newConv.id;
                    setActiveConversationId(convId);
                    setConversations(prev => [newConv as ChatConversation, ...prev]);
                }
            }
            const { data: savedUserMsg } = await supabase
                .from('chat_messages')
                .insert({ user_id: userId, conversation_id: convId, message: text, sender: 'user' })
                .select().single();
            if (savedUserMsg) {
                setMessages((prev) => prev.map((m) => (m.id === tempUserMsg.id ? savedUserMsg : m)));
            }
            const history = [...messages, tempUserMsg].map((m) => ({
                role: m.sender === 'user' ? 'user' : 'model',
                content: m.message,
            }));
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history, userContext }),
            });
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'AI is temporarily unavailable');
            const fullMessage: string = data.message;
            setIsFetching(false);
            runTypewriter(fullMessage, async () => {
                const { data: savedAiMsg } = await supabase
                    .from('chat_messages')
                    .insert({ user_id: userId, conversation_id: convId, message: fullMessage, sender: 'ai' })
                    .select().single();
                const aiMsg: ChatMessage = savedAiMsg || {
                    id: `ai-${Date.now()}`, user_id: userId, conversation_id: convId,
                    message: fullMessage, sender: 'ai', created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, aiMsg]);
            });
        } catch (error) {
            console.error('Chat error:', error);
            setIsFetching(false);
            setIsTyping(false);
            setTypingText('');
            setMessages((prev) => [...prev, {
                id: `error-${Date.now()}`, user_id: userId,
                message: error instanceof Error ? error.message : "Error processing message.",
                sender: 'ai', created_at: new Date().toISOString(),
            } as ChatMessage]);
        }
    };

    if (initialLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <Navbar />
                <div className="page-max-wide" style={{ paddingTop: '32px' }}>
                    <div className="shimmer" style={{ height: '360px', borderRadius: '18px' }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
            <Navbar />

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {/* Floating sidebar toggle button - Re-themed for Indigo */}
                <button
                    onClick={() => setSidebarOpen(prev => !prev)}
                    style={{
                        position: 'fixed',
                        top: '84px',
                        left: sidebarOpen ? '292px' : '12px',
                        zIndex: 200,
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-accent)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        fontSize: '1.2rem'
                    }}
                    title={sidebarOpen ? "Close Sidebar" : "Open History"}
                >
                    {sidebarOpen ? '«' : '🏛'}
                </button>

                <ChatSidebar
                    conversations={conversations}
                    activeId={activeConversationId}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onSelect={selectConversation}
                    onNewChat={startNewChat}
                    onDelete={deleteConversation}
                />

                <main style={{
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    marginLeft: sidebarOpen ? '280px' : '0',
                    transition: 'margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <div style={{
                        flex: 1,
                        maxWidth: '1200px',
                        width: '100%',
                        margin: '0 auto',
                        height: '100%',
                        padding: '0 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        paddingTop: '60px'
                    }}>
                        <ChatWindow
                            messages={messages}
                            typingText={typingText}
                            isFetching={isFetching}
                            isTyping={isTyping}
                            onSendMessage={sendMessage}
                        />
                    </div>
                </main>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    main { margin-left: 0 !important; }
                    button { left: 12px !important; }
                }
            `}</style>
        </div>
    );
}
