import { createBaileysConnection } from './connection.js';
  
export async function generatePairingCode(sessionId, phoneNumber) {
  const sock = await createBaileysConnection(sessionId, phoneNumber);
  
  // Request pairing code
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const code = await sock.requestPairingCode(cleanNumber);
  
  return code;
}