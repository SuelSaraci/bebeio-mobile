/** Dev logging — visible in Metro / Expo debugger console. */
const prefix = (scope: string) => `[Bebio/${scope}]`;

export const logger = {
  feeding: (...args: unknown[]) => console.log(prefix('feeding'), ...args),
  api: (...args: unknown[]) => console.log(prefix('api'), ...args),
  warn: (scope: string, ...args: unknown[]) => console.warn(prefix(scope), ...args),
  error: (scope: string, ...args: unknown[]) => console.error(prefix(scope), ...args),
};
