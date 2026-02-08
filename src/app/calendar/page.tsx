'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [isSpecial, setIsSpecial] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadEvents();
    }, [user]);

    const loadEvents = async () => {
        try {
            const snapshot = await getDocs(query(collection(db, 'calendarEvents')));
            setEvents(snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                date: doc.data().date.toDate(),
                isSpecial: doc.data().isSpecial,
            })));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const addEvent = async () => {
        if (!selectedDate || !newEventTitle || !user) return;
        await addDoc(collection(db, 'calendarEvents'), {
            title: newEventTitle,
            date: Timestamp.fromDate(selectedDate),
            isSpecial,
            createdBy: user.uid,
        });
        setNewEventTitle('');
        setIsSpecial(false);
        setShowModal(false);
        loadEvents();
    };

    const deleteEvent = async (id: string) => {
        await deleteDoc(doc(db, 'calendarEvents', id));
        loadEvents();
    };

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-white/40 text-sm">Loading...</div>
        </div>;
    }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const getEventsForDate = (date: Date) => events.filter(e => isSameDay(e.date, date));

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-20 md:pb-8">
            <div className="max-w-md mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-xl font-light text-white mb-1">Calendar</h1>
                    <p className="text-white/30 text-xs">Our special dates</p>
                </div>

                {/* Month Nav */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-white/40 hover:text-white/60 p-2">←</button>
                    <h2 className="text-white/80 text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</h2>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-white/40 hover:text-white/60 p-2">→</button>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((d, i) => (
                        <div key={i} className="text-center text-white/30 text-xs py-2">{d}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {days.map(day => {
                        const dayEvents = getEventsForDate(day);
                        const hasEvent = dayEvents.length > 0;
                        const hasSpecial = dayEvents.some(e => e.isSpecial);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => { setSelectedDate(day); setShowModal(true); }}
                                className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition-all relative ${isToday(day) ? 'bg-white text-black' : 'text-white/50 hover:bg-white/10'
                                    } ${hasSpecial ? 'ring-1 ring-pink-500/50' : ''}`}
                            >
                                {format(day, 'd')}
                                {hasEvent && !isToday(day) && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/40"></span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Special Dates List */}
                {events.filter(e => e.isSpecial).length > 0 && (
                    <div className="mt-10">
                        <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4">Special Dates</h3>
                        <div className="space-y-2">
                            {events.filter(e => e.isSpecial).map(event => (
                                <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                                    <div>
                                        <p className="text-white/70 text-sm">{event.title}</p>
                                        <p className="text-white/30 text-xs">{format(event.date, 'MMM d, yyyy')}</p>
                                    </div>
                                    <button onClick={() => deleteEvent(event.id)} className="text-white/30 hover:text-white/50 text-xs">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Event Modal */}
            {showModal && selectedDate && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
                    <div className="bg-[#141418] rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white/80 text-sm font-medium mb-4">{format(selectedDate, 'MMMM d, yyyy')}</h3>

                        {/* Existing events */}
                        {getEventsForDate(selectedDate).length > 0 && (
                            <div className="mb-4 space-y-2">
                                {getEventsForDate(selectedDate).map(e => (
                                    <div key={e.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                        <span className="text-white/60 text-sm">{e.isSpecial ? '💕 ' : ''}{e.title}</span>
                                        <button onClick={() => deleteEvent(e.id)} className="text-white/30 text-xs">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Event title"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white/80 text-sm focus:outline-none focus:border-white/20 placeholder:text-white/20 mb-3"
                        />

                        <label className="flex items-center gap-2 text-white/50 text-sm mb-4 cursor-pointer">
                            <input type="checkbox" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)} className="rounded" />
                            Mark as special 💕
                        </label>

                        <div className="flex gap-2">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-white/40 text-sm hover:text-white/60">Cancel</button>
                            <button onClick={addEvent} className="flex-1 py-2 bg-white/10 text-white/80 text-sm rounded-xl hover:bg-white/15">Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
