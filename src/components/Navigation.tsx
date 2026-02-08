'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    if (!user) return null;

    const navLinks = [
        { href: '/', icon: '🏠', label: 'Home' },
        { href: '/gallery', icon: '📸', label: 'Gallery' },
        { href: '/calendar', icon: '📅', label: 'Calendar' },
        { href: '/notes', icon: '💌', label: 'Notes' },
    ];

    return (
        <>
            {/* Desktop Nav - Enhanced glass header */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-18 items-center justify-between px-10 py-4 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400/20 to-amber-400/20 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all">
                        <span className="text-lg">💕</span>
                    </div>
                    <span className="text-white/70 text-sm font-medium tracking-wide group-hover:text-white transition-colors">Our Space</span>
                </Link>

                <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-xl rounded-full px-2 py-2 border border-white/[0.08]">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm transition-all duration-300 ${pathname === link.href
                                    ? 'bg-white/[0.12] text-white shadow-lg shadow-white/5'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                                }`}
                        >
                            <span className="text-base">{link.icon}</span>
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    ))}
                </div>

                <button
                    onClick={signOut}
                    className="text-white/30 text-sm hover:text-white/60 transition-colors px-4 py-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                    Sign out
                </button>
            </nav>

            {/* Mobile Nav - Enhanced floating bar */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 h-18 flex items-center justify-around bg-[#0d0d12]/95 backdrop-blur-2xl rounded-3xl border border-white/[0.1] shadow-2xl shadow-black/60 px-2 py-3">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all duration-300 ${pathname === link.href
                                ? 'text-white bg-white/[0.1]'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        <span className={`text-xl transition-transform duration-300 ${pathname === link.href ? 'scale-110' : ''}`}>{link.icon}</span>
                        <span className="text-[10px] font-medium tracking-wide">{link.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
}
