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
        <div className="glass-card-static p-8">
            <div className="text-center mb-6">
                <h3 className="text-xl text-[var(--text-secondary)] mb-1">Together For</h3>
            </div>

            <div className="flex justify-center gap-6 md:gap-10 mb-6">
                {duration.years > 0 && (
                    <div className="stat-card">
                        <div className="stat-number">{duration.years}</div>
                        <div className="stat-label">{duration.years === 1 ? 'Year' : 'Years'}</div>
                    </div>
                )}

                {(duration.years > 0 || duration.months > 0) && (
                    <div className="stat-card">
                        <div className="stat-number">{duration.months}</div>
                        <div className="stat-label">{duration.months === 1 ? 'Month' : 'Months'}</div>
                    </div>
                )}

                <div className="stat-card">
                    <div className="stat-number">{duration.days}</div>
                    <div className="stat-label">{duration.days === 1 ? 'Day' : 'Days'}</div>
                </div>
            </div>

            <div className="ornament text-sm">
                <span>✦</span>
            </div>

            <p className="text-center mt-4 text-[var(--accent)] font-medium">
                {duration.totalDays.toLocaleString()} beautiful days together ✨
            </p>
        </div>
    );
}
