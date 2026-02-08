'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RelationshipCounter from '@/components/RelationshipCounter';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Your relationship start date 💕
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
        limit(4)
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
        <div className="text-white/60 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const features = [
    {
      href: '/gallery',
      icon: '📸',
      title: 'Gallery',
      description: 'Our photos & music',
    },
    {
      href: '/calendar',
      icon: '📅',
      title: 'Calendar',
      description: 'Special dates',
    },
    {
      href: '/notes',
      icon: '💌',
      title: 'Love Notes',
      description: 'Sweet messages',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
      {/* Animated Background Orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Welcome Section */}
      <div className="text-center mb-12 slide-up">
        <h1 className="text-4xl md:text-5xl font-medium text-white glow-text mb-4">
          Welcome back, {user.displayName?.split(' ')[0]} 💕
        </h1>
        <p className="text-[var(--text-muted)] text-lg italic font-light">
          "In all the world, there is no heart for me like yours"
        </p>
      </div>

      {/* Relationship Counter */}
      <div className="mb-12 slide-up delay-100">
        <RelationshipCounter startDate={RELATIONSHIP_START_DATE} />
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {features.map((feature, index) => (
          <Link
            key={feature.href}
            href={feature.href}
            className={`glass-card feature-card slide-up delay-${(index + 2) * 100}`}
          >
            <div className="feature-icon">
              {feature.icon}
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-desc">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Notes */}
        <div className="glass-card-static p-6 slide-up delay-400">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-medium text-white">
              💌 Recent Notes
            </h3>
            <Link href="/notes" className="text-[var(--accent-gold)] text-sm font-medium hover:underline">
              View all →
            </Link>
          </div>
          {recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.map(note => (
                <div key={note.id} className="note-card !p-4">
                  <p className="text-[var(--text-secondary)] line-clamp-2 relative z-10">{note.content}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    — {note.senderName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-center py-8">
              No notes yet. Send the first one! 💕
            </p>
          )}
        </div>

        {/* Recent Photos */}
        <div className="glass-card-static p-6 slide-up delay-400">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-medium text-white">
              📸 Recent Photos
            </h3>
            <Link href="/gallery" className="text-[var(--accent-gold)] text-sm font-medium hover:underline">
              View all →
            </Link>
          </div>
          {recentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {recentPhotos.map(photo => (
                <div key={photo.id} className="photo-card aspect-square">
                  <img src={photo.url} alt="" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-center py-8">
              No photos yet. Upload a memory! 📸
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
