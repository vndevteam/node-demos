/**
 * Utility function to create a delay/sleep in async operations
 */
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Get lock labels for advisory lock operations.
 * Returns namespace and key labels used for PostgreSQL advisory locks.
 */
export function getLockLabels() {
  return {
    namespaceLabel: 'cloudsign:requestSignContract',
  };
}
