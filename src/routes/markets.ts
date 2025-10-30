import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { generateOdds, latestOdds } from '../services/odds.js';
import { config } from '../config.js';

export const markets = Router();

const adminGuard = (req: any, res: any, next: any) => {
  const key = req.header('x-admin-key');
  if (key !== config.adminKey) return res.status(401).json({ error: 'unauthorized' });
  next();
};

markets.get('/markets', async (req, res) => {
  const status = (req.query.status as string) ?? 'active';
  const r = await query(
    `select * from markets where status=$1 and close_time > now()
     order by close_time asc limit 100`, [status]
  );
  res.json(r.rows);
});

markets.get('/markets/:slug', async (req, res) => {
  const r = await query(`select * from markets where slug=$1 limit 1`, [req.params.slug]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
  const m = r.rows[0];
  const odds = await latestOdds(m.id);
  res.json({ ...m, odds });
});

const CreateMarket = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().optional(),
  closeTime: z.string(), // ISO
  baseToken: z.string().default('USDC')
});

markets.post('/markets', adminGuard, async (req, res) => {
  const body = CreateMarket.safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);

  const { slug, title, description, category, closeTime, baseToken } = body.data;
  const r = await query(
    `insert into markets (slug,title,description,category,close_time,base_token)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [slug, title, description ?? null, category ?? null, closeTime, baseToken]
  );

  // generate initial odds
  const odds = await generateOdds(r.rows[0].id);
  res.status(201).json({ ...r.rows[0], odds });
});

markets.post('/markets/:slug/odds/refresh', adminGuard, async (req, res) => {
  const m = await query(`select * from markets where slug=$1 limit 1`, [req.params.slug]);
  if (m.rowCount === 0) return res.status(404).json({ error: 'not_found' });
  const odds = await generateOdds(m.rows[0].id);
  res.json({ ok: true, odds });
});
