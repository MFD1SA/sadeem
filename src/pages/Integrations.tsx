function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryGoogleRequest<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const message = (error as Error)?.message?.toLowerCase() || '';
      const isRateLimit =
        message.includes('rate') ||
        message.includes('quota') ||
        message.includes('429') ||
        message.includes('too many requests');

      if (!isRateLimit || attempt === retries) {
        throw error;
      }

      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}
