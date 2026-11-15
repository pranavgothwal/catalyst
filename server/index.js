import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory persistent state holder for production container / cloud run instance
let careCircleState = {
  circleId: 'circle-sheela-main',
  name: "Sheela's Circle of Care",
  activeLoops: [],
  doseCheckIns: [],
  timeline: [],
};

// Health Check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'AlwaysWithYOU', timestamp: new Date().toISOString() });
});

// Care Loop API endpoints
app.get('/api/loops', (req, res) => {
  res.json({ success: true, loops: careCircleState.activeLoops });
});

app.post('/api/loops/claim', (req, res) => {
  const { loopId, actorId, actorName, notes } = req.body;
  if (!loopId || !actorId) {
    return res.status(400).json({ success: false, error: 'loopId and actorId are required' });
  }
  res.json({ success: true, message: 'Loop claim recorded' });
});

// Serve frontend static build
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AlwaysWithYOU server listening on port ${PORT}`);
});
