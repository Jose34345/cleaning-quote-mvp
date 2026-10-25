import {describe,it,expect} from 'vitest';
import {createHmac} from 'node:crypto';
import {validLemonSignature} from '../src/lib/webhook';
describe('webhook signature',()=>{
 it('authenticates exact bytes',()=>{const payload='{"data":1}',secret='validsecret';const sig=createHmac('sha256',secret).update(payload).digest('hex');expect(validLemonSignature(payload,sig,secret)).toBe(true);expect(validLemonSignature(payload+' ',sig,secret)).toBe(false)});
 it('rejects malformed signature',()=>expect(validLemonSignature('hi','bogus','key')).toBe(false));
});
