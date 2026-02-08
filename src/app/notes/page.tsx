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
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            loadNotes();
        }
    }, [user]);

    const loadNotes = async () => {
        try {
            const notesQuery = query(collection(db, 'loveNotes'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(notesQuery);

            const loadedNotes = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    content: data.content,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    senderPhoto: data.senderPhoto,
                    createdAt: data.createdAt.toDate(),
                };
            });

            setNotes(loadedNotes);
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
            console.error('Error sending note:', error);
        } finally {
            setSending(false);
        }
    };

    const deleteNote = async (noteId: string) => {
        try {
            await deleteDoc(doc(db, 'loveNotes', noteId));
            loadNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white/60 text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-8 relative z-10">
            {/* Background Orbs */}
            <div className="bg-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            {/* Header */}
            <div className="text-center mb-10 slide-up">
                <h1 className="text-4xl font-medium text-white glow-text mb-3">
                    Love Notes
                </h1>
                <p className="text-[var(--text-muted)] italic font-light">
                    "Words are our most inexhaustible source of magic"
                </p>
            </div>

            {/* Compose Note */}
            <div className="glass-card-static p-6 mb-8 slide-up delay-100">
                <h3 className="text-lg font-medium text-white mb-4">
                    ✍️ Write a Note
                </h3>
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write something sweet..."
                    className="input-modern min-h-[120px] resize-none mb-4"
                    maxLength={500}
                />
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-muted)]">
                        {newNote.length}/500
                    </span>
                    <button
                        onClick={sendNote}
                        disabled={!newNote.trim() || sending}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? 'Sending...' : '💕 Send'}
                    </button>
                </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4 slide-up delay-200">
                {notes.length === 0 ? (
                    <div className="glass-card-static p-12 text-center">
                        <div className="text-5xl mb-4">💌</div>
                        <p className="text-white text-lg font-medium mb-1">
                            No notes yet
                        </p>
                        <p className="text-[var(--text-muted)]">
                            Be the first to write something sweet!
                        </p>
                    </div>
                ) : (
                    notes.map((note, index) => {
                        const isFromMe = note.senderId === user.uid;

                        return (
                            <div
                                key={note.id}
                                className={`note-card ${isFromMe ? 'ml-6' : 'mr-6'}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex items-start gap-4 relative z-10">
                                    {note.senderPhoto ? (
                                        <img
                                            src={note.senderPhoto}
                                            alt={note.senderName}
                                            className="w-11 h-11 rounded-full border-2 border-[var(--accent-gold)]/30 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-rose)] flex items-center justify-center text-white font-medium flex-shrink-0">
                                            {note.senderName[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-white">
                                                {isFromMe ? 'You' : note.senderName}
                                            </span>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {format(note.createdAt, 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-[var(--text-secondary)] leading-relaxed">
                                            {note.content}
                                        </p>
                                    </div>

                                    {isFromMe && (
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className="text-red-400 hover:text-red-500 p-1 flex-shrink-0"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
