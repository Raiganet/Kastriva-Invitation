export type Check = {name:string;requested:string;state:string;code:string;advice?:string};
export function classifyFailure(value:unknown):{code:string;advice:string};
export function redactLog(value:unknown):string;
export function supportsNode(version:string):boolean;
export function matchesVersion(actual:string,requested:string):boolean;
export function packageRequirements(pkg:{dependencies?:Record<string,string>;devDependencies?:Record<string,string>}):{name:string;requested:string;exact:boolean}[];
export function probePackage(value:{name:string;requested:string},fetcher?:typeof fetch,timeoutMs?:number):Promise<Check>;
