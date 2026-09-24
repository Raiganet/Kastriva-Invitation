/** Shared error type; no framework dependency or non-erasable TypeScript syntax. */
export class HttpError extends Error {
  status:number; retryAfter?:number;
  constructor(status:number,message:string,retryAfter?:number){super(message);this.name='HttpError';this.status=status;this.retryAfter=retryAfter;}
}
