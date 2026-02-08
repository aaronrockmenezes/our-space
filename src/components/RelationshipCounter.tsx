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
        <div className="glass-card-static p-8 md:p-10">
            <div className="text-center mb-8">
                <h3 className="text-xl text-[var(--text-muted)] uppercase tracking-widest text-sm mb-2">Together For</h3>
            </div>

            <div className="flex justify-center gap-6 md:gap-12 mb-8">
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

            <div className="ornament text-sm mb-6">
                <span>✦</span>
            </div>

            <p className="text-center text-[var(--text-secondary)] font-light">
                <span className="text-[var(--accent-gold)]">{duration.totalDays.toLocaleString()}</span> beautiful days together
            </p>
        </div>
    );
}
