import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { verifyProof } from '../services/proofs.js';

export const proofs = Router();

const SubmitProof = z.object({
  marketSlug: z.string(),
  betId: z.number().int().positive(),
  proof: z.any()
});

/**
 * Terima ZK proof (ZKML) → verifikasi (mock/strict) → catat hasil
 */
proofs.post('/proofs/verify', async (req, res) => {
  const parsed = SubmitProof.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const m = await query(`select id from markets where slug=$1 limit 1`, [parsed.data.marketSlug]);
  if (m.rowCount === 0) return res.status(404).json({ error: 'market_not_found' });

  const { verified, verifier } = await verifyProof(parsed.data.proof);

  const r = await query(
    `insert into proofs (market_id, bet_id, proof_json, verified, verifier)
     values ($1,$2,$3,$4,$5) returning *`,
    [m.rows[0].id, parsed.data.betId, parsed.data.proof, verified, verifier]
  );

  res.json({ ok: true, verified, record: r.rows[0] });
});
