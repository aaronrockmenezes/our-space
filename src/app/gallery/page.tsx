'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Music, Upload, X, Play, Pause, Trash2, Maximize2 } from 'lucide-react';

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
        if (!confirm('Delete this memory?')) return;
        await deleteDoc(doc(db, 'media', item.id));
        if (selectedPhoto?.id === item.id) setSelectedPhoto(null);
        loadMedia();
    };

    const playTrack = (item: MediaItem) => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        if (playing === item.id) {
            setPlaying(null);
            return;
        }

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
                <div className="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f]" style={{ paddingTop: '6rem' }}>
            <div className="w-full max-w-7xl mx-auto px-6 pb-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Gallery</h1>
                        <p className="text-white/40 text-sm">Curated collection of our best moments</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                        {[
                            { id: 'photos', label: 'Photos', icon: Camera },
                            { id: 'music', label: 'Music', icon: Music },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${tab === t.id
                                        ? 'bg-white/[0.1] text-white shadow-lg'
                                        : 'text-white/40 hover:text-white/70'
                                    }`}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upload Zone */}
                <motion.div
                    {...getRootProps()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative overflow-hidden group border-2 border-dashed rounded-3xl p-8 mb-16 text-center cursor-pointer transition-all duration-300 ${isDragActive
                        ? 'border-rose-500/50 bg-rose-500/10'
                        : 'border-white/[0.08] hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.02]'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.05] flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            {uploading ? (
                                <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
                            ) : (
                                <Upload className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
                            )}
                        </div>
                        <p className="text-white/60 font-medium mb-1">
                            {uploading ? 'Uploading your memories...' : 'Add to the collection'}
                        </p>
                        <p className="text-white/30 text-xs">Drag & drop photos or music</p>
                    </div>
                </motion.div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {tab === 'photos' ? (
                        <motion.div
                            key="photos"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {photos.length === 0 ? (
                                <div className="text-center py-20 text-white/30">No photos yet. Upload the first one!</div>
                            ) : (
                                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                                    {photos.map((p) => (
                                        <motion.div
                                            key={p.id}
                                            layoutId={`photo-${p.id}`}
                                            className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in bg-white/[0.02] border border-white/[0.05]"
                                            onClick={() => setSelectedPhoto(p)}
                                            whileHover={{ y: -5 }}
                                        >
                                            <img src={p.url} alt={p.name} className="w-full h-auto object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedPhoto(p); }}
                                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteItem(p); }}
                                                    className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500/40 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="music"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-3xl mx-auto space-y-3"
                        >
                            {music.length === 0 ? (
                                <div className="text-center py-20 text-white/30">No music yet. Add a soundtrack!</div>
                            ) : (
                                music.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${playing === m.id
                                                ? 'bg-rose-500/10 border-rose-500/30'
                                                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
                                            }`}
                                    >
                                        <button
                                            onClick={() => playTrack(m)}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${playing === m.id
                                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {playing === m.id ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-1" fill="currentColor" />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-medium truncate transition-colors ${playing === m.id ? 'text-rose-400' : 'text-white/90 group-hover:text-white'}`}>
                                                {m.name.split('.')[0]}
                                            </h3>
                                            <p className="text-xs text-white/30 truncate">Audio Track</p>
                                        </div>

                                        <button
                                            onClick={() => deleteItem(m)}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fullscreen Lightbox */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.button
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all z-50"
                            onClick={() => setSelectedPhoto(null)}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.button>

                        <motion.img
                            layoutId={`photo-${selectedPhoto.id}`}
                            src={selectedPhoto.url}
                            alt={selectedPhoto.name}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
