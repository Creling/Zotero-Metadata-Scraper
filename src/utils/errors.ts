export class RateLimitError extends Error {
  constructor(source: string) {
    super(`Rate limited by ${source}. Try again later or add an API key.`);
    this.name = "RateLimitError";
  }
}
