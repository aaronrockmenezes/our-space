'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !loading) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 -mt-20">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="glass-card p-10 max-w-md w-full text-center slide-up relative">
                {/* Logo */}
                <div className="mb-8">
                    <div className="text-6xl mb-4 float">💕</div>
                    <h1 className="text-4xl font-semibold text-[var(--primary)]">
                        Our Space
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg">
                        A special place just for us
                    </p>
                </div>

                {/* Ornament Divider */}
                <div className="ornament my-8">
                    <span>✦</span>
                </div>

                {/* Quote */}
                <p className="text-lg mb-10 text-[var(--text-secondary)] italic leading-relaxed">
                    "Every love story is beautiful, but ours is my favorite"
                </p>

                {/* Google Sign In Button */}
                <button
                    onClick={signInWithGoogle}
                    className="btn-google w-full group"
                >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </button>

                {/* Footer */}
                <p className="mt-8 text-sm text-[var(--text-muted)]">
                    Sign in with your Google account to access our special space
                </p>
            </div>
        </div>
    );
}
