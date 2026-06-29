# timestamp

## Brief Description
Attaches a timestamp to each value emitted by the source Observable, wrapping each value in a `Timestamp<T>` object containing the original value and the time at which it was emitted. Timestamps use `Date.now()` by default but can be customized via a scheduler. Useful for auditing, logging timing information, or time-based business logic.

## Category
transformation

## Import
```typescript
import { timestamp } from 'rxjs';
```

## Signature
```typescript
timestamp<T>(timestampProvider?: TimestampProvider): OperatorFunction<T, Timestamp<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `timestampProvider` | `TimestampProvider` (optional) | An object with a `now()` method returning a number. Defaults to `dateTimestampProvider` which uses `Date.now()`. Pass a scheduler like `animationFrameScheduler` for custom time sources. |

## Return Type
An `Observable<Timestamp<T>>` where each emission is `{ value: T, timestamp: number }`. The `timestamp` field is the time in milliseconds when the value was emitted.

## Marble Diagram
```
Source:  --a-----------b-----------c--|
timestamp()
Output:  --{v:a,t:100}--{v:b,t:110}--{v:c,t:120}--|
         (t values are milliseconds from Date.now())
```

## Examples

### Example 1: Add timestamps to stream values
```typescript
import { interval, timestamp, take, map } from 'rxjs';

interval(1000).pipe(
  take(3),
  timestamp()
).subscribe(({ value, timestamp: ts }) => {
  console.log(`Value: ${value}, emitted at: ${new Date(ts).toISOString()}`);
});
// Output (approximate):
// Value: 0, emitted at: 2024-01-15T10:00:01.000Z
// Value: 1, emitted at: 2024-01-15T10:00:02.003Z
// Value: 2, emitted at: 2024-01-15T10:00:03.001Z
```

### Example 2: Detect slow emissions
```typescript
import { Subject, timestamp, pairwise, filter, map } from 'rxjs';

const events$ = new Subject<string>();
const SLA_MS = 500; // maximum allowed time between events

events$.pipe(
  timestamp(),
  pairwise(),
  map(([prev, curr]) => ({
    event: curr.value,
    delay: curr.timestamp - prev.timestamp
  })),
  filter(({ delay }) => delay > SLA_MS)
).subscribe(({ event, delay }) => {
  console.warn(`SLA breach: "${event}" arrived ${delay}ms after previous event`);
});
```

### Example 3: Log events with timestamps for audit trail
```typescript
import { fromEvent, timestamp, map } from 'rxjs';

interface AuditEntry {
  event: string;
  target: string;
  time: string;
}

fromEvent<MouseEvent>(document, 'click').pipe(
  timestamp(),
  map(({ value: e, timestamp: ts }): AuditEntry => ({
    event: 'click',
    target: (e.target as Element).tagName,
    time: new Date(ts).toISOString()
  }))
).subscribe(entry => console.log('Audit:', entry));
```

## Common Pitfalls

### Pitfall 1: Destructuring conflicts with the built-in Date.timestamp (none — just naming)
The emitted object has a `timestamp` property. Avoid naming your local variable `timestamp` to prevent shadowing the imported operator.

```typescript
import { of, timestamp } from 'rxjs';

// ❌ Naming collision in destructuring
of('event').pipe(
  timestamp()
).subscribe(({ value, timestamp }) => {
  // 'timestamp' here is a number, not the operator — fine, but confusing
  console.log(new Date(timestamp).toISOString());
});

// ✅ Rename during destructuring for clarity
of('event').pipe(
  timestamp()
).subscribe(({ value, timestamp: emittedAt }) => {
  console.log(`"${value}" emitted at ${new Date(emittedAt).toISOString()}`);
});
```

### Pitfall 2: Expecting absolute wall-clock accuracy in test environments
In tests using virtual time (e.g., `TestScheduler`), pass the scheduler as the `timestampProvider` to get deterministic timestamps.

```typescript
import { of, timestamp } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

const scheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

scheduler.run(({ cold, expectObservable }) => {
  // Pass the scheduler so timestamps are virtual/deterministic
  const source$ = cold('a', { a: 'hello' });
  // Note: TestScheduler itself implements TimestampProvider
  const result$ = source$.pipe(timestamp(scheduler));
  // Now timestamp values correspond to virtual time
});
```

## Related Operators
- **`timeInterval`**: Instead of an absolute timestamp, emits the time elapsed since the previous emission.
- **`delay`**: Delays emissions by a fixed duration without adding timing metadata.
- **`throttleTime`** / **`debounceTime`**: Rate-limit streams based on time.
