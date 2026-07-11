export function withTimeout<T>(operation: Promise<T>, message: string, timeoutMs = 10_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);

    operation.then(resolve, reject).finally(() => clearTimeout(timeout));
  });
}
