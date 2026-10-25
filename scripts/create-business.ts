import {client,arg,configFile} from './_common';
async function main(){
 const slug=arg('slug'),name=arg('name'),email=arg('email'),config=configFile(arg('pricing'));
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Bad slug or email');
 const {data,error}=await client().from('businesses').insert({slug,display_name:name,owner_email:email,notification_email:email,status:'demo',pricing_config:config}).select('id,slug,status').single();
 if(error)throw Error(error.message);console.log('Created DEMO-only business:',data);
}
main().catch(e=>{console.error(e.message);process.exit(1)});
