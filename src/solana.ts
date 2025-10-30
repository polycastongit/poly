import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { config } from './config.js';

/**
 * Stub tx builder:
 * - Menggunakan Memo Program untuk menulis pesan {marketId, side, amount}
 * - Client akan sign & broadcast sendiri (non-custodial)
 */
export async function buildBetTransaction(
  payerPubkey: string,
  marketId: string,
  side: 'YES' | 'NO',
  amountLamports: bigint
) {
  const connection = new Connection(config.solanaRpc, 'confirmed');
  const payer = new PublicKey(payerPubkey);

  // Memo payload
  const memoPayload = JSON.stringify({
    t: 'polycast-bet',
    marketId,
    side,
    amount: amountLamports.toString()
  });

  const memoIx = new TransactionInstruction({
    keys: [],
    programId: new PublicKey(config.programId), // Memo Program as stub
    data: Buffer.from(memoPayload, 'utf8')
  });

  // (Optional) attach a 0-lamport transfer to ensure recentBlockhash usage
  const noopTransfer = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: payer,
    lamports: 0
  });

  const blockhash = await connection.getLatestBlockhash('finalized');

  const tx = new Transaction({
    recentBlockhash: blockhash.blockhash,
    feePayer: payer
  }).add(noopTransfer, memoIx);

  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  const base64Tx = serialized.toString('base64');

  return { base64Tx, lastValidBlockHeight: blockhash.lastValidBlockHeight };
}
