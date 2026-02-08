'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Navigation() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    if (!user) return null;

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/gallery', label: 'Gallery' },
        { href: '/calendar', label: 'Calendar' },
        { href: '/notes', label: 'Notes' },
    ];

    return (
        <>
            {/* Desktop Navigation - Professional & Spacious */}
            <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-20 items-center px-10 bg-[#0a0a0f]/60 backdrop-blur-xl border-b border-white/[0.05] transition-all duration-300">
                <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between">

                    {/* Logo Section - Left */}
                    <Link href="/" className="flex items-center gap-4 group shrink-0 min-w-[200px]">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/20 to-purple-500/20 border border-white/10 group-hover:border-white/20 transition-all">
                            <span className="text-xl filter drop-shadow-lg">💕</span>
                            <div className="absolute inset-0 bg-white/5 rounded-xl blur-lg -z-10 group-hover:bg-white/10 transition-all" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white text-[15px] font-medium tracking-wide">Our Space</span>
                            <span className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Since 2022</span>
                        </div>
                    </Link>

                    {/* Navigation Links - Centered & Spacious */}
                    <nav className="flex items-center gap-12">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="relative py-2 group block"
                                >
                                    <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'
                                        }`}>
                                        {link.label}
                                    </span>

                                    {/* Active Indicator Dot */}
                                    {isActive && (
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                                    )}

                                    {/* Hover Glow */}
                                    <span className="absolute inset-0 -z-10 bg-white/5 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-150" />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Profile Section - Right */}
                    <div className="flex justify-end min-w-[200px]">
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all duration-300"
                            >
                                <span className="text-sm font-medium text-white/80 hidden lg:block">
                                    {user.displayName?.split(' ')[0]}
                                </span>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-purple-900/40">
                                    <div className="w-full h-full rounded-full bg-[#121217] flex items-center justify-center">
                                        <span className="text-white text-xs font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                                            {user.displayName?.[0] || 'U'}
                                        </span>
                                    </div>
                                </div>
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-4 w-64 bg-[#121217]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 transform origin-top-right transition-all">
                                        <div className="px-6 py-5 border-b border-white/[0.06] bg-white/[0.02]">
                                            <p className="text-white text-sm font-semibold truncate">{user.displayName}</p>
                                            <p className="text-white/40 text-xs truncate mt-1.5">{user.email}</p>
                                        </div>
                                        <div className="p-2 space-y-0.5">
                                            <button
                                                onClick={() => { setMenuOpen(false); signOut(); }}
                                                className="w-full px-4 py-3 text-left rounded-xl hover:bg-white/[0.05] text-sm text-rose-400/90 hover:text-rose-400 transition-colors flex items-center gap-3 font-medium"
                                            >
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
            <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50">
                <div className="bg-[#121217]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center justify-between px-6 py-4">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${isActive ? 'text-white scale-105' : 'text-white/40'}`}
                            >
                                <span className="text-xl filter drop-shadow-md">
                                    {link.href === '/' && '🏠'}
                                    {link.href === '/gallery' && '📸'}
                                    {link.href === '/calendar' && '📅'}
                                    {link.href === '/notes' && '💌'}
                                </span>
                                {isActive && <span className="absolute -bottom-2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
