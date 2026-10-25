'use client';
import {useEffect} from 'react';
export function EventPing({event,slug,demo=false}:{event:'landing_view'|'demo_opened'|'quote_started',slug?:string,demo?:boolean}){
 useEffect(()=>{const body=JSON.stringify({event,slug,demo});fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});},[event,slug,demo]);
 return null;
}
