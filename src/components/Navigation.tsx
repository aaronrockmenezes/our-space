'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const navLinks = [
        { href: '/', label: 'Home', icon: '🏠' },
        { href: '/gallery', label: 'Gallery', icon: '📸' },
        { href: '/calendar', label: 'Calendar', icon: '📅' },
        { href: '/notes', label: 'Notes', icon: '💌' },
    ];

    if (!user) return null;

    return (
        <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl group-hover:scale-110 transition-transform">💕</span>
                        <span className="text-white font-semibold text-lg hidden sm:block">
                            Our Space
                        </span>
                    </Link>

                    {/* Nav Links - Desktop */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-item ${pathname === link.href ? 'active' : ''}`}
                            >
                                <span>{link.icon}</span>
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        {user.photoURL && (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || 'User'}
                                className="w-9 h-9 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors"
                            />
                        )}
                        <button
                            onClick={signOut}
                            className="btn-secondary text-sm py-2 px-4"
                        >
                            Sign Out
                        </button>
                    </div>

                    {/* Mobile Nav */}
                    <div className="md:hidden flex items-center gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`p-2 rounded-lg transition-colors ${pathname === link.href
                                        ? 'bg-white/20'
                                        : 'hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-lg">{link.icon}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
