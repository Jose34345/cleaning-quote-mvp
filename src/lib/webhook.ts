import { createHmac, timingSafeEqual } from 'node:crypto';
export function validLemonSignature(raw:string,signature:string,secret:string) {
  if(!/^[a-f0-9]{64}$/i.test(signature)||!secret) return false;
  const expected=Buffer.from(createHmac('sha256',secret).update(raw).digest('hex'),'utf8');
  const actual=Buffer.from(signature,'utf8');
  return expected.length===actual.length && timingSafeEqual(expected,actual);
}
