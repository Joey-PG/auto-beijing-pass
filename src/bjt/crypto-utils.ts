import { constants, createHash, publicEncrypt } from 'node:crypto';

export function md5(value: string): string {
  return createHash('md5').update(value).digest('hex');
}

export function rsaEncrypt(data: Record<string, unknown>, publicKeyBase64: string): string {
  const pem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
  const bytes = Buffer.from(JSON.stringify(data), 'utf8');
  const chunks: Buffer[] = [];

  for (let index = 0; index < bytes.length; index += 214) {
    chunks.push(bytes.subarray(index, index + 214));
  }

  return chunks
    .map((chunk) =>
      publicEncrypt({ key: pem, padding: constants.RSA_PKCS1_PADDING }, chunk).toString('base64'),
    )
    .join(',');
}
