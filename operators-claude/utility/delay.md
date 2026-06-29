# delay

## Brief Description
`delay` shifts all emissions from a source observable forward in time by a specified duration. It is commonly used to simulate network latency in tests, throttle rapid UI updates, introduce intentional pauses in animations, or debounce-like scheduling where every item is delayed by the same fixed amount.

## Category
utility

## Import
```typescript
import { delay } from 'rxjs';
```

## Signature
```typescript
delay<T>(due: number | Date, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| due | `number` \| `Date` | The delay duration in milliseconds, or an absolute `Date` after which emissions should begin. |
| scheduler | `SchedulerLike` | Optional. The scheduler to use for managing the delay timers. Defaults to `asyncScheduler`. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>` — an observable that emits the same values as the source but with each emission delayed by the specified duration. The completion notification is also delayed.

## Marble Diagram
```
Source:   --a--b--c--|>        (delay: 3 time units)
delay:    ------a--b--c--|>
          |<-3->|  each item shifted right by 3 units
```

## Examples

### Example 1: Delaying emissions by a fixed millisecond amount
```typescript
import { of, delay } from 'rxjs';

console.log('Start:', Date.now());

of('Hello', 'World').pipe(
  delay(1000)
).subscribe({
  next: val => console.log(`Received "${val}" at`, Date.now()),
  complete: () => console.log('Complete')
});

// Output (approximately):
// Start: 1700000000000
// Received "Hello" at 1700000001000
// Received "World" at 1700000001000
// Complete
// Note: all items are delayed by 1000ms from subscription, then emitted together
```

### Example 2: Delaying until a specific Date
```typescript
import { of, delay } from 'rxjs';

const targetTime = new Date(Date.now() + 2000); // 2 seconds from now
console.log('Will emit at:', targetTime.toISOString());

of('Scheduled message').pipe(
  delay(targetTime)
).subscribe(msg => console.log('Received:', msg, 'at', new Date().toISOString()));

// Output (after ~2 seconds):
// Will emit at: 2024-01-01T12:00:02.000Z
// Received: Scheduled message at 2024-01-01T12:00:02.001Z
```

### Example 3: Simulating network latency in tests
```typescript
import { of, delay, switchMap } from 'rxjs';

interface User {
  id: number;
  name: string;
}

// Mock API function simulating latency
function fetchUser(id: number) {
  return of<User>({ id, name: `User ${id}` }).pipe(
    delay(300) // simulate 300ms network round-trip
  );
}

// Use in a component or test
of(1, 2, 3).pipe(
  switchMap(id => fetchUser(id))
).subscribe(user => console.log('Fetched:', user));

// Output (each ~300ms apart due to switchMap + delay):
// Fetched: { id: 3, name: 'User 3' }
// Note: switchMap cancels previous if new id arrives before 300ms
```

## Common Pitfalls

### Pitfall 1: Expecting delay to space out items from a synchronous source
`delay` shifts the entire batch by one fixed amount — it does not add spacing between individual items from a synchronous source. All items from `of(1, 2, 3)` will still arrive together, just later.

```typescript
import { of, delay, concatMap, timer } from 'rxjs';

// ❌ Incorrect assumption — items arrive together, not spaced 1 second apart
of(1, 2, 3).pipe(
  delay(1000)
).subscribe(val => console.log(val, new Date().toISOString()));
// Output: 1, 2, 3 all logged at the same timestamp (1 second later)

// ✅ Correct — use concatMap + timer to space items
of(1, 2, 3).pipe(
  concatMap(val => timer(1000).pipe(
    // import map from 'rxjs'
    // map(() => val)
  ))
);
// Each value is emitted 1 second after the previous one
```

### Pitfall 2: Forgetting that delay uses asyncScheduler by default (affects testing)
In unit tests with `TestScheduler`, you must use the provided virtual time scheduler, otherwise `delay` uses real timers.

```typescript
import { TestScheduler } from 'rxjs/testing';
import { of, delay } from 'rxjs';

// ❌ Incorrect in tests — real timers won't advance with virtual time
const result$ = of('value').pipe(delay(1000));
// In a TestScheduler context this won't behave as expected without passing the scheduler

// ✅ Correct — pass the test scheduler explicitly
const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

testScheduler.run(({ cold, expectObservable }) => {
  const source$ = cold('a|');
  const result$ = source$.pipe(delay(10, testScheduler));
  expectObservable(result$).toBe('----------a|');
});
```

## Related Operators
- **`delayWhen`**: Like `delay` but allows dynamic, per-emission delay durations based on a selector function.
- **`debounceTime`**: Delays emissions but only passes the last value if no new value arrives within the window — useful for input debouncing.
- **`throttleTime`**: Limits emission rate; different intent from `delay`.
- **`timer`**: Creates an observable that emits after a delay; often combined with `switchMap` or `mergeMap` instead of `delay`.
