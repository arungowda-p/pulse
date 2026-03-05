/**
 * LaunchDarkly MVP — Feature Flag API
 * REST: flags CRUD + evaluation for SDK/client.
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const flags = new Map();

flags.set('new-checkout', {
  id: uuidv4(),
  key: 'new-checkout',
  name: 'New checkout flow',
  description: 'Enable the redesigned checkout experience',
  on: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

app.get('/api/flags', (req, res) => {
  const list = Array.from(flags.values()).sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || '')
  );
  res.json(list);
});

app.get('/api/flags/:key', (req, res) => {
  const flag = flags.get(req.params.key);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });
  res.json(flag);
});

app.post('/api/flags', (req, res) => {
  const { key, name, description } = req.body || {};
  const id = req.body?.id || uuidv4();
  const k = (key || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!k) return res.status(400).json({ error: 'Flag key is required' });
  if (flags.has(k)) return res.status(409).json({ error: 'Flag key already exists' });

  const now = new Date().toISOString();
  const flag = {
    id,
    key: k,
    name: name || k,
    description: description || '',
    on: false,
    createdAt: now,
    updatedAt: now,
  };
  flags.set(k, flag);
  res.status(201).json(flag);
});

app.patch('/api/flags/:key', (req, res) => {
  const flag = flags.get(req.params.key);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });

  const { name, description, on } = req.body || {};
  if (typeof name !== 'undefined') flag.name = name;
  if (typeof description !== 'undefined') flag.description = description;
  if (typeof on === 'boolean') flag.on = on;
  flag.updatedAt = new Date().toISOString();

  res.json(flag);
});

app.delete('/api/flags/:key', (req, res) => {
  if (!flags.has(req.params.key)) return res.status(404).json({ error: 'Flag not found' });
  flags.delete(req.params.key);
  res.status(204).send();
});

app.get('/api/eval/:flagKey', (req, res) => {
  const flag = flags.get(req.params.flagKey);
  if (!flag) {
    return res.status(404).json({ error: 'Flag not found', key: req.params.flagKey });
  }
  res.json({ key: flag.key, value: !!flag.on, on: !!flag.on });
});

app.post('/api/eval', (req, res) => {
  const { keys = [], context = {} } = req.body || {};
  const result = {};
  for (const key of keys) {
    const flag = flags.get(key);
    result[key] = flag ? !!flag.on : null;
  }
  res.json({ flags: result });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`  Flags: http://localhost:${PORT}/api/flags`);
  console.log(`  Eval:  http://localhost:${PORT}/api/eval/:flagKey`);
});
