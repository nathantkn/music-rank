import express from 'express'
import db from './db.js'
import {
  fetchSpotifyTrack,
  fetchYouTubeVideo,
  upsertTrack,
  searchSpotifyTracks
} from './services/trackService.js';

const app = express();
app.use(express.json());

// 1) List all cycles
app.get('/api/cycles', async (req, res, next) => {
  try {
    const cycles = await db.cycle.findMany();
    res.json(cycles);
  } catch (err) {
    next(err);
  }
});

// 2) Create a new cycle
app.post('/api/cycles', async (req, res, next) => {
  try {
    const { name, isActive = false } = req.body;

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

// 3) Update a cycle
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

// 4) Delete a cycle
app.delete('/api/cycles/:id', async (req, res, next) => {
  try {
    const cycleId = parseInt(req.params.id, 10);
    await db.cycle.delete({ where: { id: cycleId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// 5) Get nominations for a single cycle
app.get('/api/cycles/:id/nominations', async (req, res, next) => {
  try {
    const cycleId = parseInt(req.params.id, 10);
    const nominations = await db.nomination.findMany({
      where: { cycleId },
      orderBy: { rank: 'asc' },
      include: { track: true },
    });
    res.json(nominations);
  } catch (err) {
    next(err);
  }
});

// 6) Create a new nomination
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

// 7) Update a nomination
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

// 8) Delete a nomination
app.delete('/api/nominations/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.nomination.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// 9) Get current cycle pick of Best New Artist
app.get('/api/cycles/:id/best-new-artist', async (req, res) => {
  const cycleId = parseInt(req.params.id, 10);
  try {
    const pick = await db.bestNewArtist.findOne({
      where: { cycleId },
    });

    if (pick.length === 0) {
      return res.status(404).json({ error: 'No artist chosen for this cycle yet.' });
    }

    res.status(201).json(pick);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// 10) Create new Best New Artist pick
app.post('/api/cycles/:id/best-new-artist', async (req, res, next) => {
  try {
    const { artistId } = req.body;
    if (!artistId) {
      return res.status(400).json({ error: 'Artist ID is required.' });
    }

    const cycleId = parseInt(req.params.id, 10);
    const cycle = await db.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found.' });
    }

    const bestNewArtist = await db.bestNewArtist.create({
      data: { cycleId, artistId }
    });

    res.status(201).json(bestNewArtist);
  } catch (err) {
    next(err);
  }
});

// 11) Delete Best New Artist pick
app.delete('/api/cycles/:id/best-new-artist', async (req, res, next) => {
  try {
    const cycleId = parseInt(req.params.id, 10);
    await db.bestNewArtist.delete({ where: { cycleId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// 12) Get search results
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

// 12) Get stored stats
// 13) Update stored stats

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});