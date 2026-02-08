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
            {/* Desktop Navigation - Glass effect always visible */}
            <header className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#0a0a0f]/70 backdrop-blur-2xl border-b border-white/[0.08] ${scrolled ? 'shadow-xl shadow-black/30' : ''
                }`}>
                <div className="max-w-6xl mx-auto px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity"></div>
                                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white text-sm">💕</span>
                                </div>
                            </div>
                            <span className="text-white font-semibold text-[15px] group-hover:text-rose-100 transition-colors">Our Space</span>
                        </Link>

                        {/* Center Navigation - Glass pill */}
                        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-white/[0.04] backdrop-blur-xl rounded-full px-1.5 py-1 border border-white/[0.1]">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${isActive
                                                ? 'text-white bg-white/[0.12] shadow-sm'
                                                : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
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
                                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/[0.1]"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full blur opacity-40"></div>
                                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-lg">
                                        {user.displayName?.[0] || 'U'}
                                    </div>
                                </div>
                                <span className="text-white/60 text-sm font-medium">{user.displayName?.split(' ')[0]}</span>
                                <svg className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#141418]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                                        <div className="px-4 py-3.5 border-b border-white/[0.06]">
                                            <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
                                            <p className="text-white/40 text-xs truncate mt-0.5">{user.email}</p>
                                        </div>
                                        <div className="p-1.5">
                                            <button
                                                onClick={() => { setMenuOpen(false); signOut(); }}
                                                className="w-full px-3 py-2.5 text-left text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl text-sm transition-all flex items-center gap-3"
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
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isActive ? 'text-white' : 'text-white/40'}`}
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
