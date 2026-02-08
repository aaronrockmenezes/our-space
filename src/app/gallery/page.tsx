'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MediaItem {
    id: string;
    url: string;
    name: string;
    type: 'image' | 'audio';
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export default function GalleryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [photos, setPhotos] = useState<MediaItem[]>([]);
    const [music, setMusic] = useState<MediaItem[]>([]);
    const [tab, setTab] = useState<'photos' | 'music'>('photos');
    const [selectedPhoto, setSelectedPhoto] = useState<MediaItem | null>(null);
    const [playing, setPlaying] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadMedia();
    }, [user]);

    const loadMedia = async () => {
        const snapshot = await getDocs(query(collection(db, 'media'), orderBy('uploadedAt', 'desc')));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
        setPhotos(items.filter(i => i.type === 'image'));
        setMusic(items.filter(i => i.type === 'audio'));
    };

    const onDrop = useCallback(async (files: File[]) => {
        if (!user) return;
        setUploading(true);
        for (const file of files) {
            if (file.size > 1024 * 1024) continue;
            const base64 = await fileToBase64(file);
            await addDoc(collection(db, 'media'), {
                url: base64,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 'audio',
                uploadedAt: new Date(),
                uploadedBy: user.uid,
            });
        }
        loadMedia();
        setUploading(false);
    }, [user]);

    const deleteItem = async (item: MediaItem) => {
        if (!confirm('Delete this item?')) return;
        await deleteDoc(doc(db, 'media', item.id));
        loadMedia();
    };

    const playTrack = (item: MediaItem) => {
        if (audio) audio.pause();
        if (playing === item.id) { setPlaying(null); return; }
        const a = new Audio(item.url);
        a.play();
        a.onended = () => setPlaying(null);
        setAudio(a);
        setPlaying(item.id);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [], 'audio/*': [] },
        maxSize: 1024 * 1024,
    });

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-rose-400/50 to-amber-300/50"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-24 md:pb-12" style={{ paddingTop: '7rem' }}>
            <div className="max-w-2xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-light text-white mb-2">Gallery</h1>
                    <p className="text-white/30 text-sm">Your collection of memories</p>
                </div>

                {/* Upload Zone */}
                <div
                    {...getRootProps()}
                    className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 mb-8 ${isDragActive
                            ? 'border-white/30 bg-white/[0.05]'
                            : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/[0.05] flex items-center justify-center">
                        <span className="text-2xl">{uploading ? '⏳' : '+'}</span>
                    </div>
                    <p className="text-white/60 text-sm font-medium mb-1">
                        {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
                    </p>
                    <p className="text-white/30 text-xs">Photos and music • Max 1MB each</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                    <button
                        onClick={() => setTab('photos')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${tab === 'photos'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        📸 Photos ({photos.length})
                    </button>
                    <button
                        onClick={() => setTab('music')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${tab === 'music'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        🎵 Music ({music.length})
                    </button>
                </div>

                {/* Content */}
                {tab === 'photos' ? (
                    photos.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                <span className="text-2xl opacity-40">📷</span>
                            </div>
                            <p className="text-white/30 text-sm">No photos yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
                            {photos.map(p => (
                                <div
                                    key={p.id}
                                    className="aspect-square relative group cursor-pointer overflow-hidden"
                                    onClick={() => setSelectedPhoto(p)}
                                >
                                    <img src={p.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteItem(p); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80 bg-black/50 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-500/50"
                                        >×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    music.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                <span className="text-2xl opacity-40">🎵</span>
                            </div>
                            <p className="text-white/30 text-sm">No music yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {music.map(m => (
                                <div
                                    key={m.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${playing === m.id
                                            ? 'bg-white/[0.08] border-white/20 shadow-lg'
                                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <button
                                        onClick={() => playTrack(m)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${playing === m.id
                                                ? 'bg-white text-black'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        {playing === m.id ? '⏸' : '▶'}
                                    </button>
                                    <span className="flex-1 text-white/70 text-sm truncate">{m.name}</span>
                                    <button
                                        onClick={() => deleteItem(m)}
                                        className="text-white/30 hover:text-red-400 text-lg transition-colors"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
                        onClick={() => setSelectedPhoto(null)}
                    >×</button>
                    <img
                        src={selectedPhoto.url}
                        alt=""
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
}
