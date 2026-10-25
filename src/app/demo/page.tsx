import {EventPing} from '@/components/event-ping';
import type {Metadata} from 'next';
import {QuoteForm} from '@/components/quote-form';
export const metadata:Metadata={title:'Interactive Demo',robots:{index:false,follow:false}};
export default function Demo(){return <main className="page-background"><div className="container"><EventPing event="demo_opened" demo/><QuoteForm businessName="Your Cleaning Company" demo/></div></main>}
