export const RELEASE_STEPS:string[];
export function demoEnvironment(base?:Record<string,string|undefined>):Record<string,string|undefined>;
export function executeRelease(run:(id:string)=>Promise<{status:number|null;timedOut?:boolean}>):Promise<{version:string;profile:string;passed:boolean;steps:{id:string;exitCode:number;timedOut:boolean;passed:boolean}[];liveSupabaseVerified:boolean;productionApproved:boolean}>;
