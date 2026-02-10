'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Trash2, Maximize2, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface MediaItem {
    id: string;
    url: string;
    name: string;
    type: 'image' | 'audio';
    uploadedAt: any; // Firestore Timestamp
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
    const [selectedPhoto, setSelectedPhoto] = useState<MediaItem | null>(null);
    const [showUpload, setShowUpload] = useState(false);

    // Date Filtering State (YYYY-MM)
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) loadMedia();
    }, [user]);

    const loadMedia = async () => {
        const snapshot = await getDocs(query(collection(db, 'media'), orderBy('uploadedAt', 'desc')));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
        // Filter out music if any existed previously, strict photo only
        setPhotos(items.filter(i => i.type === 'image'));
    };

    const onDrop = useCallback(async (files: File[]) => {
        if (!user) return;
        setUploading(true);
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) continue; // 5MB limit
            const base64 = await fileToBase64(file);
            await addDoc(collection(db, 'media'), {
                url: base64,
                name: file.name,
                type: 'image',
                uploadedAt: new Date(),
                uploadedBy: user.uid,
            });
        }
        await loadMedia();
        setUploading(false);
        setShowUpload(false);
    }, [user]);

    const deleteItem = async (item: MediaItem) => {
        if (!confirm('Delete this memory?')) return;
        await deleteDoc(doc(db, 'media', item.id));
        if (selectedPhoto?.id === item.id) setSelectedPhoto(null);
        loadMedia();
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxSize: 5 * 1024 * 1024,
    });

    // Grouping Logic
    const groupedPhotos = useMemo(() => {
        let filtered = photos;

        if (dateRange.start && dateRange.end) {
            const start = startOfMonth(parseISO(dateRange.start));
            const end = endOfMonth(parseISO(dateRange.end));
            filtered = photos.filter(p => {
                const date = p.uploadedAt?.toDate ? p.uploadedAt.toDate() : new Date(p.uploadedAt);
                return isWithinInterval(date, { start, end });
            });
        }

        // Group by Year -> Month
        const groups: Record<string, MediaItem[]> = {}; // Key: "YYYY-MM"

        filtered.forEach(photo => {
            const date = photo.uploadedAt?.toDate ? photo.uploadedAt.toDate() : new Date(photo.uploadedAt);
            const key = format(date, 'yyyy-MM');
            if (!groups[key]) groups[key] = [];
            groups[key].push(photo);
        });

        // Sort keys descending
        const sortedKeys = Object.keys(groups).sort().reverse();

        // Organize into Year sections
        const years: Record<string, { month: string, photos: MediaItem[] }[]> = {};

        sortedKeys.forEach(key => {
            const [year, month] = key.split('-');
            if (!years[year]) years[year] = [];
            years[year].push({
                month: format(parseISO(key), 'MMMM'), // e.g. "January"
                photos: groups[key]
            });
        });

        return Object.entries(years).sort((a, b) => Number(b[0]) - Number(a[0])); // [year, months[]]
    }, [photos, dateRange]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pt-48 pb-32 relative">
            {/* Aurora Background Effect */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-rose-900/10 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <div className="max-w-5xl mx-auto px-8 md:px-16 relative z-10">

                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div>
                        <h1 className="text-5xl font-bold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Gallery</h1>
                        <p className="text-white/40 text-sm tracking-wide uppercase">Curated Timeline</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] p-2 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 px-4 py-2">
                            <CalendarIcon className="w-4 h-4 text-white/40" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">From</span>
                                <input
                                    type="month"
                                    className="bg-transparent border-none text-xs text-white/80 focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert-[0.5] cursor-pointer p-0"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </div>
                            <span className="text-white/20">|</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">To</span>
                                <input
                                    type="month"
                                    className="bg-transparent border-none text-xs text-white/80 focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert-[0.5] cursor-pointer p-0"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Action Button for Upload */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUpload(!showUpload)}
                    className="fixed bottom-24 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-white shadow-2xl shadow-rose-500/30 flex items-center justify-center border border-white/20 backdrop-blur-md"
                >
                    {showUpload ? <X className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                </motion.button>


                {/* Upload Zone (Collapsible) */}
                <AnimatePresence>
                    {showUpload && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 48 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div
                                {...getRootProps()}
                                className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragActive
                                    ? 'border-rose-500/50 bg-rose-500/10'
                                    : 'border-white/[0.1] hover:border-white/20 bg-white/[0.02]'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="w-16 h-16 mb-4 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-lg shadow-white/5">
                                    {uploading ? (
                                        <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">
                                    {uploading ? 'Adding to collection...' : 'Add your pictures here!'}
                                </h3>
                                <p className="text-white/40 text-xs">Supports IMG, PNG, JPG • Max 5MB</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Timeline Grid */}
                {groupedPhotos.length === 0 ? (
                    <div className="text-center py-32 border border-dashed border-white/10 rounded-3xl">
                        <div className="opacity-30 mb-4"><Camera className="w-12 h-12 mx-auto" /></div>
                        <p className="text-white/40">No memories found for this period.</p>
                    </div>
                ) : (
                    <div className="space-y-24">
                        {groupedPhotos.map(([year, months]) => (
                            <div key={year} className="relative">
                                {/* Year Breaker */}
                                <div className="sticky top-24 z-20 mb-8 inline-block">
                                    <div className="relative pl-2">
                                        <span className="text-xl font-medium text-rose-500 tracking-wider border-l-2 border-rose-500 pl-4">
                                            {year}
                                        </span>
                                    </div>
                                </div>

                                {/* Month Groups inside Grid */}
                                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                    {months.map(({ month, photos: monthPhotos }) => (
                                        <>
                                            {/* Month Breaker Card */}
                                            <div key={`${year}-${month}-header`} className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] p-8 flex flex-col justify-end min-h-[180px]">
                                                <h3 className="text-3xl font-light text-white/90">{month}</h3>
                                                <p className="text-white/30 text-xs mt-2 uppercase tracking-widest">{monthPhotos.length} Memories</p>
                                                <div className="absolute top-0 right-0 p-32 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />
                                            </div>

                                            {/* Photos */}
                                            {monthPhotos.map((p) => (
                                                <motion.div
                                                    key={p.id}
                                                    layoutId={`photo-${p.id}`}
                                                    className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors"
                                                    onClick={() => setSelectedPhoto(p)}
                                                >
                                                    <img src={p.url} alt={p.name} className="w-full h-auto object-cover" loading="lazy" />

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteItem(p); }}
                                                            className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500/40 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-8"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.button
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all z-50"
                            onClick={() => setSelectedPhoto(null)}
                            whileHover={{ rotate: 90 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.button>

                        <motion.img
                            layoutId={`photo-${selectedPhoto.id}`}
                            src={selectedPhoto.url}
                            alt={selectedPhoto.name}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
