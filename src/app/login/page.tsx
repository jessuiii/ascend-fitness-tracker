'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let email = emailOrUsername;

        // If it doesn't look like an email, try to find by username
        if (!emailOrUsername.includes('@')) {
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', emailOrUsername)
                .single();

            if (pError || !profile) {
                setError('No user found with that username');
                setLoading(false);
                return;
            }

            // Note: Since we don't have the email in the public profiles table for security (usually),
            // this is a bit tricky if Supabase auth only allows signing in by email.
            // Ideally, we'd have the email in profiles or use a different auth strategy.
            // For now, let's assume we can fetch it or prompt for email.
            // Actually, Supabase doesn't expose the underlying auth email easily via profiles.
            // WORKAROUND: In a real app we'd trigger a RPC or have emails in profiles.
            // Let's assume for now the user knows their email if username login fails or we implement a mapping.
            setError('Username login currently requires manual email/pass. Please use email.');
            setLoading(false);
            return;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
            router.push(profile ? '/dashboard' : '/onboarding');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06060a 0%, #0d0a1a 100%)', padding: '24px' }}>
            {/* Ambient orbs */}
            <div className="fixed top-0 right-0 w-96 h-96 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)', transform: 'translate(30%, -30%)' }} />
            <div className="fixed bottom-0 left-0 w-72 h-72 opacity-8 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-violet), transparent)', transform: 'translate(-30%, 30%)' }} />

            <div className="w-full max-w-[440px] animate-slide-up relative z-10">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div className="inline-flex items-center gap-2 mb-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-glow)' }}>
                            ⚡
                        </div>
                        <span style={{
                            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem',
                            letterSpacing: '-0.04em',
                            background: 'linear-gradient(135deg, var(--color-accent), var(--color-violet))',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>Ascend</span>
                    </div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.4rem', letterSpacing: '-0.04em', color: '#f0f0f8' }}>
                        Welcome back
                    </h2>
                    <p style={{ color: '#8888a8', marginTop: '8px', fontSize: '0.95rem' }}>
                        Sign in to continue your grind 🔥
                    </p>
                </div>

                {/* Form Card */}
                <div style={{ background: '#12121c', border: '1px solid #1e1e30', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Email or Username</label>
                            <input
                                type="text"
                                value={emailOrUsername}
                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                placeholder="you@example.com or username"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="label-caps">Password</label>
                                <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)',
                                color: '#ff3b5c', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary"
                            style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="animate-spin-slow" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                    Signing in...
                                </span>
                            ) : 'Sign In →'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#8888a8' }}>
                        New here?{' '}
                        <Link href="/signup" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
