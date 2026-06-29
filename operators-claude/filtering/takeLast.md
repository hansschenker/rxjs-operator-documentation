# takeLast

## Brief Description
The `takeLast` operator buffers the last `count` values from the source observable and emits them all (in original order) when the source completes. It is the complement of `skipLast` and is useful when you need to inspect the final N results from a finite stream, such as the last few log entries or the most recent measurements.

## Category
filtering

## Import
```typescript
import { takeLast } from 'rxjs';
```

## Signature
```typescript
takeLast<T>(count: number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| count | `number` | The number of values to retain from the end of the source sequence. Must be a non-negative integer. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable that buffers up to `count` values internally and emits them all upon source completion.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
takeLast(3)
Output:  -----------------3--4--5|  (all emitted synchronously on completion)
```

## Examples

### Example 1: Get the last 3 values of a finite stream
```typescript
import { of, takeLast } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  takeLast(3)
).subscribe(console.log);
// Output: 3, 4, 5
```

### Example 2: Retain last few HTTP responses
```typescript
import { from, takeLast } from 'rxjs';

const responses = ['resp-1', 'resp-2', 'resp-3', 'resp-4', 'resp-5'];

from(responses).pipe(
  takeLast(2)
).subscribe(r => console.log('Last responses:', r));
// Output: Last responses: resp-4
// Output: Last responses: resp-5
```

### Example 3: takeLast(1) as an alternative to last()
```typescript
import { of, takeLast, last } from 'rxjs';

// These are equivalent for getting the final value
of(10, 20, 30).pipe(takeLast(1)).subscribe(console.log); // 30
of(10, 20, 30).pipe(last()).subscribe(console.log);      // 30

// But takeLast does NOT error on empty sources, last() does
import { EMPTY } from 'rxjs';
EMPTY.pipe(takeLast(1)).subscribe({ complete: () => console.log('done') }); // 'done'
EMPTY.pipe(last()).subscribe({ error: err => console.error(err.name) });    // EmptyError
```

## Common Pitfalls

### Pitfall 1: Using takeLast on an infinite stream
`takeLast` must wait for the source to complete before emitting. An infinite stream means the buffered values are never emitted.

```typescript
import { interval, takeLast } from 'rxjs';

// ❌ interval never completes — takeLast never emits anything
interval(500).pipe(
  takeLast(3)
).subscribe(console.log); // Nothing is ever logged

// ✅ Make the stream finite first
import { take } from 'rxjs';
interval(500).pipe(
  take(10),
  takeLast(3)
).subscribe(console.log); // 7, 8, 9
```

### Pitfall 2: Expecting values to emit during the source
`takeLast` emits all retained values synchronously only when the source completes — not as the source emits. This is different from a sliding-window approach.

```typescript
import { Subject, takeLast } from 'rxjs';

const subject = new Subject<number>();

subject.pipe(takeLast(2)).subscribe(console.log);

subject.next(1); // No output yet
subject.next(2); // No output yet
subject.next(3); // No output yet
subject.complete(); // Now: 2, 3
```

## Related Operators
- **`last`**: Emits only the very last value; errors on empty source.
- **`skipLast`**: Skips the last N values (complement of `takeLast`).
- **`take`**: Emits the first N values (not the last).
- **`bufferCount`**: Collects values into arrays of a given size.
