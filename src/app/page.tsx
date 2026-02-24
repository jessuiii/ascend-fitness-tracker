'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('id', user.id).single();
        router.replace(profile ? '/dashboard' : '/onboarding');
      } else {
        router.replace('/login');
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #06060a 0%, #0d0a1a 100%)',
        gap: '32px',
      }}>
        {/* Logo */}
        <div className="animate-float" style={{ textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px',
            background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', margin: '0 auto 16px',
          }}>
            ⚡
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.8rem',
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #ff6b2b, #ffaa80)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Ascend
          </h1>
          <p style={{ color: '#44445a', fontSize: '0.85rem', marginTop: '6px', fontFamily: "'Space Grotesk', sans-serif" }}>
            Forging your session...
          </p>
        </div>

        {/* Loading bar */}
        <div style={{
          width: '120px', height: '3px', background: '#1e1e30', borderRadius: '99px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '99px',
            background: 'linear-gradient(90deg, #ff6b2b, #ff8c5a)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            backgroundSize: '200% 100%',
          }} />
        </div>
      </div>
    );
  }

  return null;
}
