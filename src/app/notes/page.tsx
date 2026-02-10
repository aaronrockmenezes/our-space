'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadNotes();
    }, [user]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
        }
    }, [newNote]);

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
        <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden" style={{ paddingTop: '5rem' }}>
            {/* Header - Fixed Height */}
            <div className="relative z-10 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/[0.03] py-4">
                <button
                    onClick={() => router.push('/')}
                    className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white bg-white/5 rounded-full"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Love Notes</h1>
                    <p className="text-white/40 text-xs font-medium">Leave sweet messages for each other</p>
                </div>
            </div>

            {/* Messages Container with vertical demarcation lines (desktop only) */}
            <div className="flex-1 relative flex justify-center overflow-y-auto scrollbar-hide">
                {/* Left vertical line - desktop only */}
                <div className="hidden md:block absolute left-1/2 -translate-x-[320px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

                {/* Right vertical line - desktop only */}
                <div className="hidden md:block absolute left-1/2 translate-x-[320px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

                {/* Messages area */}
                <div className="w-full max-w-[600px] px-6 md:px-12 pb-48 pt-6">
                    {notes.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center rotate-3">
                                <span className="text-3xl opacity-30 grayscale">💌</span>
                            </div>
                            <p className="text-white/30 text-base font-medium">No notes yet</p>
                            <p className="text-white/20 text-sm mt-1">Be the first to send a love note</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {notes.map(note => {
                                const mine = note.senderId === user.uid;
                                return (
                                    <div key={note.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group w-full`}>
                                        <div
                                            className={`relative flex flex-col w-fit min-w-[140px] max-w-[85%] sm:max-w-[75%] ${mine
                                                ? 'bg-gradient-to-br from-rose-500/20 to-purple-600/20 border-rose-500/20 hover:border-rose-500/30'
                                                : 'bg-white/[0.05] border-white/[0.08] hover:border-white/15'
                                                } border rounded-2xl ${mine ? 'rounded-br-sm' : 'rounded-bl-sm'} !px-6 !py-4 transition-all duration-300 shadow-lg shadow-black/20`}
                                        >
                                            <p
                                                className="text-white/95 text-[15px] leading-relaxed select-text font-normal text-left [overflow-wrap:anywhere] whitespace-pre-wrap"
                                            >
                                                {note.content}
                                            </p>

                                            <div className={`flex items-center gap-3 mt-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">{format(note.createdAt, 'h:mm a')}</span>
                                                {mine && (
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                                            className="w-5 h-5 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400"
                                                            title="Delete note"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
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

            {/* Compose - Static at bottom */}
            <div className="w-full shrink-0 z-[100] bg-[#050508] border-t border-white/[0.05]">
                <div className="pb-8 pt-4 md:pb-8 flex justify-center">
                    <div className="w-full max-w-[600px] px-6 md:px-12">
                        <div className="flex items-end gap-3 bg-[#121217] border border-white/10 rounded-3xl p-2.5 shadow-xl shadow-black/50 transition-transform duration-300 focus-within:border-white/20 ring-1 ring-white/5">
                            <textarea
                                ref={textareaRef}
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendNote();
                                    }
                                }}
                                placeholder="Write a love note..."
                                className="flex-1 bg-transparent px-4 py-3 min-h-[52px] max-h-[140px] text-white text-[15px] resize-none focus:outline-none placeholder:text-white/20 placeholder:font-medium overflow-hidden [overflow-wrap:anywhere]"
                                rows={1}
                                maxLength={500}
                            />
                            <button
                                onClick={sendNote}
                                disabled={!newNote.trim() || sending}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 disabled:opacity-20 disabled:scale-100 disabled:shadow-none shrink-0 group"
                            >
                                <svg className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-center text-white/10 text-[10px] font-medium tracking-widest uppercase mt-3">{newNote.length} / 500</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
