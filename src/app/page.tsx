'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

const RELATIONSHIP_START_DATE = new Date('2022-11-05');

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);

  // Calculate duration
  const now = new Date();
  const years = differenceInYears(now, RELATIONSHIP_START_DATE);
  const months = differenceInMonths(now, RELATIONSHIP_START_DATE) % 12;
  const tempDate = new Date(RELATIONSHIP_START_DATE);
  tempDate.setFullYear(tempDate.getFullYear() + years);
  tempDate.setMonth(tempDate.getMonth() + months);
  const days = differenceInDays(now, tempDate);
  const totalDays = differenceInDays(now, RELATIONSHIP_START_DATE);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadRecentContent();
    }
  }, [user]);

  const loadRecentContent = async () => {
    try {
      const photosQuery = query(
        collection(db, 'media'),
        where('type', '==', 'image'),
        orderBy('uploadedAt', 'desc'),
        limit(6)
      );
      const photosSnap = await getDocs(photosQuery);
      setRecentPhotos(photosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24 md:pb-12" style={{ paddingTop: '7rem' }}>
      <div className="max-w-lg mx-auto px-6">

        {/* Counter - Hero style */}
        <div className="text-center py-8">
          <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-8">Together</p>
          <div className="flex justify-center items-baseline gap-1 text-white">
            <span className="text-6xl font-extralight">{years}</span>
            <span className="text-white/30 text-sm mr-4">y</span>
            <span className="text-6xl font-extralight">{months}</span>
            <span className="text-white/30 text-sm mr-4">m</span>
            <span className="text-6xl font-extralight">{days}</span>
            <span className="text-white/30 text-sm">d</span>
          </div>
          <p className="text-white/20 text-xs mt-6">{totalDays.toLocaleString()} days</p>
        </div>

        {/* Simple nav links */}
        <div className="flex justify-center gap-8 py-8 border-t border-b border-white/5">
          <Link href="/gallery" className="text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📸</div>
            <div className="text-white/40 text-xs">Gallery</div>
          </Link>
          <Link href="/calendar" className="text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📅</div>
            <div className="text-white/40 text-xs">Calendar</div>
          </Link>
          <Link href="/notes" className="text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💌</div>
            <div className="text-white/40 text-xs">Notes</div>
          </Link>
        </div>

        {/* Recent Photos */}
        {recentPhotos.length > 0 && (
          <div className="pt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/30 text-xs uppercase tracking-wider">Recent</span>
              <Link href="/gallery" className="text-white/20 text-xs hover:text-white/40">View all</Link>
            </div>
            <div className="grid grid-cols-3 gap-0.5">
              {recentPhotos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
