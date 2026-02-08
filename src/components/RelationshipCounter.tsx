'use client';

import { useEffect, useState } from 'react';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

interface RelationshipCounterProps {
    startDate: Date;
}

export default function RelationshipCounter({ startDate }: RelationshipCounterProps) {
    const [duration, setDuration] = useState({
        years: 0,
        months: 0,
        days: 0,
        totalDays: 0,
    });

    useEffect(() => {
        const calculateDuration = () => {
            const now = new Date();
            const years = differenceInYears(now, startDate);
            const months = differenceInMonths(now, startDate) % 12;
            const totalDays = differenceInDays(now, startDate);

            const tempDate = new Date(startDate);
            tempDate.setFullYear(tempDate.getFullYear() + years);
            tempDate.setMonth(tempDate.getMonth() + months);
            const days = differenceInDays(now, tempDate);

            setDuration({ years, months, days, totalDays });
        };

        calculateDuration();
        const interval = setInterval(calculateDuration, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [startDate]);

    return (
        <div className="text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-6">Together for</p>

            <div className="flex justify-center items-baseline gap-8">
                {duration.years > 0 && (
                    <div>
                        <span className="text-4xl font-light text-white">{duration.years}</span>
                        <span className="text-white/30 text-xs ml-1">{duration.years === 1 ? 'year' : 'years'}</span>
                    </div>
                )}

                {(duration.years > 0 || duration.months > 0) && (
                    <div>
                        <span className="text-4xl font-light text-white">{duration.months}</span>
                        <span className="text-white/30 text-xs ml-1">{duration.months === 1 ? 'month' : 'months'}</span>
                    </div>
                )}

                <div>
                    <span className="text-4xl font-light text-white">{duration.days}</span>
                    <span className="text-white/30 text-xs ml-1">{duration.days === 1 ? 'day' : 'days'}</span>
                </div>
            </div>

            <p className="text-white/20 text-xs mt-6">
                {duration.totalDays.toLocaleString()} days ✨
            </p>
        </div>
    );
}
