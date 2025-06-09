import { useState } from 'react';
import LeaderboardPreview from '../components/LeaderboardPreview.jsx';
import '../styles/StatsPage.css';

const leaderboardConfigs = [
    {
        id: 'track-of-cycle',
        title: 'Most Track of the Cycle',
        value: 'Times'
    },
    {
        id: 'artist-of-cycle',
        title: 'Most Artist of the Cycle',
        value: 'Times'
    },
    {
        id: 'most-nominations',
        title: 'Most Total Nominations',
        value: 'Nominations'
    },
    {
        id: 'most-songs-in-cycle',
        title: 'Most Nominations in a Cycle',
        value: 'Nominations'
    },
    {
        id: 'longest-songs',
        title: 'Longest Songs Ever Nominated',
        value: 'Time'
    },
    {
        id: 'most-songs-nominated-album',
        title: 'Most Album Nominations',
        value: 'Nominations'
    }
];

export default function StatsPage() {
    const [expandedLeaderboard, setExpandedLeaderboard] = useState(null);

    const handleToggle = (leaderboardId) => {
        setExpandedLeaderboard(
            expandedLeaderboard === leaderboardId ? null : leaderboardId
        );
    };

    return (
        <div className="stats-page">
            <div className="stats-container">
                <div className="stats-header">
                    <h1 className="stats-title">Leaderboards & Records</h1>
                    <p className="stats-subtitle">

                    </p>
                </div>

                <div className="leaderboard-previews">
                    {leaderboardConfigs.map((config) => (
                        <LeaderboardPreview
                            key={config.id}
                            metric={config.id}
                            title={config.title}
                            isExpanded={expandedLeaderboard === config.id}
                            onToggle={() => handleToggle(config.id)}
                            value={config.value}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}