/** These links are a display hint, NEVER an authorisation decision. */
export type AccountNavState='unknown'|'guest'|'signed-in';
export function accountNavigation(state:AccountNavState){return state==='signed-in'?{href:'/dashboard',label:'Dashboard'}:state==='guest'?{href:'/login',label:'Masuk'}:{href:'/dashboard',label:'Akun'};}
