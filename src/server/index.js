import 'dotenv/config';
import express from 'express'
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  fetchSpotifyTrack,
  upsertTrack,
  searchSpotifyTracks,
  searchAlbums,
  fetchAlbumTracks,
} from './services/trackService.js';

import { recomputeStatsForCycle } from './services/statsService.js';

import {
  computeArtistsWithMostTrackOfCycle,
  computeArtistsWithMostArtistOfCycle,
  computeArtistsWithMostNominations,
  computeArtistsWithMostSongsInCycle,
  computeLongestSongsAcrossAllCycles,
  computeAlbumsWithMostSongsNominated,
  computeArtistsWithMostCycleAppearances,
  computeArtistsWithLongestCycleStreak,
  computeAlbumsWithMostTrackOfCycle
} from './services/leaderboardService.js';

const app = express();
app.use(express.json());

// 1) CYCLES
// a) Get all cycles
app.get('/api/cycles', async (req, res, next) => {
  try {
    const cycles = await db.cycle.findMany();
    res.json(cycles);
  } catch (err) {
    next(err);
  }
});

// b) Create a new cycle
app.post('/api/cycles', async (req, res, next) => {
  try {
    const { name = '', isActive = false } = req.body;

    // Flip off any other active cycle
    if (isActive) {
      await db.cycle.updateMany({
        where: {},
        data: { isActive: false },
      });
    }

    const cycle = await db.cycle.create({
      data: { name, isActive }
    });

    res.status(201).json(cycle);
  } catch (err) {
    next(err);
  }
});

// c) Update a cycle
app.put('/api/cycles/:id', async (req, res, next) => {
  try {
    const cycleId = parseInt(req.params.id, 10);
    const { name, isActive } = req.body;

    // If setting this cycle to active, deactivate all others first
    if (isActive) {
      await db.cycle.updateMany({
        where: { NOT: { id: cycleId } },
        data: { isActive: false },
      });
    }

    const cycle = await db.cycle.update({
      where: { id: cycleId },
      data: { name, isActive },
    });
    
    res.json(cycle);
  } catch (err) {
    next(err);
  }
});

