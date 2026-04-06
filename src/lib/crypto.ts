import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ACCOUNT_ENCRYPTION_KEY!; // 32바이트 hex (64자)
const IV_LENGTH = 16;

/**
 * 계좌번호 암호화 (AES-256-CBC)
 * @param text 평문 계좌번호
 * @returns 암호화된 문자열 (iv:encrypted 형식)
 */
export function encryptAccount(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ACCOUNT_ENCRYPTION_KEY environment variable is not set');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * 계좌번호 복호화 (AES-256-CBC)
 * @param encrypted 암호화된 문자열 (iv:encrypted 형식)
 * @returns 평문 계좌번호
 */
export function decryptAccount(encrypted: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ACCOUNT_ENCRYPTION_KEY environment variable is not set');
  }

  const [ivHex, encryptedHex] = encrypted.split(':');
  
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString();
}

/**
 * 계좌번호 마스킹 (화면 표시용)
 * @param accountNumber 계좌번호 (평문 또는 복호화된)
 * @returns 마스킹된 계좌번호 (앞3자리 + * + 뒤2자리)
 */
export function maskAccount(accountNumber: string): string {
  const cleaned = accountNumber.replace(/-/g, '');
  const len = cleaned.length;
  
  if (len <= 5) {
    return '*'.repeat(len);
  }
  
  return cleaned.slice(0, 3) + '*'.repeat(len - 5) + cleaned.slice(-2);
}
