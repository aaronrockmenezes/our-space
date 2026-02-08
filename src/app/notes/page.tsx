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
                <div className="animate-pulse w-10 h-10 rounded-full bg-gradient-to-r from-rose-400/50 to-amber-300/50"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
            <div className="flex-1 max-w-lg mx-auto px-8 w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-light text-white mb-3">Love Notes</h1>
                    <p className="text-white/30 text-sm">Leave sweet messages for each other</p>
                </div>

                {/* Messages */}
                {notes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                            <span className="text-3xl opacity-50">💌</span>
                        </div>
                        <p className="text-white/30 text-sm mb-2">No notes yet</p>
                        <p className="text-white/20 text-xs">Be the first to send a love note</p>
                    </div>
                ) : (
                    <div className="space-y-6 mb-10">
                        {notes.map(note => {
                            const mine = note.senderId === user.uid;
                            return (
                                <div key={note.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
                                    <div
                                        className={`max-w-[85%] relative ${mine
                                                ? 'bg-gradient-to-br from-white/[0.12] to-white/[0.08]'
                                                : 'bg-white/[0.05]'
                                            } rounded-3xl ${mine ? 'rounded-br-lg' : 'rounded-bl-lg'} px-5 py-4 border border-white/[0.08]`}
                                    >
                                        <p className="text-white/90 text-sm leading-relaxed break-words whitespace-pre-wrap">{note.content}</p>
                                        <div className={`flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.05] ${mine ? 'justify-end' : ''}`}>
                                            <span className="text-white/25 text-[10px]">{format(note.createdAt, 'MMM d, h:mm a')}</span>
                                            {mine && (
                                                <button
                                                    onClick={() => deleteNote(note.id)}
                                                    className="text-white/20 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    ×
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

            {/* Compose Area - Fixed at bottom */}
            <div className="fixed bottom-24 md:bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent pt-8 pb-6 px-6">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-end gap-4 bg-white/[0.03] border border-white/[0.08] rounded-3xl p-2">
                        <textarea
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Write a love note..."
                            className="flex-1 bg-transparent px-4 py-3 text-white/90 text-sm resize-none focus:outline-none placeholder:text-white/25"
                            rows={1}
                            maxLength={500}
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                        />
                        <button
                            onClick={sendNote}
                            disabled={!newNote.trim() || sending}
                            className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center transition-all hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                            {sending ? (
                                <span className="animate-pulse text-sm">...</span>
                            ) : (
                                <span className="text-lg">↑</span>
                            )}
                        </button>
                    </div>
                    <p className="text-center text-white/15 text-[10px] mt-3">{newNote.length}/500</p>
                </div>
            </div>
        </div>
    );
}
