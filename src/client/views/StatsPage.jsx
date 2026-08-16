import { useState } from 'react';
import BigThreeSweep from '../components/BigThreeSweep.jsx';
import LeaderboardPreview from '../components/LeaderboardPreview.jsx';
import '../styles/StatsPage.css';

const leaderboardConfigs = [
    {
        id: 'track-of-cycle',
        title: 'Most Track of the Cycle',
        unit: 'Times'
    },
    {
        id: 'artist-of-cycle',
        title: 'Most Artist of the Cycle',
        unit: 'Times'
    },
    {
        id: 'most-nominations',
        title: 'Most Total Nominations',
        unit: 'Nominations'
    },
    {
        id: 'most-songs-in-cycle',
        title: 'Most Nominations in a Cycle',
        unit: 'Nominations'
    },
    {
        id: 'longest-songs',
        title: 'Longest Songs Ever Nominated',
        unit: 'Time',
        // Values come back as milliseconds — never show them raw
        format: 'duration'
    },
    {
        id: 'most-songs-nominated-album',
        title: 'Most Album Nominations',
        unit: 'Nominations'
    },
    {
        id: 'artist-cycle-counts',
        title: 'Most Cycle Appearances',
        unit: 'Cycles'
    },
    {
        id: 'artist-cycle-streaks',
        title: 'Longest Artist Cycle Appearances Streak',
        unit: 'Cycles'
    },
    {
        id: 'album-track-of-cycle',
        title: 'Albums with Most Track of the Cycle Wins',
        unit: 'Tracks'
    },
];

export default function StatsPage() {
    // True accordion — opening one closes the others
    const [openBoard, setOpenBoard] = useState(null);

    return (
        <section className="stats-page">
            <h1 className="page-title">Records</h1>
            <p className="page-sub stats-sub">
                All-time leaderboards, for the all-time greats.
            </p>

            <BigThreeSweep />

            <div className="stats-list">
                {leaderboardConfigs.map((config, index) => (
                    <LeaderboardPreview
                        key={config.id}
                        index={index + 1}
                        metric={config.id}
                        title={config.title}
                        unit={config.unit}
                        format={config.format}
                        isExpanded={openBoard === config.id}
                        onToggle={() => setOpenBoard(openBoard === config.id ? null : config.id)}
                    />
                ))}
            </div>
        </section>
    );
}
