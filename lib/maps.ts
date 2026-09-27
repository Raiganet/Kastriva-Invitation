import {safeMapHref} from './domain.ts';

/** Search is an editor aid only; it never replaces the customer's chosen pin. */
export function googleMapsSearch(venue:string,address:string):string {
 const query=Array.from([venue.trim(),address.trim()].filter(Boolean).join(', ')).slice(0,150).join('');
 const url=new URL('https://www.google.com/maps/search/');
 url.searchParams.set('api','1');
 if(query)url.searchParams.set('query',query);
 return query?url.toString():'https://www.google.com/maps';
}

export function mapLink(value:string):{href:string;label:string} {
 const href=safeMapHref(value.trim());
 if(!href)return {href:'',label:'Buka peta'};
 const url=new URL(href),host=url.hostname;
 const google=host==='maps.app.goo.gl'||host==='maps.google.com'||host==='maps.google.co.id'
  ||(['www.google.com','google.com','www.google.co.id','google.co.id'].includes(host)&&/^\/maps(?:\/|$)/.test(url.pathname))
  ||(host==='goo.gl'&&url.pathname.startsWith('/maps/'));
 return {href,label:google?'Buka Google Maps':'Buka peta'};
}
