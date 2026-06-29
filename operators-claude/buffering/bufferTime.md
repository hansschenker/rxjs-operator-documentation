# bufferTime

## Brief Description
`bufferTime` collects values from the source observable into arrays over fixed time windows. Each buffer is emitted after `bufferTimeSpan` milliseconds elapse. An optional `bufferCreationInterval` parameter controls how frequently new buffers open, enabling overlapping windows. A `maxBufferSize` cap prevents unbounded memory use during high-throughput periods. This operator is commonly used to batch time-sensitive events like analytics, logs, or UI updates.

## Category
buffering

## Import
```typescript
import { bufferTime } from 'rxjs';
```

## Signature
```typescript
bufferTime<T>(bufferTimeSpan: number, scheduler?: SchedulerLike): OperatorFunction<T, T[]>
bufferTime<T>(bufferTimeSpan: number, bufferCreationInterval: number | null | undefined, scheduler?: SchedulerLike): OperatorFunction<T, T[]>
bufferTime<T>(bufferTimeSpan: number, bufferCreationInterval: number | null | undefined, maxBufferSize: number, scheduler?: SchedulerLike): OperatorFunction<T, T[]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| bufferTimeSpan | `number` | The time (ms) each buffer window stays open before being emitted |
| bufferCreationInterval | `number \| null \| undefined` | Optional. How often (ms) to open a new buffer. Defaults to `bufferTimeSpan` (non-overlapping) |
| maxBufferSize | `number` | Optional. Maximum number of items per buffer; buffer closes early if this is reached |
| scheduler | `SchedulerLike` | Optional. Scheduler to use for timing. Defaults to `asyncScheduler` |

## Return Type
An `Observable<T[]>` emitting arrays of values collected within each time window. Empty arrays are emitted if no values arrived during a window.

## Marble Diagram
```
Non-overlapping (bufferTime(3)):
Source:  --a-b-----c--d--e--f--|
           [     ]  [      ]  [ ]
Output:  ---[a,b]---[c,d]------[e,f]--|

Overlapping (bufferTime(3, 1)):
Source:  --a--b--c--|
         [  ][  ][  ]
Output:  --[a]--[a,b,c]--[b,c]--[c]--|
```

## Examples

### Example 1: Batch analytics events every 2 seconds
```typescript
import { fromEvent, bufferTime, filter } from 'rxjs';

const clicks$ = fromEvent<MouseEvent>(document, 'click');

clicks$.pipe(
  bufferTime(2000),
  filter(batch => batch.length > 0)
).subscribe(batch => {
  // Send batch to analytics server
  console.log(`Sending ${batch.length} click events to analytics`);
  // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(batch) })
});
```

### Example 2: Rolling 3-second window updated every second
```typescript
import { interval, bufferTime, map } from 'rxjs';

const values$ = interval(400);

values$.pipe(
  bufferTime(3000, 1000) // 3s window, new window every 1s
).subscribe(window => {
  const sum = window.reduce((a, b) => a + b, 0);
  console.log(`Last 3 seconds total: ${sum} (${window.length} values)`);
});
```

### Example 3: Cap buffer size to avoid memory spikes
```typescript
import { Subject, bufferTime } from 'rxjs';

const events$ = new Subject<string>();

events$.pipe(
  bufferTime(1000, null, 50) // 1s window, max 50 items per buffer
).subscribe(batch => {
  console.log(`Processing up to 50 events: received ${batch.length}`);
});

// Simulate burst of events
for (let i = 0; i < 200; i++) {
  events$.next(`event-${i}`);
}
// Will emit immediately once 50 items are buffered, then again at 1s mark
```

## Common Pitfalls

### Pitfall 1: Empty arrays emitted when source is quiet
`bufferTime` emits on a timer regardless of whether any values arrived. Filter empty arrays if they are not meaningful.

```typescript
import { Subject, bufferTime, filter } from 'rxjs';

const sparse$ = new Subject<number>();

// ❌ Downstream receives [] every second even with no data
sparse$.pipe(
  bufferTime(1000)
).subscribe(batch => processResults(batch)); // processResults([]) is wasteful

// ✅ Skip empty buffers
sparse$.pipe(
  bufferTime(1000),
  filter(batch => batch.length > 0)
).subscribe(batch => processResults(batch));

function processResults(batch: number[]) {
  console.log('Processing:', batch);
}
```

### Pitfall 2: Using bufferTime in tests without a test scheduler
Real-time tests using `bufferTime` are slow and fragile. Use `TestScheduler` from `rxjs/testing` to control virtual time.

```typescript
import { TestScheduler } from 'rxjs/testing';
import { bufferTime } from 'rxjs';

// ❌ Real-time test — slow and timing-sensitive
it('buffers values', done => {
  interval(100).pipe(take(5), bufferTime(600)).subscribe(batch => {
    expect(batch).toEqual([0,1,2,3,4]);
    done();
  });
});

// ✅ Virtual-time test
it('buffers values', () => {
  const scheduler = new TestScheduler((actual, expected) =>
    expect(actual).toEqual(expected));
  scheduler.run(({ cold, expectObservable }) => {
    // use marble testing with virtual time
  });
});
```

## Related Operators
- **`buffer`**: closes buffer on an observable signal rather than a timer
- **`bufferCount`**: closes buffer after a fixed number of values
- **`windowTime`**: same time-windowing but emits inner Observables instead of arrays
- **`throttleTime`** / **`debounceTime`**: single-value rate limiting alternatives
