import { Router } from 'express';

export const health = Router();

health.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'polycast-backend',
    version: '1.0.0',
    now: new Date().toISOString()
  });
});
