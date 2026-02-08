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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/[0.05] md:top-0 md:bottom-auto md:border-t-0 md:border-b">
            <div className="max-w-2xl mx-auto px-6">
                <div className="flex items-center justify-between h-14">
                    {/* Desktop Logo */}
                    <Link href="/" className="hidden md:flex items-center gap-2">
                        <span className="text-lg">💕</span>
                        <span className="text-white/60 text-sm font-medium">Our Space</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center justify-around w-full md:w-auto md:gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`p-3 rounded-full transition-all duration-200 ${pathname === link.href
                                        ? 'bg-white/10'
                                        : 'hover:bg-white/5'
                                    }`}
                            >
                                <span className={`text-lg ${pathname === link.href ? 'opacity-100' : 'opacity-50'}`}>
                                    {link.icon}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* User & Sign Out - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        {user.photoURL && (
                            <img
                                src={user.photoURL}
                                alt=""
                                className="w-7 h-7 rounded-full opacity-60"
                            />
                        )}
                        <button
                            onClick={signOut}
                            className="text-white/30 text-xs hover:text-white/50 transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
