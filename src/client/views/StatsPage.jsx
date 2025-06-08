// src/pages/StatsPage.jsx
import React, { useState } from 'react';
import Leaderboard from '../components/Leaderboard.jsx';
import LeaderboardPreview from '../components/LeaderboardPreview.jsx';
import '../styles/StatsPage.css';

const leaderboardConfigs = [
  {
    id: 'track-of-cycle',
    metric: 'track-of-cycle',
    title: 'Track of the Cycle Champions',
    description: 'Artists who have won the most Track of the Cycle awards'
  },
  {
    id: 'artist-of-cycle',
    metric: 'artist-of-cycle',
    title: 'Artist of the Cycle Champions',
    description: 'Artists who have won the most Artist of the Cycle awards'
  },
  {
    id: 'most-nominations',
    metric: 'most-nominations',
    title: 'Most Nominated Artists',
    description: 'Artists with the highest number of nominations across all cycles'
  },
  {
    id: 'most-songs-in-cycle',
    metric: 'most-songs-in-cycle',
    title: 'Single Cycle Dominance',
    description: 'Artists with the most songs nominated in a single cycle'
  },
  {
    id: 'longest-songs',
    metric: 'longest-songs',
    title: 'Epic Length Champions',
    description: 'The longest songs ever nominated across all cycles'
  },
  {
    id: 'most-songs-nominated-album',
    metric: 'most-songs-nominated-album',
    title: 'Album Nomination Leaders',
    description: 'Albums with the most different songs nominated'
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
          <h1 className="stats-title">Music Leaderboards</h1>
          <p className="stats-subtitle">
            Discover the champions across all categories - click any card to explore the full leaderboard
          </p>
        </div>

        <div className="leaderboard-previews">
          {leaderboardConfigs.map((config) => (
            <LeaderboardPreview
              key={config.id}
              metric={config.metric}
              title={config.title}
              description={config.description}
              isExpanded={expandedLeaderboard === config.id}
              onToggle={() => handleToggle(config.id)}
              LeaderboardComponent={Leaderboard}
            />
          ))}
        </div>
      </div>
    </div>
  );
}