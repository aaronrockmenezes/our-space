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
        const snap = await getDocs(query(collection(db, 'loveNotes'), orderBy('createdAt', 'desc')));
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

    if (loading || !user) return <div className="min-h-screen bg-[#0a0a0f]" />;

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-24 md:pb-12" style={{ paddingTop: '7rem' }}>
            <div className="max-w-md mx-auto px-6">
                {/* Header */}
                <h1 className="text-xl font-light text-white text-center mb-8">Notes</h1>

                {/* Compose */}
                <div className="mb-8">
                    <textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Write something..."
                        className="w-full bg-transparent border border-white/10 rounded-xl p-4 text-white/70 text-sm resize-none focus:outline-none focus:border-white/20 placeholder:text-white/20"
                        rows={2}
                        maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-white/20 text-xs">{newNote.length}/500</span>
                        <button
                            onClick={sendNote}
                            disabled={!newNote.trim() || sending}
                            className="px-4 py-1.5 rounded-full text-xs bg-white/10 text-white/70 hover:bg-white/15 disabled:opacity-30"
                        >
                            Send
                        </button>
                    </div>
                </div>

                {/* Notes */}
                {notes.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-12">No notes yet</p>
                ) : (
                    <div className="space-y-4">
                        {notes.map(note => {
                            const mine = note.senderId === user.uid;
                            return (
                                <div key={note.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] ${mine ? 'bg-white/10' : 'bg-white/5'} rounded-2xl px-4 py-3`}>
                                        <p className="text-white/70 text-sm">{note.content}</p>
                                        <div className={`flex items-center gap-2 mt-2 text-white/30 text-xs ${mine ? 'justify-end' : ''}`}>
                                            <span>{format(note.createdAt, 'MMM d')}</span>
                                            {mine && <button onClick={() => deleteNote(note.id)} className="hover:text-white/50">×</button>}
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
