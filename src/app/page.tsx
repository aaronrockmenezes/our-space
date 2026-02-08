'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { motion } from 'framer-motion';
import { Camera, Calendar, Heart, ArrowRight } from 'lucide-react';

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
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadRecentContent();
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden" style={{ paddingTop: '5rem' }}>
      {/* Aurora Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-rose-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col items-center"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-rose-500/80 font-medium tracking-[0.2em] text-sm uppercase mb-4">Our Journey</h2>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Together
          </h1>

          <div className="inline-flex gap-8 md:gap-16 items-baseline justify-center">
            {[
              { value: years, label: 'Years' },
              { value: months, label: 'Months' },
              { value: days, label: 'Days' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center group cursor-default">
                <span className="text-4xl md:text-6xl font-light text-white tabular-nums group-hover:scale-110 transition-transform duration-300">
                  {item.value}
                </span>
                <span className="text-white/30 text-xs uppercase tracking-widest mt-2">{item.label}</span>
              </div>
            ))}
          </div>
          <motion.p
            variants={itemVariants}
            className="text-white/40 text-sm mt-8 font-light"
          >
            {totalDays.toLocaleString()} days of magic ✨
          </motion.p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-20"
        >
          {[
            {
              href: '/gallery',
              icon: Camera,
              label: 'Gallery',
              desc: 'Relive our memories',
              color: 'from-blue-500/20 to-cyan-500/20',
              border: 'group-hover:border-cyan-500/30'
            },
            {
              href: '/calendar',
              icon: Calendar,
              label: 'Calendar',
              desc: 'Upcoming dates',
              color: 'from-amber-500/20 to-orange-500/20',
              border: 'group-hover:border-orange-500/30'
            },
            {
              href: '/notes',
              icon: Heart,
              label: 'Love Notes',
              desc: 'Sweet messages',
              color: 'from-rose-500/20 to-pink-500/20',
              border: 'group-hover:border-rose-500/30'
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative h-full bg-white/[0.03] backdrop-blur-md border border-white/[0.08] ${item.border} rounded-3xl p-6 transition-colors duration-300 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                    <item.icon className="w-6 h-6 text-white/80" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">{item.label}</h3>
                  <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">{item.desc}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Recent Memories Section */}
        {recentPhotos.length > 0 && (
          <motion.div variants={itemVariants} className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-white/60 font-medium">Recent Moments</h3>
              <Link href="/gallery" className="text-rose-400 text-sm hover:text-rose-300 flex items-center gap-1 transition-colors group">
                View Gallery <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentPhotos.slice(0, 4).map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? -2 : 2 }}
                  className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06] group cursor-pointer shadow-lg hover:shadow-xl hover:shadow-black/40 hover:z-10 transition-all duration-300"
                >
                  <img
                    src={photo.url}
                    alt="Memory"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
