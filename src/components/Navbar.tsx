'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    // Lock scroll when menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [menuOpen]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
        { href: '/stats', label: 'Check stats', icon: '📈' },
        { href: '/active-workout', label: 'Start Workout', icon: '▶' },
        { href: '/workout', label: 'Log Exercise', icon: '⊕' },
        { href: '/chat', label: 'AI Coach', icon: '◈' },
        { href: '/settings', label: 'Settings', icon: '⚙' },
    ];

    // Specific links for mobile menu
    const mobileLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
        { href: '/stats', label: 'Check stats', icon: '📈' },
        { href: '/chat', label: 'AI Coach', icon: '◈' },
        { href: '/settings', label: 'Settings', icon: '⚙' },
    ];

    return (
        <>
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: 'var(--color-bg-primary)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--color-border)',
            }}>
                <div className="page-max-wide" style={{ padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
                        {/* Logo - Indigo Gradient */}
                        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                            <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '8px', background: 'var(--color-accent-soft)' }} />
                                <span style={{ position: 'relative', fontSize: '1.1rem' }}>⚡</span>
                            </div>
                            <span style={{
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 800,
                                fontSize: '1.25rem',
                                letterSpacing: '-0.04em',
                                background: 'linear-gradient(135deg, var(--color-accent), var(--color-violet))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                Ascend
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <div style={{ display: 'none' }} className="md:flex items-center gap-1">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        style={{
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            letterSpacing: '0.01em',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                            background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {isActive ? (
                                            <span style={{ color: 'var(--color-accent)', fontSize: '0.6rem' }}>●</span>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{link.icon}</span>
                                        )}
                                        {link.label}
                                    </Link>
                                );
                            })}

                            <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 8px' }} />

                            <button
                                onClick={handleSignOut}
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    color: 'var(--color-text-muted)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px 16px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Sign Out
                            </button>
                        </div>

                        {/* Mobile Hamburger Button */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            style={{
                                display: 'flex',
                                width: '44px',
                                height: '44px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                background: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border)',
                                color: '#fff',
                                cursor: 'pointer',
                                zIndex: 3000,
                                position: 'relative'
                            }}
                            className="md:hidden"
                        >
                            {menuOpen ? (
                                <span style={{ fontSize: '1.5rem', fontWeight: 300 }}>✕</span>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ width: '22px', height: '2.5px', background: 'var(--color-accent)', borderRadius: '2px' }} />
                                    <div style={{ width: '16px', height: '2.5px', background: 'var(--color-violet)', borderRadius: '2px', alignSelf: 'flex-end' }} />
                                    <div style={{ width: '22px', height: '2.5px', background: 'var(--color-accent)', borderRadius: '2px' }} />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* iOS Style Mobile Menu Overlay - Quantum Indigo Theme */}
            {menuOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    width: '100vw',
                    height: '100dvh',
                    backgroundColor: 'var(--color-bg-primary)',
                    zIndex: 2500,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'menuFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }} className="md:hidden">

                    {/* Futuristic Background Accents */}
                    <div style={{
                        position: 'absolute',
                        top: '30%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '500px',
                        height: '500px',
                        background: 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)',
                        pointerEvents: 'none',
                        zIndex: 0
                    }} />

                    <div style={{
                        width: '100%',
                        maxWidth: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        position: 'relative',
                        zIndex: 1,
                        marginTop: '-40px',
                        paddingLeft: '16px',
                    }}>
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            marginBottom: '28px',
                            fontFamily: "'Space Grotesk', sans-serif",
                            animation: 'menuSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both'
                        }}>
                            Ascend Quantum
                        </div>

                        {mobileLinks.map((link, i) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 700,
                                    fontSize: '1.8rem',
                                    padding: '14px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    gap: '18px',
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                    color: pathname === link.href ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                    animation: `menuSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.1}s both`,
                                    transition: 'color 0.3s ease',
                                    width: '100%',
                                }}
                            >
                                <div style={{
                                    width: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <span style={{
                                        fontSize: '1.4rem',
                                        color: pathname === link.href ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                        opacity: pathname === link.href ? 1 : 0.4,
                                        transition: 'all 0.3s ease'
                                    }}>{link.icon}</span>
                                </div>
                                {link.label}
                            </Link>
                        ))}

                        <div style={{
                            height: '1px',
                            background: 'var(--color-border)',
                            margin: '24px 0 16px 0',
                            width: '100%',
                            animation: `menuSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both`
                        }} />

                        <button
                            onClick={handleSignOut}
                            style={{
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 700,
                                fontSize: '1.8rem',
                                color: 'var(--color-text-muted)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '14px 0',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: '18px',
                                whiteSpace: 'nowrap',
                                animation: `menuSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both`,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                width: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: '1.4rem', opacity: 0.4 }}>⊗</span>
                            </div>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes menuFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes menuSlideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
}
