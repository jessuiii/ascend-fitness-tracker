'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);

        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) {
            if (authError.message === 'User already registered') {
                setError('This email is already registered. Try signing in instead.');
            } else {
                setError(authError.message);
            }
            setLoading(false);
            return;
        }
        router.push('/onboarding');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12"
            style={{ background: 'linear-gradient(135deg, #06060a 0%, #0d0a1a 100%)' }}>

            {/* Ambient orbs */}
            <div className="fixed top-0 right-0 w-96 h-96 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)', transform: 'translate(30%, -30%)' }} />
            <div className="fixed bottom-0 left-0 w-72 h-72 opacity-8 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-violet), transparent)', transform: 'translate(-30%, 30%)' }} />

            <div className="w-full max-w-[440px] animate-slide-up relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
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
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.4rem', letterSpacing: '-0.04em', color: '#f0f0f8' }}>
                        Start your evolution
                    </h1>
                    <p style={{ color: '#8888a8', marginTop: '8px', fontSize: '0.95rem' }}>
                        Join thousands leveling up their fitness game
                    </p>
                </div>

                {/* Form card */}
                <div style={{
                    background: '#12121c', border: '1px solid #1e1e30', borderRadius: '24px', padding: '32px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                }}>
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div>
                            <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                required
                            />
                        </div>

                        <div>
                            <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat password"
                                required
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)',
                                color: '#ff3b5c', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem',
                            }}>
                                ⚠ {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary"
                            style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #1e1e30' }}>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#8888a8' }}>
                            Already forged?{' '}
                            <Link href="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Sign in</Link>
                        </p>
                    </div>
                </div>

                {/* Trust blurb */}
                <div className="flex items-center justify-center gap-6 mt-8">
                    {['Free forever', 'No spam', 'Cancel anytime'].map(t => (
                        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#44445a', fontSize: '0.78rem' }}>
                            <span style={{ color: 'var(--color-lime)', fontSize: '0.65rem' }}>✓</span> {t}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
