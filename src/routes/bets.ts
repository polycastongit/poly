import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { buildBetTransaction } from '../solana.js';

export const bets = Router();

const Prepare = z.object({
  wallet: z.string().min(32),
  side: z.enum(['YES', 'NO']),
  amountLamports: z.string().regex(/^\d+$/)
});

/**
 * Step 1: siapkan transaksi (base64) → client sign + send
 */
bets.post('/markets/:slug/bets/prepare', async (req, res) => {
  const parsed = Prepare.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const m = await query(`select id, close_time from markets where slug=$1 limit 1`, [req.params.slug]);
  if (m.rowCount === 0) return res.status(404).json({ error: 'market_not_found' });

  const market = m.rows[0];
  if (new Date(market.close_time).getTime() <= Date.now())
    return res.status(400).json({ error: 'market_closed' });

  const { wallet, side } = parsed.data;
  const amount = BigInt(parsed.data.amountLamports);

  const tx = await buildBetTransaction(wallet, market.id, side, amount);

  const inserted = await query(
    `insert into bets (market_id, wallet, side, amount_lamports, client_tx, status)
     values ($1,$2,$3,$4,$5,'prepared') returning id`,
    [market.id, wallet, side, amount.toString(), tx.base64Tx]
  );

  res.json({
    betId: inserted.rows[0].id,
    txBase64: tx.base64Tx,
    lastValidBlockHeight: tx.lastValidBlockHeight
  });
});

const Submit = z.object({
  signature: z.string().min(64)
});

/**
 * Step 2: client submit signature setelah broadcast
 */
bets.post('/bets/:id/submit', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'bad_id' });
  const body = Submit.safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);

  const r = await query(`update bets set signature=$1, status='submitted', updated_at=now() where id=$2 returning *`, [body.data.signature, id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true, bet: r.rows[0] });
});
