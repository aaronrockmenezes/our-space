'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Navigation() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!user) return null;

    const navLinks = [
        { href: '/', label: 'Home', icon: '🏠' },
        { href: '/gallery', label: 'Gallery', icon: '📸' },
        { href: '/calendar', label: 'Calendar', icon: '📅' },
        { href: '/notes', label: 'Notes', icon: '💌' },
    ];

    const firstName = user.displayName?.split(' ')[0] || 'You';

    return (
        <>
            {/* Desktop Navigation - Netflix/Portfolio inspired */}
            <nav className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-[#0a0a0f]/95 backdrop-blur-2xl shadow-2xl shadow-black/40'
                    : 'bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Section */}
                        <Link href="/" className="flex items-center gap-4 group">
                            <div className="relative">
                                {/* Animated glow ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
                                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 via-purple-500/20 to-amber-500/20 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <span className="text-xl">💕</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-semibold text-lg tracking-tight group-hover:text-rose-100 transition-colors">Our Space</span>
                                <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-medium">Since Nov 2022</span>
                            </div>
                        </Link>

                        {/* Center Navigation - Premium pill style */}
                        <div className="absolute left-1/2 -translate-x-1/2">
                            <div className="flex items-center bg-white/[0.03] backdrop-blur-xl rounded-full px-2 py-1.5 border border-white/[0.08] shadow-lg shadow-black/20">
                                {navLinks.map((link, index) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="relative group"
                                        >
                                            <div className={`flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 ${isActive
                                                    ? 'text-white'
                                                    : 'text-white/40 hover:text-white/80'
                                                }`}>
                                                <span className={`text-sm transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{link.icon}</span>
                                                <span className="text-sm font-medium">{link.label}</span>
                                            </div>

                                            {/* Active indicator - animated underline */}
                                            {isActive && (
                                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-lg shadow-white/50"></div>
                                            )}

                                            {/* Hover glow effect */}
                                            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive
                                                    ? 'bg-white/[0.12]'
                                                    : 'bg-transparent group-hover:bg-white/[0.05]'
                                                }`}></div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Profile Section */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-4 group"
                            >
                                {/* Profile Avatar */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={firstName}
                                            className="relative w-10 h-10 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-all"
                                        />
                                    ) : (
                                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/30 to-purple-500/30 border-2 border-white/20 flex items-center justify-center">
                                            <span className="text-white/80 text-sm font-medium">{firstName[0]}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Name and dropdown arrow */}
                                <div className="flex items-center gap-2">
                                    <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">{firstName}</span>
                                    <svg
                                        className={`w-4 h-4 text-white/40 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {profileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-3 w-56 bg-[#12121a]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden z-50">
                                        {/* User info */}
                                        <div className="px-5 py-4 border-b border-white/[0.06]">
                                            <p className="text-white text-sm font-medium">{user.displayName}</p>
                                            <p className="text-white/40 text-xs truncate mt-0.5">{user.email}</p>
                                        </div>

                                        {/* Menu items */}
                                        <div className="py-2">
                                            <button
                                                onClick={signOut}
                                                className="w-full px-5 py-3 text-left text-white/60 hover:text-white hover:bg-white/[0.05] text-sm transition-all flex items-center gap-3"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

                {/* Animated border line */}
                <div className={`h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}></div>
            </nav>

            {/* Mobile Navigation - Premium floating bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
                <div className="mx-4 mb-4">
                    <div className="bg-[#0d0d12]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.1] shadow-2xl shadow-black/60 px-2 py-2">
                        <div className="flex items-center justify-around">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="relative flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all duration-300"
                                    >
                                        {/* Active background */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] to-white/[0.06] rounded-2xl"></div>
                                        )}

                                        <span className={`relative text-2xl transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''
                                            }`}>{link.icon}</span>

                                        <span className={`relative text-[10px] font-medium tracking-wide transition-colors ${isActive ? 'text-white' : 'text-white/40'
                                            }`}>{link.label}</span>

                                        {/* Active dot indicator */}
                                        {isActive && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-lg shadow-white/50"></div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
