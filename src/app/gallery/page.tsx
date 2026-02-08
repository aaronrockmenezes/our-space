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
        if (!confirm('Delete?')) return;
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

    if (loading || !user) return <div className="min-h-screen bg-[#0a0a0f]" />;

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-24 md:pb-12" style={{ paddingTop: '7rem' }}>
            <div className="max-w-lg mx-auto px-6">
                {/* Header */}
                <h1 className="text-xl font-light text-white text-center mb-8">Gallery</h1>

                {/* Upload */}
                <div {...getRootProps()} className={`border border-dashed border-white/10 rounded-xl p-6 text-center mb-8 cursor-pointer transition-colors ${isDragActive ? 'border-white/30 bg-white/5' : 'hover:border-white/20'}`}>
                    <input {...getInputProps()} />
                    <p className="text-white/40 text-sm">{uploading ? 'Uploading...' : 'Drop files or tap'}</p>
                    <p className="text-white/20 text-xs mt-1">Max 1MB</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 mb-6">
                    <button onClick={() => setTab('photos')} className={`text-sm pb-2 border-b-2 transition-colors ${tab === 'photos' ? 'text-white border-white' : 'text-white/40 border-transparent'}`}>
                        Photos · {photos.length}
                    </button>
                    <button onClick={() => setTab('music')} className={`text-sm pb-2 border-b-2 transition-colors ${tab === 'music' ? 'text-white border-white' : 'text-white/40 border-transparent'}`}>
                        Music · {music.length}
                    </button>
                </div>

                {/* Content */}
                {tab === 'photos' ? (
                    photos.length === 0 ? (
                        <p className="text-white/30 text-sm text-center py-12">No photos</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-0.5">
                            {photos.map(p => (
                                <div key={p.id} className="aspect-square relative group cursor-pointer" onClick={() => setSelectedPhoto(p)}>
                                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteItem(p); }}
                                        className="absolute bottom-2 right-2 text-white/60 bg-black/50 rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    music.length === 0 ? (
                        <p className="text-white/30 text-sm text-center py-12">No music</p>
                    ) : (
                        <div className="space-y-2">
                            {music.map(m => (
                                <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${playing === m.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                    <button onClick={() => playTrack(m)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                                        {playing === m.id ? '⏸' : '▶'}
                                    </button>
                                    <span className="flex-1 text-white/60 text-sm truncate">{m.name}</span>
                                    <button onClick={() => deleteItem(m)} className="text-white/30 text-xs">×</button>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                    <img src={selectedPhoto.url} alt="" className="max-w-full max-h-[85vh] object-contain" />
                </div>
            )}
        </div>
    );
}
