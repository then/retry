# then-retry

Retry functions that return promises

[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen)](https://rollingversions.com/then/retry)

## Installation

```
yarn add then-retry
```

## Usage

```js
import retry, { withRetry } from "then-retry";

// to retry a one of operation
await retry(() => someAsyncOp("hello world"));

// to retry every call of a given function
const someRetriedOp = withRetry(someAsyncOp);
await someRetriedOp("hello world");
```

The following options can be passed as a second arg to either `retry` or `withRetry`:

- `shouldRetry(err: unknown, failedAttemptCount: number) => boolean` - return true if you would like to try again. `err` is the most recent error. `failedAttemptCount` is the number of failed attempts (so the first time this is called, it is `1`). The default implementation returns `true` for the first `10` attempts.
- `retryDelay(err: unknown, failedAttemptCount: number) => number (milliseconds)` - return the number of milliseconds to wait before trying again. The default implementation returns 0 for the first few attempts, and then performs a randomized exponential backoff starting at 100ms.

## License

MIT
