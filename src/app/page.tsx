'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { motion } from 'framer-motion';
import { Camera, Calendar, Heart, ArrowRight } from 'lucide-react';

const IST_TIMEZONE = 'Asia/Kolkata';
const START_DATE_ISO = '2022-11-05T00:00:00+05:30'; // Explicit IST Offset

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);

  // Calculate duration in IST
  const now = new Date();
  const nowIST = toZonedTime(now, IST_TIMEZONE);
  const startIST = toZonedTime(START_DATE_ISO, IST_TIMEZONE);

  const years = differenceInYears(nowIST, startIST);
  const months = differenceInMonths(nowIST, startIST) % 12;

  const tempDate = new Date(startIST);
  tempDate.setFullYear(tempDate.getFullYear() + years);
  tempDate.setMonth(tempDate.getMonth() + months);

  const days = differenceInDays(nowIST, tempDate);
  const totalDays = differenceInDays(nowIST, startIST);

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex flex-col justify-center items-center pt-40 pb-24 md:pt-48 md:pb-32 px-8 md:px-16">
      {/* Aurora Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-rose-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
        {/* Grain overlay for texture */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-32 relative">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="text-white/60 text-xs font-medium tracking-[0.2em] uppercase">Together since November 5, 2022</span>
          </div>

          <h1 className="text-7xl md:text-9xl font-medium text-white mb-8 tracking-tighter leading-none font-serif">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">Love of my Life</span>
            <span className="text-rose-500/80 text-6xl md:text-8xl align-top ml-2">.</span>
          </h1>

          <div className="flex flex-wrap gap-12 md:gap-24 justify-center items-baseline mt-16">
            {[
              { value: years, label: 'Years' },
              { value: months, label: 'Months' },
              { value: days, label: 'Days' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center group cursor-default">
                <span className="text-6xl md:text-8xl font-light text-white tabular-nums tracking-tight group-hover:scale-110 transition-transform duration-500 ease-out font-serif">
                  {item.value}
                </span>
                <span className="text-white/30 text-xs font-medium uppercase tracking-[0.2em] mt-4 border-t border-white/10 pt-4 w-full text-center">{item.label}</span>
              </div>
            ))}
          </div>

          <motion.p
            variants={itemVariants}
            className="text-white/40 text-sm mt-12 font-medium tracking-wide uppercase"
          >
            {totalDays.toLocaleString()} days of creating memories together
          </motion.p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-32 px-4"
        >
          {[
            {
              href: '/gallery',
              icon: Camera,
              label: 'Gallery',
              desc: 'Our Timeline',
              gradient: 'from-blue-400/50 to-cyan-400/50'
            },
            {
              href: '/calendar',
              icon: Calendar,
              label: 'Calendar',
              desc: 'Our Plans',
              gradient: 'from-amber-400/50 to-orange-400/50'
            },
            {
              href: '/notes',
              icon: Heart,
              label: 'Love Notes',
              desc: 'Our Letters',
              gradient: 'from-rose-400/50 to-pink-400/50'
            },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} className="block group">
              <motion.div
                whileHover={{ y: -5 }}
                className="relative h-[260px] bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-all duration-500 hover:bg-white/[0.04] hover:border-white/[0.1] hover:shadow-2xl hover:shadow-black/20"
              >
                {/* Centered Icon with Gradient Ring */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${item.gradient} p-[1px] mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-white/90" strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="text-3xl font-serif text-white mb-2 tracking-wide">{item.label}</h3>
                <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">{item.desc}</p>

                {/* Subtle Hover Indicator */}
                <div className="mt-6 text-white/10 group-hover:text-white/30 transition-colors duration-500">
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500" />
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Recent Memories Section */}
        {recentPhotos.length > 0 && (
          <motion.div variants={itemVariants} className="w-full max-w-6xl border-t border-white/5 pt-24">
            <div className="flex items-end justify-between mb-12 px-2">
              <div>
                <h3 className="text-3xl font-serif text-white mb-2">Recent Moments</h3>
                <p className="text-white/40">Lately in our life</p>
              </div>
              <Link href="/gallery" className="px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 text-sm text-white hover:text-rose-300 transition-all flex items-center gap-2 group">
                View All Memories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recentPhotos.slice(0, 4).map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ y: -5 }}
                  className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06] group cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/50 transition-all duration-500"
                >
                  <img
                    src={photo.url}
                    alt="Memory"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <p className="text-white text-sm font-medium truncate">{photo.name}</p>
                  </div>
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
          animation: blob 10s infinite alternate;
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