// d) Delete a cycle
app.delete('/api/cycles/:id', async (req, res, next) => {
  try {
    const cycleId = parseInt(req.params.id, 10);
    await db.cycle.delete({ where: { id: cycleId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// 2) NOMINATIONS
// a) Get all nominations
app.get('/api/cycles/:id/nominations', async (req, res, next) => {
  try {
    const cycleId = parseInt(req.params.id, 10);
    const nominations = await db.nomination.findMany({
      where: { cycleId },
      orderBy: { rank: 'asc' },
      include: {
        track: {
          include: {
            artistLinks: { include: { artist: true } },
            album: true
          }
        }
      }
    });
    res.json(nominations);
  } catch (err) {
    next(err);
  }
});

// b) Create a new nomination
app.post('/api/nominations', async (req, res, next) => {
  try {
    const { cycleId, spotifyTrackId, youtubeVideoId, rank = null } = req.body;

    // Fetch metadata
    const fetched = spotifyTrackId
      ? await fetchSpotifyTrack(spotifyTrackId)
      : await fetchYouTubeVideo(youtubeVideoId);

    // Upsert into DB
    const track = await upsertTrack({
      spotifyId: spotifyTrackId,
      youtubeId: youtubeVideoId,
      fetched
    });

    // Create nomination
    const nomination = await db.nomination.create({
      data: { cycleId, trackId: track.id, rank }
    });

    res.status(201).json(nomination);
  } catch (err) {
    next(err);
  }
});

// c) Update a nomination
app.put('/api/nominations/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rank } = req.body;
    const nomination = await db.nomination.update({
      where: { id },
      data: { rank },
    });
    res.json(nomination);
  } catch (err) {
    next(err);
  }
});

// d) Delete a nomination
app.delete('/api/nominations/:id', async (req, res, next) => {
  try {
    const nominationId = parseInt(req.params.id, 10);
    
    // Get the nomination first to find the associated track
    const nomination = await db.nomination.findUnique({
      where: { id: nominationId }
    });
    
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }
    
    // Delete the nomination
    await db.nomination.delete({ where: { id: nominationId } });
    
    // Check if this track has any other nominations
    const otherNominations = await db.nomination.findMany({
      where: { trackId: nomination.trackId }
    });
    
    // Only delete the track and its artist links if no other nominations reference it
    if (otherNominations.length === 0) {
      // First delete all TrackToArtist relationships for this track
      await db.trackToArtist.deleteMany({
        where: { trackId: nomination.trackId }
      });
      
      // Then delete the track itself
      await db.track.delete({ where: { id: nomination.trackId } });
    }
    
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});


// 3) SEARCH
// a) Get track search results
app.get('/api/search', async (req, res, next) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required.' });
  try {
    const results = await searchSpotifyTracks(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// b) Get album search results
app.get('/api/search/album', async (req, res, next) => {
  try {
    const { q } = req.query;
    const results = await searchAlbums(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// c) Get tracks from an album search result
app.get('/api/search/album/:spotifyAlbumId', async (req, res, next) => {
  try {
    const albumData = await fetchAlbumTracks(req.params.spotifyAlbumId);
    res.json(albumData);
  } catch (err) {
    next(err);
  }
});


// 4) STATS

// a) Recomputes all stats for this cycle and upserts them.
// Body: { bestNewArtistId: <artistId | null> }
app.post('/api/cycles/:id/stats', async (req, res, next) => {
  try {
    const cycleId = Number(req.params.id);
    const { bestNewArtistId = null } = req.body;

    // Ensure cycle exists
    const cycle = await db.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found.' });
    }

    // Recompute & upsert
    const stats = await recomputeStatsForCycle(cycleId, bestNewArtistId);
    res.json({ message: 'Stats updated.', stats });
  } catch (err) {
    next(err);
  }
});

// b) Get stats for a cycle
app.get('/api/cycles/:id/stats', async (req, res, next) => {
  const cycleId = Number(req.params.id);
  try {
    const snapshot = await db.statsSnapshot.findUnique({
      where: { cycleId },
      include: {
        trackOfCycle: {
          include: {
            // include cover art and all linked artists
            album:       true,
            artistLinks:  { include: { artist: true } }
          }
        },
        artistOfCycle: { select: { id: true, name: true, imageUrl: true } },
        bestNewArtist: { select: { id: true, name: true, imageUrl: true } },
      }
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'Stats not found. Have you computed them yet?' });
    }

    // Shape the response:
    res.json({
      cycleId:          snapshot.cycleId,
      trackOfCycle: snapshot.trackOfCycle
        ? {
            id:         snapshot.trackOfCycle.id,
            title:      snapshot.trackOfCycle.title,
            artists:    snapshot.trackOfCycle.artistLinks.map(l => l.artist.name).join(', '),
            album: {
              title:    snapshot.trackOfCycle.album?.title ?? null,
              imageUrl: snapshot.trackOfCycle.album?.imageUrl ?? null
            }
          }
        : null,

      artistOfCycle: snapshot.artistOfCycle
        ? { id: snapshot.artistOfCycle.id, name: snapshot.artistOfCycle.name, imageUrl: snapshot.artistOfCycle.imageUrl }
        : null,

      bestNewArtist: snapshot.bestNewArtist
        ? { id: snapshot.bestNewArtist.id, name: snapshot.bestNewArtist.name, imageUrl: snapshot.bestNewArtist.imageUrl }
        : null,

      computedAt:    snapshot.computedAt
    });
  } catch (err) {
    next(err);
  }
});

// c) Get stats for all cycles
app.get('/api/stats', async (req, res, next) => {
  try {
    const snapshots = await db.statsSnapshot.findMany({
      include: {
        cycle: { select: { id: true, name: true } },
        trackOfCycle: {
          include: {
            album: true,
            artistLinks: { include: { artist: true } }
          }
        },
        artistOfCycle: { select: { id: true, name: true, imageUrl: true } },
        bestNewArtist: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { cycleId: 'desc' }
    });

    res.json(snapshots);
  } catch (err) {
    next(err);
  }
});

// 5) LEADERBOARD

app.get('/api/leaderboards/track-of-cycle', async (req, res, next) => {
  try {
    const data = await computeArtistsWithMostTrackOfCycle(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/artist-of-cycle', async (req, res, next) => {
  try {
    const data = await computeArtistsWithMostArtistOfCycle(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/most-nominations', async (req, res, next) => {
  try {
    const data = await computeArtistsWithMostNominations(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/most-songs-in-cycle', async (req, res, next) => {
  try {
    const data = await computeArtistsWithMostSongsInCycle(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/longest-songs', async (req, res, next) => {
  try {
    const data = await computeLongestSongsAcrossAllCycles(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/most-songs-nominated-album', async (req, res, next) => {
  try {
    const data = await computeAlbumsWithMostSongsNominated(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/artist-cycle-counts', async (req, res, next) => {
  try {
    const data = await computeArtistsWithMostCycleAppearances(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/artist-cycle-streaks', async (req, res, next) => {
  try {
    const data = await computeArtistsWithLongestCycleStreak(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboards/album-track-of-cycle', async (req, res, next) => {
  try {
    const data = await computeAlbumsWithMostTrackOfCycle(10);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Serve static files from the React app (production)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => { 
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Start server (only in non-Vercel environments)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;