'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { collection, query, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    isSpecial?: boolean;
}

export default function CalendarPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [month, setMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [isSpecial, setIsSpecial] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadEvents();
    }, [user]);

    const loadEvents = async () => {
        const snap = await getDocs(query(collection(db, 'calendarEvents')));
        setEvents(snap.docs.map(d => ({
            id: d.id,
            title: d.data().title,
            date: d.data().date.toDate(),
            isSpecial: d.data().isSpecial,
        })));
    };

    const addEvent = async () => {
        if (!selectedDate || !newTitle || !user) return;
        await addDoc(collection(db, 'calendarEvents'), {
            title: newTitle,
            date: Timestamp.fromDate(selectedDate),
            isSpecial,
            createdBy: user.uid,
        });
        setNewTitle('');
        setIsSpecial(false);
        setSelectedDate(null);
        loadEvents();
    };

    const deleteEvent = async (id: string) => {
        await deleteDoc(doc(db, 'calendarEvents', id));
        loadEvents();
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="animate-pulse w-10 h-10 rounded-full bg-gradient-to-r from-rose-400/50 to-amber-300/50"></div>
            </div>
        );
    }

    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const startDay = start.getDay();
    const getEvents = (d: Date) => events.filter(e => isSameDay(e.date, d));

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-32 md:pb-16" style={{ paddingTop: '8rem' }}>
            <div className="max-w-md mx-auto px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-light text-white mb-3">Calendar</h1>
                    <p className="text-white/30 text-sm">Track your special moments</p>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <button
                        onClick={() => setMonth(subMonths(month, 1))}
                        className="w-12 h-12 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12]"
                    >
                        ←
                    </button>
                    <h2 className="text-xl font-medium text-white">{format(month, 'MMMM yyyy')}</h2>
                    <button
                        onClick={() => setMonth(addMonths(month, 1))}
                        className="w-12 h-12 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12]"
                    >
                        →
                    </button>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <div key={i} className="text-center text-white/25 text-[10px] uppercase tracking-[0.15em] py-3 font-medium">{d}</div>
                    ))}
                </div>

                {/* Calendar Grid - Rounder corners and more spacing */}
                <div className="grid grid-cols-7 gap-2 mb-12">
                    {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
                    {days.map(day => {
                        const dayEvents = getEvents(day);
                        const hasEvent = dayEvents.length > 0;
                        const hasSpecial = dayEvents.some(e => e.isSpecial);
                        const today = isToday(day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={`aspect-square rounded-2xl text-sm font-medium flex flex-col items-center justify-center relative transition-all duration-300 ${today
                                        ? 'bg-white text-black shadow-lg shadow-white/20'
                                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                                    } ${hasSpecial ? 'ring-2 ring-rose-400/40 ring-offset-2 ring-offset-[#0a0a0f]' : ''}`}
                            >
                                {format(day, 'd')}
                                {hasEvent && !today && (
                                    <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-white/40"></span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Special Dates - Rounder card */}
                {events.filter(e => e.isSpecial).length > 0 && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
                        <h3 className="text-white/40 text-xs font-medium uppercase tracking-[0.15em] mb-6">Special Dates</h3>
                        <div className="space-y-5">
                            {events.filter(e => e.isSpecial).map(e => (
                                <div key={e.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                            <span className="text-base">💕</span>
                                        </div>
                                        <div>
                                            <p className="text-white/80 text-sm font-medium">{e.title}</p>
                                            <p className="text-white/30 text-xs mt-0.5">{format(e.date, 'MMMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteEvent(e.id)}
                                        className="text-white/20 hover:text-red-400 text-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Event Modal */}
            {selectedDate && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-8"
                    onClick={() => setSelectedDate(null)}
                >
                    <div
                        className="bg-[#12121a] border border-white/[0.08] rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-white text-xl font-medium mb-2">{format(selectedDate, 'EEEE')}</h3>
                        <p className="text-white/40 text-sm mb-8">{format(selectedDate, 'MMMM d, yyyy')}</p>

                        {/* Existing events */}
                        {getEvents(selectedDate).length > 0 && (
                            <div className="space-y-3 mb-8">
                                {getEvents(selectedDate).map(e => (
                                    <div key={e.id} className="flex items-center justify-between p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
                                        <span className="text-white/70 text-sm">
                                            {e.isSpecial && '💕 '}{e.title}
                                        </span>
                                        <button
                                            onClick={() => deleteEvent(e.id)}
                                            className="text-white/30 hover:text-red-400 text-lg transition-colors"
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new event */}
                        <input
                            type="text"
                            placeholder="Add an event..."
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white/90 text-sm mb-5 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all placeholder:text-white/25"
                        />

                        <label className="flex items-center gap-4 text-white/50 text-sm mb-8 cursor-pointer group">
                            <div className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${isSpecial ? 'bg-rose-500 border-rose-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                {isSpecial && <span className="text-white text-xs">✓</span>}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSpecial}
                                onChange={e => setIsSpecial(e.target.checked)}
                            />
                            Mark as special date 💕
                        </label>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="flex-1 py-4 text-white/40 text-sm rounded-2xl hover:bg-white/[0.04] border border-white/[0.06] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addEvent}
                                disabled={!newTitle.trim()}
                                className="flex-1 py-4 bg-white text-black text-sm font-medium rounded-2xl hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Add Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
