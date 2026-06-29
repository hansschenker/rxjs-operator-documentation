# shareReplay

## Brief Description
`shareReplay` multicasts the source Observable through a `ReplaySubject`, buffering a specified number of emissions (or a time window) so that new subscribers immediately receive the most recent cached values without triggering a new source subscription. It is the go-to operator for caching expensive operations such as HTTP requests: the request fires once, and every current or future subscriber gets the result. The `refCount` option (default `false` in RxJS 7) controls whether the source subscription is torn down when all subscribers unsubscribe.

## Category
multicasting

## Import
```typescript
import { shareReplay } from 'rxjs';
```

## Signature
```typescript
shareReplay<T>(config: ShareReplayConfig): MonoTypeOperatorFunction<T>

shareReplay<T>(bufferSize?: number, windowTime?: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>
```

Where `ShareReplayConfig` is:
```typescript
interface ShareReplayConfig {
  bufferSize?: number;
  windowTime?: number;
  refCount: boolean;
  scheduler?: SchedulerLike;
}
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `bufferSize` | `number` | The maximum number of emissions to buffer and replay to new subscribers. Defaults to `Infinity`. |
| `windowTime` | `number` | The maximum age (in milliseconds) of buffered items. Items older than this are discarded. Defaults to `Infinity`. |
| `refCount` | `boolean` | *(Config object only)* When `true`, the source subscription is closed when the subscriber count drops to zero (matching the behavior of `share()`). When `false` (default), the source subscription is kept alive even with no subscribers so the buffer is preserved. |
| `scheduler` | `SchedulerLike` | An optional scheduler for managing the timing of buffered values. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>`. The resulting Observable replays up to `bufferSize` cached values to each new subscriber and then continues forwarding live emissions as they occur.

## Marble Diagram
```
Source:       --a--b--c-----------d--e--|>

Sub1 (t=0):   --a--b--c-----------d--e--|>
                                ^
                         Sub2 subscribes here
Sub2 (late):             (c)----d--e--|>
                          ^replayed immediately

sharReplay(1) buffers the last 1 value ('c').
Sub2 receives 'c' synchronously on subscription, then continues live.
```

## Examples

### Example 1: Caching an HTTP request so multiple subscribers share one fetch
```typescript
import { shareReplay } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

interface User {
  id: number;
  name: string;
}

// The HTTP request fires only once, regardless of how many subscribers
// attach — even after the request has completed.
const user$ = fromFetch<User>('/api/user/1', {
  selector: (res) => res.json(),
}).pipe(
  shareReplay(1)
);

// First subscriber triggers the HTTP request.
user$.subscribe((user) => console.log('Component A:', user.name));

// Second subscriber reuses the cached response — no new request.
user$.subscribe((user) => console.log('Component B:', user.name));

setTimeout(() => {
  // Even a late subscriber gets the cached value immediately.
  user$.subscribe((user) => console.log('Component C (late):', user.name));
}, 3000);
```

### Example 2: Time-windowed cache with automatic expiry
```typescript
import { shareReplay, timer, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

// Cache stock prices for 30 seconds; any value older than 30 s is dropped.
const CACHE_TTL_MS = 30_000;

const stockPrice$ = fromFetch('/api/stock/ACME', {
  selector: (res) => res.json() as Promise<{ price: number }>,
}).pipe(
  shareReplay({ bufferSize: 1, windowTime: CACHE_TTL_MS, refCount: false })
);

stockPrice$.subscribe((data) => console.log('Ticker widget:', data.price));

setTimeout(() => {
  // Within 30 s — gets cached price.
  stockPrice$.subscribe((data) => console.log('Detail page:', data.price));
}, 10_000);

setTimeout(() => {
  // After 30 s — buffer expired, so a fresh HTTP request is made.
  stockPrice$.subscribe((data) => console.log('Refreshed price:', data.price));
}, 35_000);
```

### Example 3: Using refCount:true to clean up when there are no subscribers
```typescript
import { interval, shareReplay, take, tap } from 'rxjs';

// With refCount: true, the source unsubscribes when all subscribers leave
// and re-subscribes (losing the buffer) when a new subscriber arrives.
const counter$ = interval(500).pipe(
  tap((v) => console.log('[source]', v)),
  take(20),
  shareReplay({ bufferSize: 2, refCount: true })
);

const sub1 = counter$.subscribe((v) => console.log('Sub1:', v));

setTimeout(() => {
  console.log('--- Sub2 joins (replays last 2) ---');
  const sub2 = counter$.subscribe((v) => console.log('Sub2:', v));

  setTimeout(() => {
    sub1.unsubscribe();
    sub2.unsubscribe();
    console.log('--- All unsubscribed; source will stop ---');
  }, 2000);
}, 1500);

setTimeout(() => {
  // Source has been unsubscribed; buffer is gone; new source subscription starts.
  console.log('--- Sub3 joins; new source subscription ---');
  counter$.subscribe((v) => console.log('Sub3:', v));
}, 5000);
```

## Common Pitfalls

### Pitfall 1: Default refCount:false can cause memory leaks in long-lived apps
By default, `shareReplay` keeps the source subscription alive even after all subscribers unsubscribe. For observables that never complete (e.g., WebSocket streams), this means the source runs forever in the background.

```typescript
import { webSocket } from 'rxjs/webSocket';
import { shareReplay } from 'rxjs';

// ❌ WebSocket stays open even after every component unsubscribes.
const ws$ = webSocket('wss://example.com/feed').pipe(
  shareReplay(1) // refCount defaults to false
);

// ✅ Tear down the WebSocket when nobody is listening.
const ws2$ = webSocket('wss://example.com/feed').pipe(
  shareReplay({ bufferSize: 1, refCount: true })
);
```

### Pitfall 2: Replaying errors to new subscribers
If the source errors, `shareReplay` (with `refCount: false`) will replay that error to every new subscriber. This is rarely the desired behavior for network requests.

```typescript
import { throwError, timer, shareReplay, catchError, EMPTY, retry } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

// ❌ An HTTP error is cached and replayed forever to new subscribers.
const badCache$ = fromFetch('/api/might-fail').pipe(
  shareReplay(1) // error gets buffered
);

// ✅ Handle/retry errors before caching so only successful responses are shared.
const goodCache$ = fromFetch('/api/might-fail').pipe(
  retry(3),
  catchError(() => EMPTY), // or return a fallback observable
  shareReplay(1)
);
```

### Pitfall 3: bufferSize: Infinity can accumulate large amounts of data
Omitting `bufferSize` (or setting it to `Infinity`) means every emission ever produced is buffered and replayed to new subscribers, which can exhaust memory for long-running streams.

```typescript
import { interval, shareReplay } from 'rxjs';

// ❌ Every tick is buffered forever — memory grows without bound.
const ticks$ = interval(100).pipe(
  shareReplay() // bufferSize defaults to Infinity
);

// ✅ Only buffer what new subscribers actually need.
const ticks2$ = interval(100).pipe(
  shareReplay(1) // only the most recent tick
);
```

## Related Operators
- **`share`**: Like `shareReplay` but uses a plain `Subject` (no buffer). New subscribers do not receive past values. Resets when subscriber count drops to zero by default.
- **`connect`**: Lower-level alternative that gives explicit control over the multicast subscription lifecycle.
- **`publishReplay`**: Deprecated predecessor. Avoid in new code; use `shareReplay` instead.
- **`ReplaySubject`**: The underlying Subject type that powers `shareReplay`'s buffering logic.
