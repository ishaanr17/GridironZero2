import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { analyzePlays } from './analyzer';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/v1/players', (_req, res) => {
  try {
    const file = path.join(__dirname, '..', 'data', 'players.json');
    const raw = fs.readFileSync(file, 'utf8');
    const players = JSON.parse(raw);
    return res.json({ players });
  } catch (err: any) {
    console.error('failed to read players.json', err?.message || err);
    return res.status(500).json({ error: 'failed to read players' });
  }
});

// Plays listing
app.get('/api/v1/plays', (_req, res) => {
  try {
    const file = path.join(__dirname, '..', 'data', 'plays.json');
    if (!fs.existsSync(file)) return res.json({ plays: [] });
    const raw = fs.readFileSync(file, 'utf8');
    const plays = JSON.parse(raw || '[]');
    return res.json({ plays });
  } catch (err: any) {
    console.error('failed to read plays.json', err?.message || err);
    return res.status(500).json({ error: 'failed to read plays' });
  }
});

// Import / create plays (append)
app.post('/api/v1/plays', (req, res) => {
  try {
    const play = req.body;
    const file = path.join(__dirname, '..', 'data', 'plays.json');
    const plays = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8') || '[]') : [];
    // assign id if missing
    if (!play.id) play.id = `play_${Date.now()}`;
    plays.push(play);
    fs.writeFileSync(file, JSON.stringify(plays, null, 2), 'utf8');
    return res.json({ ok: true, play });
  } catch (err: any) {
    console.error('failed to save play', err?.message || err);
    return res.status(500).json({ error: 'failed to save play' });
  }
});

// Import multiple players (append); body: { players: [{ id?, name, position, traits? }] }
app.post('/api/v1/players/import', (req, res) => {
  try {
    const { players: incoming } = req.body;
    if (!incoming || !Array.isArray(incoming)) {
      return res.status(400).json({ error: 'players array required' });
    }
    const file = path.join(__dirname, '..', 'data', 'players.json');
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8') || '[]') : [];
    const seen = new Set((existing as any[]).map((p: any) => p.id));
    for (const p of incoming) {
      if (!p.id || seen.has(p.id)) p.id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      seen.add(p.id);
      existing.push({
        id: p.id,
        name: p.name || 'Unknown',
        position: p.position || 'WR',
        traits: p.traits || {}
      });
    }
    fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf8');
    return res.json({ ok: true, count: incoming.length, total: existing.length });
  } catch (err: any) {
    console.error('players import error', err?.message || err);
    return res.status(500).json({ error: 'failed to import players' });
  }
});

// Import multiple plays (append); body: { plays: [ { id?, name, ... } ] }
app.post('/api/v1/plays/import', (req, res) => {
  try {
    const { plays: incoming } = req.body;
    if (!incoming || !Array.isArray(incoming)) {
      return res.status(400).json({ error: 'plays array required' });
    }
    const file = path.join(__dirname, '..', 'data', 'plays.json');
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8') || '[]') : [];
    for (const play of incoming) {
      if (!play.id) play.id = `play_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      existing.push(play);
    }
    fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf8');
    return res.json({ ok: true, count: incoming.length, total: existing.length });
  } catch (err: any) {
    console.error('plays import error', err?.message || err);
    return res.status(500).json({ error: 'failed to import plays' });
  }
});

// Workspace (cloud): get/set current field state and lineup for persistence
const workspaceFile = path.join(__dirname, '..', 'data', 'workspace.json');
app.get('/api/v1/workspace', (_req, res) => {
  try {
    if (!fs.existsSync(workspaceFile)) return res.json({ workspace: null });
    const raw = fs.readFileSync(workspaceFile, 'utf8');
    return res.json({ workspace: JSON.parse(raw) });
  } catch (err: any) {
    return res.json({ workspace: null });
  }
});
app.post('/api/v1/workspace', (req, res) => {
  try {
    const workspace = req.body;
    fs.writeFileSync(workspaceFile, JSON.stringify(workspace, null, 2), 'utf8');
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('workspace save error', err?.message || err);
    return res.status(500).json({ error: 'failed to save workspace' });
  }
});

// Export single play
app.get('/api/v1/play/:id', (req, res) => {
  try {
    const file = path.join(__dirname, '..', 'data', 'plays.json');
    const plays = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8') || '[]') : [];
    const p = plays.find((x: any) => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'not found' });
    return res.json({ play: p });
  } catch (err: any) {
    console.error('failed to read play', err?.message || err);
    return res.status(500).json({ error: 'failed to read play' });
  }
});

// Concepts identify/create
app.post('/api/v1/concepts/identify', (req, res) => {
  try {
    const playInstance = req.body.play_instance;
    if (!playInstance) return res.status(400).json({ error: 'play_instance required' });

    const conceptsFile = path.join(__dirname, '..', 'data', 'concepts.json');
    const concepts = fs.existsSync(conceptsFile) ? JSON.parse(fs.readFileSync(conceptsFile, 'utf8') || '[]') : [];

    // simple signature: per-action route length sums
    const signature = (playInstance.actions || []).map((a: any) => {
      const pts = a.route || [];
      let len = 0;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        len += Math.sqrt(dx * dx + dy * dy);
      }
      return Math.round(len);
    });

    // find nearest concept by Euclidean distance on signature (pad with zeros)
    function dist(a: number[], b: number[]) {
      const n = Math.max(a.length, b.length);
      let s = 0;
      for (let i = 0; i < n; i++) {
        const ai = a[i] || 0;
        const bi = b[i] || 0;
        s += (ai - bi) * (ai - bi);
      }
      return Math.sqrt(s);
    }

    let best: any = null;
    let bestD = Infinity;
    for (const c of concepts) {
      const d = dist(signature, c.signature || []);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }

    const THRESH = 80; // heuristic threshold
    if (best && bestD <= THRESH) {
      // return matching concept
      return res.json({ match: true, concept: best, distance: bestD });
    }

    // create new concept
    const newConcept = {
      id: `concept_${Date.now()}`,
      name: req.body.name || `Concept ${new Date().toISOString()}`,
      signature,
      examples: [playInstance.id || null],
      created_at: new Date().toISOString()
    };
    concepts.push(newConcept);
    fs.writeFileSync(conceptsFile, JSON.stringify(concepts, null, 2), 'utf8');
    return res.json({ match: false, concept: newConcept });
  } catch (err: any) {
    console.error('concept identify error', err?.message || err);
    return res.status(500).json({ error: 'concept identify failed' });
  }
});

app.post('/api/v1/analyze', (req, res) => {
  try {
    const { field_state, roster_id, play_instances } = req.body;
    if (!play_instances || !Array.isArray(play_instances)) {
      return res.status(400).json({ error: 'play_instances array required' });
    }
    const results = analyzePlays({ field_state, roster_id, play_instances });
    return res.json({ results });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'internal' });
  }
});

// Production: serve frontend static files and SPA fallback (single deployment)
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`GridironZero listening on ${port}`));
