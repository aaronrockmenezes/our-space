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
    const [activeTab, setActiveTab] = useState<'photos' | 'music'>('photos');
    const [selectedPhoto, setSelectedPhoto] = useState<MediaItem | null>(null);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadMedia();
    }, [user]);

    const loadMedia = async () => {
        try {
            const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
            const snapshot = await getDocs(mediaQuery);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
            setPhotos(items.filter(item => item.type === 'image'));
            setMusic(items.filter(item => item.type === 'audio'));
        } catch (error) {
            console.error('Error loading media:', error);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!user) return;
        setUploading(true);
        try {
            for (const file of acceptedFiles) {
                const isImage = file.type.startsWith('image/');
                const isAudio = file.type.startsWith('audio/');
                if (!isImage && !isAudio) continue;
                if (file.size > 1024 * 1024) {
                    alert(`"${file.name}" is too large. Max 1MB.`);
                    continue;
                }
                const base64Data = await fileToBase64(file);
                await addDoc(collection(db, 'media'), {
                    url: base64Data,
                    name: file.name,
                    type: isImage ? 'image' : 'audio',
                    uploadedAt: new Date(),
                    uploadedBy: user.uid,
                });
            }
            loadMedia();
        } catch (error) {
            console.error('Error uploading:', error);
        } finally {
            setUploading(false);
        }
    }, [user]);

    const deleteMedia = async (item: MediaItem) => {
        if (!confirm('Delete?')) return;
        await deleteDoc(doc(db, 'media', item.id));
        loadMedia();
    };

    const playMusic = (item: MediaItem) => {
        if (audio) audio.pause();
        if (currentlyPlaying === item.id) {
            setCurrentlyPlaying(null);
            return;
        }
        const newAudio = new Audio(item.url);
        newAudio.play();
        newAudio.onended = () => setCurrentlyPlaying(null);
        setAudio(newAudio);
        setCurrentlyPlaying(item.id);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [], 'audio/*': [] },
        maxSize: 1024 * 1024,
    });

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-white/40 text-sm">Loading...</div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-20 md:pb-8">
            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-xl font-light text-white mb-1">Gallery</h1>
                    <p className="text-white/30 text-xs">Our memories</p>
                </div>

                {/* Upload */}
                <div {...getRootProps()} className={`border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 mb-8 ${isDragActive ? 'border-white/30 bg-white/5' : 'border-white/10 hover:border-white/20'
                    }`}>
                    <input {...getInputProps()} />
                    {uploading ? (
                        <p className="text-white/40 text-sm">Uploading...</p>
                    ) : (
                        <>
                            <p className="text-white/50 text-sm mb-1">{isDragActive ? 'Drop here' : 'Drop files or tap to upload'}</p>
                            <p className="text-white/20 text-xs">Max 1MB</p>
                        </>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mb-6 border-b border-white/[0.06]">
                    {(['photos', 'music'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white border-b border-white' : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            {tab === 'photos' ? `📸 ${photos.length}` : `🎵 ${music.length}`}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'photos' ? (
                    photos.length === 0 ? (
                        <p className="text-center text-white/30 text-sm py-16">No photos yet</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-1">
                            {photos.map(photo => (
                                <div
                                    key={photo.id}
                                    className="aspect-square overflow-hidden cursor-pointer group relative"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteMedia(photo); }}
                                            className="text-white/80 text-xs"
                                        >Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    music.length === 0 ? (
                        <p className="text-center text-white/30 text-sm py-16">No music yet</p>
                    ) : (
                        <div className="space-y-2">
                            {music.map(track => (
                                <div
                                    key={track.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${currentlyPlaying === track.id ? 'bg-white/10' : 'bg-white/[0.02] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <button
                                        onClick={() => playMusic(track)}
                                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20"
                                    >
                                        {currentlyPlaying === track.id ? '⏸' : '▶'}
                                    </button>
                                    <span className="flex-1 text-white/70 text-sm truncate">{track.name}</span>
                                    <button onClick={() => deleteMedia(track)} className="text-white/30 hover:text-white/50 text-xs">✕</button>
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
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white" onClick={() => setSelectedPhoto(null)}>✕</button>
                </div>
            )}
        </div>
    );
}
