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
        <div className="animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-400 to-amber-300 opacity-60"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-32 md:pb-16" style={{ paddingTop: '8rem' }}>
      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-900/15 via-rose-900/10 to-amber-900/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md mx-auto px-8">
        {/* Hero Counter Section - Generous spacing */}
        <div className="text-center mb-16">
          <p className="text-white/40 text-xs font-medium uppercase tracking-[0.35em] mb-10">Together for</p>

          <div className="flex justify-center items-end gap-6 mb-6">
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-8xl font-extralight text-white tabular-nums leading-none">{years}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-3">years</span>
            </div>
            <span className="text-white/15 text-3xl font-thin mb-8">·</span>
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-8xl font-extralight text-white tabular-nums leading-none">{months}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-3">months</span>
            </div>
            <span className="text-white/15 text-3xl font-thin mb-8">·</span>
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-8xl font-extralight text-white tabular-nums leading-none">{days}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-3">days</span>
            </div>
          </div>

          <p className="text-white/20 text-sm mt-8">{totalDays.toLocaleString()} beautiful days ✨</p>
        </div>

        {/* Navigation Cards - More spacing and rounder corners */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {[
            { href: '/gallery', icon: '📸', label: 'Gallery', desc: 'Our memories' },
            { href: '/calendar', icon: '📅', label: 'Calendar', desc: 'Special dates' },
            { href: '/notes', icon: '💌', label: 'Notes', desc: 'Love letters' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.15] rounded-3xl p-6 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
              <div className="text-white/80 text-sm font-medium mb-1">{item.label}</div>
              <div className="text-white/30 text-[10px] leading-relaxed">{item.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent Photos - Only show if there are photos */}
        {recentPhotos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white/40 text-xs font-medium uppercase tracking-[0.15em]">Recent moments</h2>
              <Link href="/gallery" className="text-white/25 text-xs hover:text-white/50 transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-3xl overflow-hidden">
              {recentPhotos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden group cursor-pointer">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
