# share

## Brief Description
`share` is a multicasting operator that returns a new Observable that multicasts (shares) the original Observable among multiple subscribers. All subscribers share the same underlying execution. It is equivalent to using `pipe(multicast(() => new Subject()), refCount())` — that is, once the subscriber count drops to zero, the source is unsubscribed, and the next subscriber causes a fresh subscription to the source. This makes it ideal for converting a cold Observable into a hot one without retaining previous values.

## Category
multicasting

## Import
```typescript
import { share } from 'rxjs';
```

## Signature
```typescript
share<T>(): MonoTypeOperatorFunction<T>

// Overload with config (RxJS 7+)
share<T>(options: ShareConfig<T>): MonoTypeOperatorFunction<T>
```

Where `ShareConfig<T>` is:
```typescript
interface ShareConfig<T> {
  connector?: () => SubjectLike<T>;
  resetOnError?: boolean | ((error: any) => Observable<any>);
  resetOnComplete?: boolean | ((value: void) => Observable<any>);
  resetOnRefCountZero?: boolean | ((value: void) => Observable<any>);
}
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ShareConfig<T>` | *(Optional, RxJS 7+)* Configuration object to control the Subject factory and reset behaviors. |
| `options.connector` | `() => SubjectLike<T>` | Factory function that returns the Subject used to multicast. Defaults to `() => new Subject<T>()`. |
| `options.resetOnError` | `boolean \| ((error: any) => Observable<any>)` | Whether to reset the internal Subject when the source errors. Defaults to `true`. |
| `options.resetOnComplete` | `boolean \| ((value: void) => Observable<any>)` | Whether to reset the internal Subject when the source completes. Defaults to `true`. |
| `options.resetOnRefCountZero` | `boolean \| ((value: void) => Observable<any>)` | Whether to reset the internal Subject when subscriber count reaches zero. Defaults to `true`. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>` — an Observable of the same type `T` that multicasts the source to all active subscribers. Late subscribers do not receive past values (use `shareReplay` for that).

## Marble Diagram
```
Source:         --a--b--c--d--|>

Subscriber 1:   --a--b--c--d--|>   (subscribes at t=0)
Subscriber 2:        --b--c--d--|> (subscribes after 'a' emitted, misses 'a')

share() multicasts to both; only one subscription to Source.
```

## Examples

### Example 1: Basic multicasting with two subscribers
```typescript
import { interval, share, tap } from 'rxjs';

const source$ = interval(1000).pipe(
  tap((val) => console.log(`Source produced: ${val}`)),
  share()
);

// Both subscribers share the same source subscription.
// The tap fires only once per emission, not twice.
const sub1 = source$.subscribe((val) => console.log(`Subscriber 1: ${val}`));
const sub2 = source$.subscribe((val) => console.log(`Subscriber 2: ${val}`));

setTimeout(() => {
  sub1.unsubscribe();
  sub2.unsubscribe();
}, 5000);

// Output (approx):
// Source produced: 0
// Subscriber 1: 0
// Subscriber 2: 0
// Source produced: 1
// Subscriber 1: 1
// Subscriber 2: 1
// ...
```

### Example 2: Demonstrating ref-count reset — late subscriber triggers new source
```typescript
import { interval, share, take, tap } from 'rxjs';

const source$ = interval(1000).pipe(
  tap((val) => console.log(`[source] emitting ${val}`)),
  take(10),
  share()
);

const sub1 = source$.subscribe((val) => console.log(`Sub1: ${val}`));

setTimeout(() => {
  // After sub1 unsubscribes, ref count drops to 0 and source resets.
  sub1.unsubscribe();
  console.log('Sub1 unsubscribed');
}, 2500);

setTimeout(() => {
  // New subscription causes a fresh subscription to source (starts from 0 again).
  source$.subscribe((val) => console.log(`Sub2 (late): ${val}`));
}, 4000);

// Output:
// [source] emitting 0
// Sub1: 0
// [source] emitting 1
// Sub1: 1
// Sub1 unsubscribed
// (gap — source unsubscribed)
// [source] emitting 0  <-- restarts!
// Sub2 (late): 0
```

### Example 3: Custom connector with ReplaySubject via options
```typescript
import { interval, share, ReplaySubject, take } from 'rxjs';

// Using share with a ReplaySubject connector to buffer the last value.
// Note: for simple replay-on-subscribe use cases, prefer shareReplay().
const source$ = interval(1000).pipe(
  take(5),
  share({
    connector: () => new ReplaySubject<number>(1),
    resetOnRefCountZero: true,
    resetOnComplete: false,
  })
);

const sub1 = source$.subscribe((val) => console.log(`Sub1: ${val}`));

setTimeout(() => {
  // Sub2 joins late but receives the last buffered value immediately
  // due to the ReplaySubject(1) connector.
  source$.subscribe((val) => console.log(`Sub2 (late join): ${val}`));
}, 2500);

// Output:
// Sub1: 0
// Sub1: 1
// Sub2 (late join): 1  <-- receives buffered last value
// Sub1: 2
// Sub2 (late join): 2
// ...
```

## Common Pitfalls

### Pitfall 1: Expecting late subscribers to receive past values
`share()` uses a plain `Subject` internally, which has no buffer. Subscribers that arrive after an emission has already occurred will not receive that emission.

```typescript
import { of, share, delay } from 'rxjs';

const source$ = of(1, 2, 3).pipe(share());

// ❌ Late subscriber misses all values because of() completes synchronously
// and share() resets after completion.
source$.subscribe((v) => console.log('Early:', v)); // 1, 2, 3
setTimeout(() => {
  source$.subscribe((v) => console.log('Late:', v)); // Nothing!
}, 0);

// ✅ Use shareReplay(1) if late subscribers need the last value
import { shareReplay } from 'rxjs';
const cached$ = of(1, 2, 3).pipe(shareReplay(1));
source$.subscribe((v) => console.log('Early:', v));   // 1, 2, 3
setTimeout(() => {
  cached$.subscribe((v) => console.log('Late:', v)); // 3
}, 0);
```

### Pitfall 2: Assuming a shared source never re-executes
Because `share()` resets when the subscriber count reaches zero (`resetOnRefCountZero: true` by default), a new subscription after all prior subscriptions end will trigger a fresh execution of the source — potentially causing duplicate HTTP requests or side effects.

```typescript
import { fromFetch, share } from 'rxjs';

const user$ = fromFetch('/api/user').pipe(share());

// ❌ If sub1 completes/unsubscribes before sub2 subscribes,
// the HTTP request fires again.
const sub1 = user$.subscribe(console.log);
sub1.unsubscribe(); // ref count drops to 0, state resets
const sub2 = user$.subscribe(console.log); // NEW HTTP request!

// ✅ If you want to prevent re-fetching after completion, use shareReplay
import { shareReplay } from 'rxjs';
const cachedUser$ = fromFetch('/api/user').pipe(shareReplay(1));
const s1 = cachedUser$.subscribe(console.log); // HTTP request fires
const s2 = cachedUser$.subscribe(console.log); // Gets cached response, no new request
```

## Related Operators
- **`shareReplay`**: Like `share`, but uses a `ReplaySubject` internally so late subscribers receive buffered past values. Prefer this when caching the latest emission is needed.
- **`connect`**: Lower-level multicasting primitive that gives you explicit control over when the multicasted subscription starts via a `connect` callback.
- **`publish`**: Deprecated predecessor to `share`/`connect`. Avoid in new code.
- **`multicast`**: Deprecated lower-level operator. Avoid in new code.
- **`refCount`**: Deprecated operator that managed subscriber counting for multicast. Now baked into `share`/`shareReplay`.
