'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RelationshipCounter from '@/components/RelationshipCounter';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RELATIONSHIP_START_DATE = new Date('2022-11-05');

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);

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
      const notesQuery = query(
        collection(db, 'loveNotes'),
        orderBy('createdAt', 'desc'),
        limit(2)
      );
      const notesSnap = await getDocs(notesQuery);
      setRecentNotes(notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Subtle ambient light */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20">
        {/* Welcome - Simple */}
        <div className="text-center mb-16">
          <p className="text-white/40 text-sm mb-2">Welcome back</p>
          <h1 className="text-2xl font-light text-white">
            {user.displayName?.split(' ')[0]} 💕
          </h1>
        </div>

        {/* Relationship Counter - Minimal */}
        <div className="mb-20">
          <RelationshipCounter startDate={RELATIONSHIP_START_DATE} />
        </div>

        {/* Navigation Grid - Pinterest style */}
        <div className="grid grid-cols-3 gap-4 mb-20">
          {[
            { href: '/gallery', icon: '📸', label: 'Gallery' },
            { href: '/calendar', icon: '📅', label: 'Calendar' },
            { href: '/notes', icon: '💌', label: 'Notes' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="aspect-square rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-white/50 text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent Photos - Instagram grid style */}
        {recentPhotos.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white/60 text-sm font-medium">Recent</h2>
              <Link href="/gallery" className="text-white/30 text-xs hover:text-white/50 transition-colors">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {recentPhotos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden rounded-sm">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Notes - Minimal */}
        {recentNotes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white/60 text-sm font-medium">Love Notes</h2>
              <Link href="/notes" className="text-white/30 text-xs hover:text-white/50 transition-colors">
                See all →
              </Link>
            </div>
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-white/60 text-sm leading-relaxed">{note.content}</p>
                  <p className="text-white/30 text-xs mt-2">— {note.senderName}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
