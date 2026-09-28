// The application version has one source: package.json. No credentials are imported here.
import manifest from '../package.json' with { type: 'json' };
export const APP_VERSION: string = manifest.version;
