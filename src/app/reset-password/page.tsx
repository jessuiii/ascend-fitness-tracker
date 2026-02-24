'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setMessage('');
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Password updated successfully!');
            setTimeout(() => router.push('/login'), 2000);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#06060a', padding: '24px' }}>
            <div className="w-full max-w-[420px] animate-slide-up">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.5rem', color: '#f0f0f8', marginBottom: '8px' }}>New Password</h1>
                    <p style={{ color: '#8888a8' }}>Secure your account with a fresh password.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ background: '#0e0e16', border: '1px solid #1e1e30', borderRadius: '12px', padding: '14px', width: '100%', color: '#f0f0f8', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ background: '#0e0e16', border: '1px solid #1e1e30', borderRadius: '12px', padding: '14px', width: '100%', color: '#f0f0f8', outline: 'none' }}
                        />
                    </div>

                    {message && <p style={{ color: '#b5f23d', fontSize: '0.9rem', textAlign: 'center' }}>✓ {message}</p>}
                    {error && <p style={{ color: '#ff3b5c', fontSize: '0.9rem', textAlign: 'center' }}>⚠ {error}</p>}

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
