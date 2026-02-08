'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LoveNote {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
}

export default function NotesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState<LoveNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadNotes();
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [notes]);

    const loadNotes = async () => {
        const snap = await getDocs(query(collection(db, 'loveNotes'), orderBy('createdAt', 'asc')));
        setNotes(snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt.toDate(),
        } as LoveNote)));
    };

    const sendNote = async () => {
        if (!newNote.trim() || !user) return;
        setSending(true);
        await addDoc(collection(db, 'loveNotes'), {
            content: newNote.trim(),
            senderId: user.uid,
            senderName: user.displayName || 'You',
            senderPhoto: user.photoURL || '',
            createdAt: Timestamp.now(),
        });
        setNewNote('');
        loadNotes();
        setSending(false);
    };

    const deleteNote = async (id: string) => {
        await deleteDoc(doc(db, 'loveNotes', id));
        loadNotes();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendNote();
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col" style={{ paddingTop: '5rem' }}>
            {/* Header */}
            <div className="text-center py-8">
                <h1 className="text-3xl font-semibold text-white mb-3">Love Notes</h1>
                <p className="text-white/40 text-sm">Leave sweet messages for each other</p>
            </div>

            {/* Messages Container with vertical demarcation lines (desktop only) */}
            <div className="flex-1 relative flex justify-center">
                {/* Left vertical line - desktop only */}
                <div className="hidden md:block absolute left-1/2 -translate-x-[300px] top-0 bottom-36 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

                {/* Right vertical line - desktop only */}
                <div className="hidden md:block absolute left-1/2 translate-x-[300px] top-0 bottom-36 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

                {/* Messages area */}
                <div className="w-full max-w-[560px] px-6 pb-44">
                    {notes.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                <span className="text-3xl opacity-40">💌</span>
                            </div>
                            <p className="text-white/30 text-base">No notes yet</p>
                            <p className="text-white/20 text-sm mt-2">Be the first to send a love note</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {notes.map(note => {
                                const mine = note.senderId === user.uid;
                                return (
                                    <div key={note.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
                                        <div
                                            className={`inline-block max-w-[70%] ${mine
                                                    ? 'bg-gradient-to-br from-rose-500/25 to-purple-500/25 border-rose-500/30'
                                                    : 'bg-white/[0.06] border-white/[0.1]'
                                                } border rounded-2xl ${mine ? 'rounded-br-sm' : 'rounded-bl-sm'} px-5 py-4`}
                                        >
                                            <p
                                                className="text-white/95 text-base leading-relaxed"
                                                style={{
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    whiteSpace: 'pre-wrap'
                                                }}
                                            >
                                                {note.content}
                                            </p>
                                            <div className={`flex items-center gap-3 mt-3 pt-2 border-t ${mine ? 'border-white/10 justify-end' : 'border-white/5'}`}>
                                                <span className="text-white/35 text-xs">{format(note.createdAt, 'MMM d, h:mm a')}</span>
                                                {mine && (
                                                    <button
                                                        onClick={() => deleteNote(note.id)}
                                                        className="text-white/25 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Compose - Fixed at bottom, CENTERED */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/98 to-transparent pt-10 pb-8 md:pb-10 flex justify-center">
                <div className="w-full max-w-[560px] px-6">
                    <div className="flex items-end gap-4 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-3 shadow-2xl shadow-black/40">
                        <textarea
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Write a love note..."
                            className="flex-1 bg-transparent px-4 py-3 text-white text-base resize-none focus:outline-none placeholder:text-white/30"
                            rows={1}
                            maxLength={500}
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                        />
                        <button
                            onClick={sendNote}
                            disabled={!newNote.trim() || sending}
                            className="w-12 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-purple-500 text-white flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg hover:shadow-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-white/25 text-xs mt-3">{newNote.length}/500</p>
                </div>
            </div>

            {/* Bottom padding for mobile nav */}
            <div className="h-20 md:hidden" />
        </div>
    );
}
