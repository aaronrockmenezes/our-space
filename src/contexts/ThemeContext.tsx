'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

type ThemeColor = 'bridgerton' | 'lavender' | 'rose' | 'sage' | 'sunset';

interface ThemeContextType {
    theme: ThemeColor;
    setTheme: (theme: ThemeColor) => void;
    calendarBackground: string | null;
    setCalendarBackground: (url: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themeColors = {
    bridgerton: {
        primary: '#1e3a5f',
        secondary: '#c9a962',
        accent: '#7ba3c9',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #3d5a7f 100%)',
        card: 'rgba(255, 255, 255, 0.95)',
        text: '#1e3a5f',
        textLight: '#5a7a9a',
    },
    lavender: {
        primary: '#6b5b95',
        secondary: '#d4c4e8',
        accent: '#9b8bb8',
        background: 'linear-gradient(135deg, #6b5b95 0%, #7b6ba5 50%, #8b7bb5 100%)',
        card: 'rgba(255, 255, 255, 0.95)',
        text: '#4a3b75',
        textLight: '#7a6b95',
    },
    rose: {
        primary: '#c06c84',
        secondary: '#f8b4c4',
        accent: '#e8a4b4',
        background: 'linear-gradient(135deg, #c06c84 0%, #d07c94 50%, #e08ca4 100%)',
        card: 'rgba(255, 255, 255, 0.95)',
        text: '#8a3c54',
        textLight: '#ba6c84',
    },
    sage: {
        primary: '#5c7a5c',
        secondary: '#b8d4b8',
        accent: '#8aaa8a',
        background: 'linear-gradient(135deg, #5c7a5c 0%, #6c8a6c 50%, #7c9a7c 100%)',
        card: 'rgba(255, 255, 255, 0.95)',
        text: '#3c5a3c',
        textLight: '#6c8a6c',
    },
    sunset: {
        primary: '#e07b53',
        secondary: '#f8c8a4',
        accent: '#f0a87c',
        background: 'linear-gradient(135deg, #e07b53 0%, #e88b63 50%, #f09b73 100%)',
        card: 'rgba(255, 255, 255, 0.95)',
        text: '#a04b23',
        textLight: '#c07b53',
    },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeColor>('bridgerton');
    const [calendarBackground, setCalendarBackgroundState] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadUserPreferences();
        }
    }, [user]);

    const loadUserPreferences = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'userPreferences', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.theme) setThemeState(data.theme);
                if (data.calendarBackground) setCalendarBackgroundState(data.calendarBackground);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };

    const setTheme = async (newTheme: ThemeColor) => {
        setThemeState(newTheme);
        if (user) {
            try {
                await setDoc(doc(db, 'userPreferences', user.uid), { theme: newTheme }, { merge: true });
            } catch (error) {
                console.error('Error saving theme:', error);
            }
        }
    };

    const setCalendarBackground = async (url: string | null) => {
        setCalendarBackgroundState(url);
        if (user) {
            try {
                await setDoc(doc(db, 'userPreferences', user.uid), { calendarBackground: url }, { merge: true });
            } catch (error) {
                console.error('Error saving background:', error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, calendarBackground, setCalendarBackground }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
