'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const ALLOWED_EMAILS = [
    'aaronrockmenezes@gmail.com',
    'aaron_rock@brown.edu',
    'dishag1023@gmail.com'
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const email = user.email?.toLowerCase();
                if (email && ALLOWED_EMAILS.includes(email)) {
                    setUser(user);
                    setError(null);
                } else {
                    console.log('Unauthorized login attempt:', email);
                    await firebaseSignOut(auth);
                    setUser(null);
                    setError('Access Denied: This email is not on the guest list.');
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            // The onAuthStateChanged listener will handle the allowlist check
        } catch (error: any) {
            console.error('Error signing in with Google:', error);
            setError('Failed to sign in. Please try again.');
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setError(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
