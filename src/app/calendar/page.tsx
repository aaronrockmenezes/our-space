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

    if (loading || !user) return <div className="min-h-screen bg-[#0a0a0f]" />;

    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const startDay = start.getDay();
    const getEvents = (d: Date) => events.filter(e => isSameDay(e.date, d));

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-24 md:pb-12" style={{ paddingTop: '7rem' }}>
            <div className="max-w-sm mx-auto px-6">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setMonth(subMonths(month, 1))} className="text-white/40 p-2">←</button>
                    <h1 className="text-lg font-light text-white">{format(month, 'MMMM yyyy')}</h1>
                    <button onClick={() => setMonth(addMonths(month, 1))} className="text-white/40 p-2">→</button>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-white/30 text-xs py-1">{d}</div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
                    {days.map(day => {
                        const hasEvent = getEvents(day).length > 0;
                        const hasSpecial = getEvents(day).some(e => e.isSpecial);
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={`aspect-square rounded-lg text-sm flex items-center justify-center relative ${isToday(day) ? 'bg-white text-black' : 'text-white/50 hover:bg-white/10'
                                    } ${hasSpecial ? 'ring-1 ring-pink-400/50' : ''}`}
                            >
                                {format(day, 'd')}
                                {hasEvent && !isToday(day) && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/40" />}
                            </button>
                        );
                    })}
                </div>

                {/* Special dates */}
                {events.filter(e => e.isSpecial).length > 0 && (
                    <div className="mt-8">
                        <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Special</p>
                        {events.filter(e => e.isSpecial).map(e => (
                            <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5">
                                <div>
                                    <p className="text-white/70 text-sm">{e.title}</p>
                                    <p className="text-white/30 text-xs">{format(e.date, 'MMM d')}</p>
                                </div>
                                <button onClick={() => deleteEvent(e.id)} className="text-white/30 text-xs">×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setSelectedDate(null)}>
                    <div className="bg-[#141418] rounded-xl p-5 max-w-xs w-full" onClick={e => e.stopPropagation()}>
                        <p className="text-white/70 text-sm mb-4">{format(selectedDate, 'MMMM d, yyyy')}</p>

                        {getEvents(selectedDate).map(e => (
                            <div key={e.id} className="flex items-center justify-between py-2 mb-2 border-b border-white/5">
                                <span className="text-white/60 text-sm">{e.isSpecial ? '💕 ' : ''}{e.title}</span>
                                <button onClick={() => deleteEvent(e.id)} className="text-white/30 text-xs">×</button>
                            </div>
                        ))}

                        <input
                            type="text"
                            placeholder="Add event"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white/80 text-sm mb-3 focus:outline-none"
                        />
                        <label className="flex items-center gap-2 text-white/40 text-sm mb-4">
                            <input type="checkbox" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)} />
                            Special 💕
                        </label>
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedDate(null)} className="flex-1 py-2 text-white/40 text-sm">Cancel</button>
                            <button onClick={addEvent} className="flex-1 py-2 bg-white/10 text-white/80 text-sm rounded-lg">Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
