# bufferCount

## Brief Description
`bufferCount` collects values from the source observable into fixed-size arrays. Once an array reaches the specified size, it is emitted and a new buffer begins. An optional `startBufferEvery` parameter allows creating overlapping or skipping buffers by controlling how often a new buffer window opens. This operator is ideal for processing data in fixed-size chunks, such as pagination or batch processing.

## Category
buffering

## Import
```typescript
import { bufferCount } from 'rxjs';
```

## Signature
```typescript
bufferCount<T>(bufferSize: number, startBufferEvery?: number | null): OperatorFunction<T, T[]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| bufferSize | `number` | The maximum number of items to collect in each buffer |
| startBufferEvery | `number \| null` | Optional. How often to start a new buffer. If omitted, a new buffer starts immediately after the previous one closes |

## Return Type
An `Observable<T[]>` emitting arrays of values, each with at most `bufferSize` elements (or fewer for the last buffer if the source completes).

## Marble Diagram
```
Non-overlapping (bufferCount(3)):
Source:  --a--b--c--d--e--f--|
Output:  ---------[a,b,c]----[d,e,f]--|

Overlapping (bufferCount(3, 1)):
Source:  --a--b--c--d--|
Output:  -----[a,b,c]--[b,c,d]--|
```

## Examples

### Example 1: Process items in fixed-size batches
```typescript
import { range, bufferCount } from 'rxjs';

range(1, 10).pipe(
  bufferCount(3)
).subscribe(batch => {
  console.log('Batch:', batch);
});
// Batch: [1, 2, 3]
// Batch: [4, 5, 6]
// Batch: [7, 8, 9]
// Batch: [10]   <-- remainder emitted on source complete
```

### Example 2: Sliding window of recent values
```typescript
import { from, bufferCount } from 'rxjs';

const temperatures = [20, 22, 21, 25, 24, 23, 26];

from(temperatures).pipe(
  bufferCount(3, 1) // window size 3, slide by 1
).subscribe(window => {
  const avg = window.reduce((a, b) => a + b, 0) / window.length;
  console.log(`Window ${JSON.stringify(window)}, avg: ${avg.toFixed(1)}`);
});
// Window [20,22,21], avg: 21.0
// Window [22,21,25], avg: 22.7
// Window [21,25,24], avg: 23.3
// ...
```

### Example 3: Skip-sampling (every Nth group)
```typescript
import { interval, bufferCount, map, take } from 'rxjs';

// Capture every 5th event, but only keep the first 3 of each group
interval(100).pipe(
  take(20),
  bufferCount(3, 5) // collect 3, but start new buffer every 5 items
).subscribe(batch => {
  console.log('Sampled batch:', batch);
});
// Sampled batch: [0, 1, 2]
// Sampled batch: [5, 6, 7]
// Sampled batch: [10, 11, 12]
// Sampled batch: [15, 16, 17]
```

## Common Pitfalls

### Pitfall 1: Last buffer may be smaller than bufferSize
When the source completes and the accumulated count is less than `bufferSize`, `bufferCount` emits the partial buffer. Make sure downstream code handles variable-length arrays.

```typescript
import { range, bufferCount } from 'rxjs';

// ❌ Assuming all batches are size 3
range(1, 7).pipe(
  bufferCount(3)
).subscribe(batch => {
  const [a, b, c] = batch; // c is undefined for last batch [7]
  console.log(a + b + c);  // NaN on last iteration
});

// ✅ Account for partial last buffer
range(1, 7).pipe(
  bufferCount(3)
).subscribe(batch => {
  const sum = batch.reduce((acc, val) => acc + val, 0);
  console.log('Sum:', sum);
});
```

### Pitfall 2: Overlapping buffers create shared references
When `startBufferEvery < bufferSize`, elements appear in multiple emitted arrays. Mutating one array does not affect others, but be aware of the duplicate-value semantics.

```typescript
import { from, bufferCount } from 'rxjs';

// ❌ Forgetting that values repeat in overlapping mode
from([1, 2, 3, 4]).pipe(
  bufferCount(3, 1)
).subscribe(buf => {
  // [1,2,3], [2,3,4] — value 2 and 3 appear twice
  console.log(buf);
});

// ✅ Use bufferCount(n) without startBufferEvery for non-overlapping chunks
from([1, 2, 3, 4]).pipe(
  bufferCount(3)
).subscribe(buf => {
  console.log(buf); // [1,2,3], [4]
});
```

## Related Operators
- **`buffer`**: buffers based on an external notifier observable
- **`bufferTime`**: buffers values over a fixed time period
- **`windowCount`**: same semantics but emits inner Observables instead of arrays
- **`pairwise`**: shorthand for `bufferCount(2, 1)` that emits `[prev, curr]` pairs
