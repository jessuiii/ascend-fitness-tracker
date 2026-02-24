'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Check your email for the password reset link!');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#06060a', padding: '24px' }}>
            <div className="w-full max-w-[420px] animate-slide-up">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.5rem', color: '#f0f0f8', marginBottom: '8px' }}>Reset Password</h1>
                    <p style={{ color: '#8888a8' }}>Enter your registered email to receive a reset link.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            style={{ background: '#0e0e16', border: '1px solid #1e1e30', borderRadius: '12px', padding: '14px', width: '100%', color: '#f0f0f8', outline: 'none' }}
                        />
                    </div>

                    {message && <p style={{ color: '#b5f23d', fontSize: '0.9rem', textAlign: 'center' }}>✓ {message}</p>}
                    {error && <p style={{ color: '#ff3b5c', fontSize: '0.9rem', textAlign: 'center' }}>⚠ {error}</p>}

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#8888a8' }}>
                        Remembered?{' '}
                        <Link href="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                            Back to login
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
