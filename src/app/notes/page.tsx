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
            <div className="text-center py-6">
                <h1 className="text-2xl font-semibold text-white mb-2">Love Notes</h1>
                <p className="text-white/40 text-sm">Leave sweet messages for each other</p>
            </div>

            {/* Messages Container with vertical demarcation lines (desktop only) */}
            <div className="flex-1 relative flex justify-center">
                {/* Left vertical line - desktop only */}
                <div className="hidden md:block absolute left-1/2 -translate-x-[280px] top-0 bottom-32 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent"></div>

                {/* Right vertical line - desktop only */}
                <div className="hidden md:block absolute left-1/2 translate-x-[280px] top-0 bottom-32 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent"></div>

                {/* Messages area */}
                <div className="w-full max-w-[520px] px-6 pb-40">
                    {notes.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                <span className="text-2xl opacity-40">💌</span>
                            </div>
                            <p className="text-white/30 text-sm">No notes yet</p>
                            <p className="text-white/20 text-xs mt-1">Be the first to send a love note</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notes.map(note => {
                                const mine = note.senderId === user.uid;
                                return (
                                    <div key={note.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
                                        <div
                                            className={`max-w-[75%] ${mine
                                                ? 'bg-gradient-to-br from-rose-500/20 to-purple-500/20 border-rose-500/20'
                                                : 'bg-white/[0.05] border-white/[0.08]'
                                                } border rounded-2xl ${mine ? 'rounded-br-md' : 'rounded-bl-md'} px-4 py-3`}
                                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                        >
                                            <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                            <div className={`flex items-center gap-2 mt-2 ${mine ? 'justify-end' : ''}`}>
                                                <span className="text-white/30 text-[11px]">{format(note.createdAt, 'MMM d, h:mm a')}</span>
                                                {mine && (
                                                    <button
                                                        onClick={() => deleteNote(note.id)}
                                                        className="text-white/20 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ✕
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
            <div className="fixed bottom-0 left-0 right-0 md:bottom-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent pt-8 pb-6 md:pb-8 flex justify-center">
                <div className="w-full max-w-[520px] px-6">
                    <div className="flex items-end gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-2.5 shadow-xl shadow-black/30">
                        <textarea
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Write a love note..."
                            className="flex-1 bg-transparent px-3 py-2.5 text-white text-[15px] resize-none focus:outline-none placeholder:text-white/30"
                            rows={1}
                            maxLength={500}
                            style={{ minHeight: '44px', maxHeight: '100px' }}
                        />
                        <button
                            onClick={sendNote}
                            disabled={!newNote.trim() || sending}
                            className="w-11 h-11 rounded-xl bg-gradient-to-r from-rose-500 to-purple-500 text-white flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-rose-500/25"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-white/20 text-[10px] mt-2">{newNote.length}/500</p>
                </div>
            </div>

            {/* Bottom padding for mobile nav */}
            <div className="h-16 md:hidden"></div>
        </div>
    );
}
