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
        <div className="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-28 md:pb-12 flex flex-col items-center" style={{ paddingTop: '6rem' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-900/20 via-purple-900/15 to-pink-900/20 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Hero Counter - Centered */}
        <div className="text-center mb-14">
          <p className="text-white/40 text-xs font-medium uppercase tracking-[0.3em] mb-8">Together for</p>

          <div className="flex justify-center items-end gap-8 mb-5">
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-7xl font-light text-white tabular-nums">{years}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-2">years</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-7xl font-light text-white tabular-nums">{months}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-2">months</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-7xl font-light text-white tabular-nums">{days}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-2">days</span>
            </div>
          </div>

          <p className="text-white/25 text-sm">{totalDays.toLocaleString()} beautiful days ✨</p>
        </div>

        {/* Navigation Cards - Centered grid */}
        <div className="grid grid-cols-3 gap-3 mb-14">
          {[
            { href: '/gallery', icon: '📸', label: 'Gallery', desc: 'Our memories' },
            { href: '/calendar', icon: '📅', label: 'Calendar', desc: 'Special dates' },
            { href: '/notes', icon: '💌', label: 'Notes', desc: 'Love letters' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 text-center transition-all duration-200"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="text-white/80 text-sm font-medium mb-0.5">{item.label}</div>
              <div className="text-white/30 text-[10px]">{item.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent Photos */}
        {recentPhotos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white/40 text-xs font-medium uppercase tracking-[0.15em]">Recent moments</h2>
              <Link href="/gallery" className="text-white/30 text-xs hover:text-white/50 transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
              {recentPhotos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
