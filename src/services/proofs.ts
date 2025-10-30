import { config } from '../config.js';

export async function verifyProof(proof: unknown): Promise<{ verified: boolean; verifier: string }> {
  if (config.proofMode === 'mock') {
    // selalu true (dev)
    return { verified: true, verifier: 'zkml-mock' };
  }
  // TODO: Integrasi snarkjs/halo2/zkml verifier sesuai stack kamu
  // throw new Error('strict verifier not implemented');
  return { verified: false, verifier: 'zkml-strict' };
}
