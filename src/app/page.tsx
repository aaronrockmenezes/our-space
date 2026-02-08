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
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-400 to-amber-300 opacity-60"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24 md:pb-12" style={{ paddingTop: '7rem' }}>
      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-900/20 via-rose-900/10 to-amber-900/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-xl mx-auto px-6">
        {/* Hero Counter Section */}
        <div className="text-center mb-12">
          <p className="text-white/40 text-xs font-medium uppercase tracking-[0.3em] mb-6">Together for</p>

          <div className="flex justify-center items-end gap-2 mb-4">
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-7xl font-extralight text-white tabular-nums">{years}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-widest mt-1">years</span>
            </div>
            <span className="text-white/20 text-4xl font-thin mb-4">·</span>
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-7xl font-extralight text-white tabular-nums">{months}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-widest mt-1">months</span>
            </div>
            <span className="text-white/20 text-4xl font-thin mb-4">·</span>
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-7xl font-extralight text-white tabular-nums">{days}</span>
              <span className="text-white/30 text-[10px] uppercase tracking-widest mt-1">days</span>
            </div>
          </div>

          <p className="text-white/25 text-sm">{totalDays.toLocaleString()} beautiful days ✨</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { href: '/gallery', icon: '📸', label: 'Gallery', desc: 'Our memories' },
            { href: '/calendar', icon: '📅', label: 'Calendar', desc: 'Special dates' },
            { href: '/notes', icon: '💌', label: 'Notes', desc: 'Love letters' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
              <div className="text-white/80 text-sm font-medium mb-0.5">{item.label}</div>
              <div className="text-white/30 text-[10px]">{item.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent Photos */}
        {recentPhotos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white/50 text-xs font-medium uppercase tracking-wider">Recent moments</h2>
              <Link href="/gallery" className="text-white/30 text-xs hover:text-white/50 transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
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

        {/* Empty state */}
        {recentPhotos.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <span className="text-2xl opacity-50">📷</span>
            </div>
            <p className="text-white/30 text-sm">No photos yet</p>
            <Link href="/gallery" className="text-white/50 text-xs hover:text-white/70 mt-2 inline-block">
              Add your first memory →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
