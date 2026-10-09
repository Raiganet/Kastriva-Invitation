import type {ReactNode} from 'react';

/** Decorative device chrome; its screen remains usable with pointer or keyboard. */
export default function PhoneFrame({children,className=''}:{children:ReactNode;className?:string}){
 return <div className={`phone-frame ${className}`}>
  <span className="phone-side-key phone-silent" aria-hidden="true"/>
  <span className="phone-side-key phone-volume" aria-hidden="true"/>
  <span className="phone-side-key phone-power" aria-hidden="true"/>
  <div className="phone-screen">
   {children}
   <div className="phone-status" aria-hidden="true"><span>9:41</span><span className="phone-island"/><svg viewBox="0 0 52 14" fill="none"><path d="M2 11V9m4 2V7m4 4V5m4 6V3" stroke="currentColor" strokeWidth="2"/><path d="M20 5q5-5 10 0m-8 3q3-3 6 0m-4 3h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><rect x="35" y="3" width="13" height="8" rx="2" stroke="currentColor"/><path d="M49 5v4" stroke="currentColor"/><rect x="37" y="5" width="9" height="4" rx=".6" fill="currentColor"/></svg></div>
   <span className="phone-home-indicator" aria-hidden="true"/>
  </div>
 </div>;
}
