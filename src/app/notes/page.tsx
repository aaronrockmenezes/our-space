'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LoveNote {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderPhoto: string;
    createdAt: Date;
}

export default function NotesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState<LoveNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadNotes();
    }, [user]);

    const loadNotes = async () => {
        try {
            const notesQuery = query(collection(db, 'loveNotes'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(notesQuery);
            setNotes(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
            } as LoveNote)));
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    };

    const sendNote = async () => {
        if (!newNote.trim() || !user) return;
        setSending(true);
        try {
            await addDoc(collection(db, 'loveNotes'), {
                content: newNote.trim(),
                senderId: user.uid,
                senderName: user.displayName || 'Anonymous',
                senderPhoto: user.photoURL || '',
                createdAt: Timestamp.now(),
            });
            setNewNote('');
            loadNotes();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSending(false);
        }
    };

    const deleteNote = async (id: string) => {
        await deleteDoc(doc(db, 'loveNotes', id));
        loadNotes();
    };

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-white/40 text-sm">Loading...</div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-20 md:pb-8">
            <div className="max-w-lg mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-xl font-light text-white mb-1">Love Notes</h1>
                    <p className="text-white/30 text-xs">Sweet words for each other</p>
                </div>

                {/* Compose */}
                <div className="mb-10">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Write something sweet..."
                        className="w-full bg-transparent border border-white/10 rounded-xl p-4 text-white/80 text-sm resize-none focus:outline-none focus:border-white/20 placeholder:text-white/20"
                        rows={3}
                        maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-white/20 text-xs">{newNote.length}/500</span>
                        <button
                            onClick={sendNote}
                            disabled={!newNote.trim() || sending}
                            className="px-5 py-2 rounded-full text-xs font-medium bg-white/10 text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-30 transition-all"
                        >
                            {sending ? '...' : 'Send 💕'}
                        </button>
                    </div>
                </div>

                {/* Notes */}
                {notes.length === 0 ? (
                    <p className="text-center text-white/30 text-sm py-16">
                        No notes yet. Send the first one!
                    </p>
                ) : (
                    <div className="space-y-4">
                        {notes.map((note) => {
                            const isFromMe = note.senderId === user.uid;
                            return (
                                <div key={note.id} className={`flex gap-3 ${isFromMe ? 'flex-row-reverse' : ''}`}>
                                    {note.senderPhoto ? (
                                        <img src={note.senderPhoto} alt="" className="w-8 h-8 rounded-full opacity-60 flex-shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                                    )}
                                    <div className={`flex-1 ${isFromMe ? 'text-right' : ''}`}>
                                        <div className={`inline-block p-4 rounded-2xl ${isFromMe ? 'bg-white/10' : 'bg-white/[0.03]'} max-w-[90%]`}>
                                            <p className="text-white/70 text-sm leading-relaxed text-left">{note.content}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 mt-1 text-white/20 text-xs ${isFromMe ? 'justify-end' : ''}`}>
                                            <span>{format(note.createdAt, 'MMM d')}</span>
                                            {isFromMe && (
                                                <button onClick={() => deleteNote(note.id)} className="hover:text-white/40">Delete</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
