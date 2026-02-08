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
            {/* Desktop Nav - Floating glass header */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between px-8 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
                <Link href="/" className="flex items-center gap-3 group">
                    <span className="text-xl group-hover:scale-110 transition-transform">💕</span>
                    <span className="text-white/60 text-sm font-medium tracking-wide group-hover:text-white/80 transition-colors">Our Space</span>
                </Link>

                <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/[0.06]">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300 ${pathname === link.href
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                                }`}
                        >
                            <span className="text-base">{link.icon}</span>
                            <span className="hidden lg:inline">{link.label}</span>
                        </Link>
                    ))}
                </div>

                <button
                    onClick={signOut}
                    className="text-white/30 text-xs hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                    Sign out
                </button>
            </nav>

            {/* Mobile Nav - Bottom floating bar */}
            <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 h-16 flex items-center justify-around bg-[#0a0a0f]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${pathname === link.href
                                ? 'text-white bg-white/10'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        <span className={`text-xl transition-transform ${pathname === link.href ? 'scale-110' : ''}`}>{link.icon}</span>
                        <span className="text-[10px] font-medium">{link.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
}
