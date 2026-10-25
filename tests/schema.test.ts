import {describe,it,expect} from 'vitest';
import {quoteSchema,leadRequest,setupSchema} from '../src/lib/schema';
const q={zip:'78701',service:'standard',bedrooms:2,bathrooms:1,frequency:'once',extras:[]};
describe('validation',()=>{
 it('valid quote',()=>expect(quoteSchema.safeParse(q).success).toBe(true));
 it('invalid zip',()=>expect(quoteSchema.safeParse({...q,zip:'1234'}).success).toBe(false));
 it('invalid service',()=>expect(quoteSchema.safeParse({...q,service:'custom'}).success).toBe(false));
 it('requires explicit lead consent',()=>expect(leadRequest.safeParse({...q,slug:'owner',submissionId:crypto.randomUUID(),name:'John Smith',email:'john@example.com',consent:false}).success).toBe(false));
 it('valid setup form',()=>expect(setupSchema.safeParse({submissionId:crypto.randomUUID(),owner:'Sam Smith',email:'s@example.com',business:'Example Cleaning',website:'',message:''}).success).toBe(true));
});
