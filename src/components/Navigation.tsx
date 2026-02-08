'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Navigation() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!user) return null;

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/gallery', label: 'Gallery' },
        { href: '/calendar', label: 'Calendar' },
        { href: '/notes', label: 'Notes' },
    ];

    return (
        <>
            {/* Desktop Navigation - Linear/Notion inspired */}
            <header className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]'
                    : 'bg-transparent'
                }`}>
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                                <span className="text-white text-sm">💕</span>
                            </div>
                            <span className="text-white font-medium text-[15px]">Our Space</span>
                        </Link>

                        {/* Center Navigation */}
                        <nav className="flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-all duration-200 ${isActive
                                                ? 'text-white bg-white/10'
                                                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium shadow-lg shadow-purple-500/25">
                                    {user.displayName?.[0] || 'U'}
                                </div>
                                <svg className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-white/[0.06]">
                                            <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
                                            <p className="text-white/40 text-xs truncate">{user.email}</p>
                                        </div>
                                        <div className="p-1.5">
                                            <button
                                                onClick={() => { setMenuOpen(false); signOut(); }}
                                                className="w-full px-3 py-2 text-left text-white/60 hover:text-white hover:bg-white/[0.05] rounded-lg text-sm transition-colors flex items-center gap-2.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                                </svg>
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.06]">
                <div className="flex items-center justify-around h-16 px-4">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isActive ? 'text-white' : 'text-white/40'
                                    }`}
                            >
                                <span className="text-lg">
                                    {link.href === '/' && '🏠'}
                                    {link.href === '/gallery' && '📸'}
                                    {link.href === '/calendar' && '📅'}
                                    {link.href === '/notes' && '💌'}
                                </span>
                                <span className="text-[10px] font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
