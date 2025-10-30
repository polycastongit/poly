import dayjs from 'dayjs';
import { query } from '../db.js';
import { Odds } from '../types.js';

/**
 * Placeholder AI odds (ZKML nanti)
 * - Kombinasi seed dari waktu + marketId → deterministic-ish
 * - Logistic transform agar p in (0,1)
 */
export async function generateOdds(marketId: string): Promise<Odds> {
  const t = dayjs().unix();
  const seed = hashStr(`${marketId}:${t - (t % 600)}`); // ganti tiap 10 menit
  const raw = (Math.sin(seed) + 1) / 2; // 0..1
  const yes = clamp(0.05, 0.95, 0.35 + raw * 0.3); // 0.35..0.65, clamp 5%-95%
  const no = 1 - yes;

  const modelVersion = 'zkml-v0-mock';
  await query(
    `insert into odds_snapshots (market_id, yes_odds, no_odds, model_version) values ($1,$2,$3,$4)`,
    [marketId, yes, no, modelVersion]
  );

  return { yes, no, modelVersion };
}

export async function latestOdds(marketId: string): Promise<Odds | null> {
  const r = await query(
    `select yes_odds, no_odds, model_version from odds_snapshots
     where market_id=$1 order by created_at desc limit 1`,
    [marketId]
  );
  if (r.rowCount === 0) return null;
  const row = r.rows[0] as any;
  return { yes: Number(row.yes_odds), no: Number(row.no_odds), modelVersion: row.model_version };
}

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v));
}

function hashStr(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
