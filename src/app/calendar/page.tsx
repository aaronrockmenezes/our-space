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
    description?: string;
    isSpecial?: boolean;
}

const PRESET_BACKGROUNDS = [
    { name: 'None', url: '', color: 'transparent' },
    { name: 'Ocean Blue', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920', color: '#1a365d' },
    { name: 'Soft Pink', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920', color: '#c06c84' },
    { name: 'Golden Hour', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920', color: '#c9a962' },
    { name: 'Lavender', url: 'https://images.unsplash.com/photo-1468421870903-4df1664ac249?w=1920', color: '#6b5b95' },
];

export default function CalendarPage() {
    const { user, loading } = useAuth();
    const { calendarBackground, setCalendarBackground } = useTheme();
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', isSpecial: false });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            loadEvents();
        }
    }, [user, currentMonth]);

    const loadEvents = async () => {
        try {
            const eventsQuery = query(collection(db, 'calendarEvents'));
            const snapshot = await getDocs(eventsQuery);

            const loadedEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    isSpecial: data.isSpecial,
                    date: data.date.toDate(),
                };
            });

            setEvents(loadedEvents);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const addEvent = async () => {
        if (!selectedDate || !newEvent.title || !user) return;

        try {
            await addDoc(collection(db, 'calendarEvents'), {
                title: newEvent.title,
                description: newEvent.description,
                isSpecial: newEvent.isSpecial,
                date: Timestamp.fromDate(selectedDate),
                createdBy: user.uid,
            });

            setNewEvent({ title: '', description: '', isSpecial: false });
            setShowEventModal(false);
            loadEvents();
        } catch (error) {
            console.error('Error adding event:', error);
        }
    };

    const deleteEvent = async (eventId: string) => {
        try {
            await deleteDoc(doc(db, 'calendarEvents', eventId));
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const getEventsForDate = (date: Date) => events.filter(e => isSameDay(e.date, date));

    return (
        <div
            className="min-h-screen py-8 px-6"
            style={{
                backgroundImage: calendarBackground ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${calendarBackground})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 slide-up">
                    <div>
                        <h1 className="text-4xl font-semibold text-white mb-1">
                            Our Calendar
                        </h1>
                        <p className="text-white/70">Track our special moments</p>
                    </div>
                    <button
                        onClick={() => setShowBgPicker(true)}
                        className="btn-secondary"
                    >
                        🎨 Theme
                    </button>
                </div>

                {/* Calendar Card */}
                <div className="glass-card-static p-6 md:p-8 slide-up delay-100">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-[var(--text-primary)]"
                        >
                            ←
                        </button>
                        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-[var(--text-primary)]"
                        >
                            →
                        </button>
                    </div>

                    {/* Day Names */}
                    <div className="calendar-grid mb-3">
                        {dayNames.map((day, i) => (
                            <div key={i} className="text-center text-[var(--text-muted)] text-sm font-medium py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="calendar-grid">
                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {days.map(day => {
                            const dayEvents = getEventsForDate(day);
                            const hasSpecial = dayEvents.some(e => e.isSpecial);

                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => {
                                        setSelectedDate(day);
                                        setShowEventModal(true);
                                    }}
                                    className={`calendar-day ${isToday(day) ? 'today' : ''} ${hasSpecial ? 'special' : ''}`}
                                >
                                    {format(day, 'd')}
                                    {dayEvents.length > 0 && !isToday(day) && (
                                        <div className="absolute bottom-1 flex gap-0.5">
                                            {dayEvents.slice(0, 3).map((_, i) => (
                                                <span key={i} className="w-1 h-1 bg-[var(--accent)] rounded-full" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Special Dates */}
                <div className="glass-card-static p-6 mt-6 slide-up delay-200">
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
                        💕 Special Dates
                    </h3>
                    <div className="space-y-2">
                        {events.filter(e => e.isSpecial).length === 0 ? (
                            <p className="text-[var(--text-muted)] text-center py-4">
                                No special dates yet. Click any day to add one!
                            </p>
                        ) : (
                            events.filter(e => e.isSpecial).map(event => (
                                <div key={event.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl">
                                    <span className="text-xl">💕</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-[var(--text-primary)]">{event.title}</p>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {format(event.date, 'MMMM d, yyyy')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteEvent(event.id)}
                                        className="text-red-400 hover:text-red-500 p-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Event Modal */}
            {showEventModal && selectedDate && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="glass-card-static p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
                            {format(selectedDate, 'MMMM d, yyyy')}
                        </h3>

                        {getEventsForDate(selectedDate).length > 0 && (
                            <div className="mb-6 space-y-2">
                                {getEventsForDate(selectedDate).map(event => (
                                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <span>{event.isSpecial ? '💕' : '📌'}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-[var(--text-primary)]">{event.title}</p>
                                            {event.description && (
                                                <p className="text-sm text-[var(--text-muted)]">{event.description}</p>
                                            )}
                                        </div>
                                        <button onClick={() => deleteEvent(event.id)} className="text-red-400">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Event title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                className="input-modern"
                            />
                            <textarea
                                placeholder="Description (optional)"
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                className="input-modern min-h-[80px] resize-none"
                            />
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newEvent.isSpecial}
                                    onChange={(e) => setNewEvent({ ...newEvent, isSpecial: e.target.checked })}
                                    className="w-5 h-5 accent-[var(--accent)] rounded"
                                />
                                <span className="text-[var(--text-primary)]">💕 Mark as special date</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowEventModal(false)} className="btn-outline flex-1">
                                    Cancel
                                </button>
                                <button onClick={addEvent} className="btn-primary flex-1">
                                    Add Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Picker Modal */}
            {showBgPicker && (
                <div className="modal-overlay" onClick={() => setShowBgPicker(false)}>
                    <div className="glass-card-static p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
                            Choose Background
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            {PRESET_BACKGROUNDS.map((bg) => (
                                <button
                                    key={bg.name}
                                    onClick={() => {
                                        setCalendarBackground(bg.url || null);
                                        setShowBgPicker(false);
                                    }}
                                    className={`aspect-video rounded-xl overflow-hidden relative group border-2 transition-all ${calendarBackground === bg.url ? 'border-[var(--accent)]' : 'border-transparent'
                                        }`}
                                >
                                    {bg.url ? (
                                        <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400 text-2xl">✕</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-medium text-sm">{bg.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
