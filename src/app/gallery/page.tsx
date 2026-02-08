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
    uploadedAt: any;
    uploadedBy: string;
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
        if (user) {
            loadMedia();
        }
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
                    alert(`File "${file.name}" is too large. Max size is 1MB.`);
                    continue;
                }

                const base64Data = await fileToBase64(file);

                await addDoc(collection(db, 'media'), {
                    url: base64Data,
                    name: file.name,
                    type: isImage ? 'image' : 'audio',
                    uploadedAt: new Date(),
                    uploadedBy: user.uid,
                    uploaderName: user.displayName,
                });
            }

            loadMedia();
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error uploading file. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [user]);

    const deleteMedia = async (item: MediaItem) => {
        if (!confirm('Delete this item?')) return;

        try {
            await deleteDoc(doc(db, 'media', item.id));
            loadMedia();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const playMusic = (item: MediaItem) => {
        if (audio) {
            audio.pause();
        }

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
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
        },
        maxSize: 1024 * 1024,
    });

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white/60 text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
            {/* Background Orbs */}
            <div className="bg-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            {/* Header */}
            <div className="text-center mb-10 slide-up">
                <h1 className="text-4xl font-medium text-white glow-text mb-3">
                    Our Gallery
                </h1>
                <p className="text-[var(--text-muted)]">Memories we've shared together</p>
            </div>

            {/* Upload Area */}
            <div
                {...getRootProps()}
                className={`glass-card-static slide-up delay-100 mb-8 ${isDragActive ? 'upload-zone active' : 'upload-zone'
                    }`}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[var(--text-secondary)]">Uploading...</span>
                    </div>
                ) : (
                    <>
                        <div className="text-4xl mb-3">📁</div>
                        <p className="text-white font-medium mb-1">
                            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="text-[var(--text-muted)] text-sm">
                            or click to browse (max 1MB per file)
                        </p>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8 slide-up delay-200">
                <div className="tab-pills">
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`tab-pill ${activeTab === 'photos' ? 'active' : ''}`}
                    >
                        📸 Photos ({photos.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('music')}
                        className={`tab-pill ${activeTab === 'music' ? 'active' : ''}`}
                    >
                        🎵 Music ({music.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'photos' ? (
                <div className="slide-up delay-300">
                    {photos.length === 0 ? (
                        <div className="glass-card-static p-12 text-center">
                            <div className="text-5xl mb-4">📸</div>
                            <p className="text-[var(--text-secondary)]">No photos yet. Upload your first memory!</p>
                        </div>
                    ) : (
                        <div className="photo-grid">
                            {photos.map(photo => (
                                <div
                                    key={photo.id}
                                    className="photo-card group"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img src={photo.url} alt={photo.name} />
                                    <div className="overlay">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMedia(photo);
                                            }}
                                            className="bg-red-500/80 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3 slide-up delay-300">
                    {music.length === 0 ? (
                        <div className="glass-card-static p-12 text-center">
                            <div className="text-5xl mb-4">🎵</div>
                            <p className="text-[var(--text-secondary)]">No music yet. Upload our songs!</p>
                        </div>
                    ) : (
                        music.map(track => (
                            <div
                                key={track.id}
                                className={`music-track ${currentlyPlaying === track.id ? 'playing' : ''}`}
                            >
                                <button
                                    onClick={() => playMusic(track)}
                                    className={`play-button ${currentlyPlaying === track.id ? 'active' : ''}`}
                                >
                                    {currentlyPlaying === track.id ? '⏸' : '▶'}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{track.name}</p>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {currentlyPlaying === track.id ? '♪ Now playing' : 'Click to play'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => deleteMedia(track)}
                                    className="text-red-400 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Photo Lightbox */}
            {selectedPhoto && (
                <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
                    <div className="max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedPhoto.url}
                            alt={selectedPhoto.name}
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                        />
                        <div className="text-center mt-4">
                            <p className="text-white font-medium mb-3">{selectedPhoto.name}</p>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
