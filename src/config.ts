import 'dotenv/config';

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};

export const config = {
  port: parseInt(process.env.PORT ?? '8080', 10),
  env: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean),
  dbUrl: required('DATABASE_URL'),
  solanaRpc: required('SOLANA_RPC'),
  programId: required('PROGRAM_ID'),
  adminKey: required('ADMIN_API_KEY'),
  proofMode: (process.env.PROOF_MODE ?? 'mock') as 'mock' | 'strict'
};
