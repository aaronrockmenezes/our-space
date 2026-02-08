'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    if (!user) return null;

    const navLinks = [
        { href: '/', icon: '🏠' },
        { href: '/gallery', icon: '📸' },
        { href: '/calendar', icon: '📅' },
        { href: '/notes', icon: '💌' },
    ];

    return (
        <>
            {/* Desktop Nav - Top */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between px-8 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-lg">💕</span>
                    <span className="text-white/50 text-sm">Our Space</span>
                </Link>

                <div className="flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-lg transition-opacity ${pathname === link.href ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                                }`}
                        >
                            {link.icon}
                        </Link>
                    ))}
                </div>

                <button onClick={signOut} className="text-white/30 text-xs hover:text-white/50">
                    Sign out
                </button>
            </nav>

            {/* Mobile Nav - Bottom */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around bg-[#0a0a0f]/95 backdrop-blur-sm border-t border-white/5">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`text-xl transition-opacity ${pathname === link.href ? 'opacity-100' : 'opacity-40'
                            }`}
                    >
                        {link.icon}
                    </Link>
                ))}
            </nav>
        </>
    );
}
