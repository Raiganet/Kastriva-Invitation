/** Types for the existing ESM implementation in env-tools.mjs. */
export type ProjectEnvironment = Record<string, string | undefined>;

export interface LoadProjectEnvOptions {
  root?: string;
  mode?: string;
  base?: ProjectEnvironment;
}

export interface EnvironmentValidationResult {
  errors: string[];
  config: {
    url: string;
    key: string;
  } | null;
}

export function loadProjectEnv(
  options?: LoadProjectEnvOptions,
): ProjectEnvironment;

export function validateEnvironment(
  env: ProjectEnvironment,
): EnvironmentValidationResult;
