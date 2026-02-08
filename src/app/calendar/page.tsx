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
        <div className="min-h-screen bg-[#0a0a0f] pb-28 md:pb-12 flex flex-col items-center" style={{ paddingTop: '6rem' }}>
            <div className="w-full max-w-md mx-auto px-6">
                {/* Header - Centered */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-semibold text-white mb-2">Calendar</h1>
                    <p className="text-white/40 text-sm">Track your special moments</p>
                </div>

                {/* Month Navigator - Centered */}
                <div className="flex items-center justify-center gap-6 mb-8">
                    <button
                        onClick={() => setMonth(subMonths(month, 1))}
                        className="w-10 h-10 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-all border border-white/[0.06]"
                    >
                        ←
                    </button>
                    <h2 className="text-lg font-medium text-white min-w-[160px] text-center">{format(month, 'MMMM yyyy')}</h2>
                    <button
                        onClick={() => setMonth(addMonths(month, 1))}
                        className="w-10 h-10 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-all border border-white/[0.06]"
                    >
                        →
                    </button>
                </div>

                {/* Day Names - Centered */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                        <div key={i} className="text-center text-white/30 text-[10px] uppercase tracking-wider py-2 font-medium">{d}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-10">
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
                                className={`aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center relative transition-all ${today
                                    ? 'bg-white text-black'
                                    : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                                    } ${hasSpecial ? 'ring-2 ring-rose-400/50 ring-offset-1 ring-offset-[#0a0a0f]' : ''}`}
                            >
                                {format(day, 'd')}
                                {hasEvent && !today && (
                                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white/40"></span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Special Dates */}
                {events.filter(e => e.isSpecial).length > 0 && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                        <h3 className="text-white/40 text-xs font-medium uppercase tracking-[0.1em] mb-4">Special Dates</h3>
                        <div className="space-y-3">
                            {events.filter(e => e.isSpecial).map(e => (
                                <div key={e.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                            <span className="text-sm">💕</span>
                                        </div>
                                        <div>
                                            <p className="text-white/80 text-sm font-medium">{e.title}</p>
                                            <p className="text-white/30 text-xs">{format(e.date, 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteEvent(e.id)}
                                        className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
