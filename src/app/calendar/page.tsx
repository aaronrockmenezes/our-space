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
                <div className="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"></div>
            </div>
        );
    }

    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const startDay = start.getDay();
    const getEvents = (d: Date) => events.filter(e => isSameDay(e.date, d));

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-12">
            {/* Header Spacer */}
            <div className="w-full h-[180px]" />
            <div className="w-full max-w-6xl mx-auto px-6 md:px-20">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Calendar Grid (Takes up 2/3 space) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header & Controls */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">Calendar</h1>
                                <p className="text-white/40 text-sm">Track your special moments</p>
                            </div>

                            <div className="flex items-center bg-[#18181b] p-1 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setMonth(subMonths(month, 1))}
                                    className="w-9 h-9 rounded-lg hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
                                >
                                    ←
                                </button>
                                <h2 className="text-sm font-medium text-white w-32 text-center">{format(month, 'MMMM yyyy')}</h2>
                                <button
                                    onClick={() => setMonth(addMonths(month, 1))}
                                    className="w-9 h-9 rounded-lg hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        {/* Calendar Board */}
                        <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
                            {/* Day Names */}
                            <div className="grid grid-cols-7 gap-1 mb-4 border-b border-white/[0.05] pb-4">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                                    <div key={i} className="text-center text-white/30 text-xs uppercase tracking-wider font-semibold">{d}</div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1">
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
                                            className={`aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center relative transition-all group ${today
                                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                                : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                                                } ${hasSpecial ? 'ring-1 ring-rose-500/50 bg-rose-500/10 text-rose-200' : ''}`}
                                        >
                                            <span className={`z-10 ${today ? 'font-bold' : ''}`}>{format(day, 'd')}</span>

                                            {/* Indicators */}
                                            <div className="flex gap-0.5 mt-1">
                                                {hasEvent && !today && (
                                                    <span className={`w-1 h-1 rounded-full ${hasSpecial ? 'bg-rose-500' : 'bg-white/30 group-hover:bg-white/60'}`}></span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Special Dates & Upcoming (Takes up 1/3 space) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Upcoming / Special Section */}
                        <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-6 h-full min-h-[500px]">
                            <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
                                <span className="text-rose-400">💕</span>
                                Special Dates
                            </h3>

                            {events.filter(e => e.isSpecial).length > 0 ? (
                                <div className="space-y-4">
                                    {events.filter(e => e.isSpecial)
                                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                                        .map(e => (
                                            <div key={e.id} className="relative group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4 transition-all">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center justify-center bg-[#1a1a20] rounded-xl w-12 h-12 border border-white/10 shrink-0">
                                                        <span className="text-rose-500 text-xs font-bold uppercase">{format(e.date, 'MMM')}</span>
                                                        <span className="text-white text-lg font-bold leading-none">{format(e.date, 'd')}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white/90 font-medium truncate">{e.title}</p>
                                                        <p className="text-white/40 text-xs mt-0.5">{format(e.date, 'EEEE, yyyy')}</p>
                                                    </div>
                                                    <button
                                                        onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }}
                                                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1"
                                                    >✕</button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl grayscale opacity-30">📅</span>
                                    </div>
                                    <p className="text-white/30 text-sm">No special dates marked yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedDate(null)}>
                    <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white text-lg font-medium mb-1">{format(selectedDate, 'EEEE')}</h3>
                        <p className="text-white/40 text-sm mb-6">{format(selectedDate, 'MMMM d, yyyy')}</p>

                        {getEvents(selectedDate).length > 0 && (
                            <div className="space-y-2 mb-6">
                                {getEvents(selectedDate).map(e => (
                                    <div key={e.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                                        <span className="text-white/70 text-sm">{e.isSpecial && '💕 '}{e.title}</span>
                                        <button onClick={() => deleteEvent(e.id)} className="text-white/30 hover:text-red-400">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Add an event..."
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm mb-4 focus:outline-none focus:border-white/20 placeholder:text-white/30"
                        />

                        <label className="flex items-center gap-3 text-white/50 text-sm mb-6 cursor-pointer">
                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isSpecial ? 'bg-rose-500 border-rose-500' : 'border-white/20'}`}>
                                {isSpecial && <span className="text-white text-xs">✓</span>}
                            </div>
                            <input type="checkbox" className="hidden" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)} />
                            Mark as special 💕
                        </label>

                        <div className="flex gap-3">
                            <button onClick={() => setSelectedDate(null)} className="flex-1 py-3 text-white/50 text-sm rounded-xl hover:bg-white/[0.03] border border-white/[0.06] transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={addEvent}
                                disabled={!newTitle.trim()}
                                className="flex-1 py-3 bg-white text-black text-sm font-medium rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
