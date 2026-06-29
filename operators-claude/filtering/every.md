# every

## Brief Description
The `every` operator checks whether all values emitted by the source observable satisfy a provided predicate function. It emits a single `boolean` — `true` if every value passes the predicate, or `false` as soon as any value fails (short-circuiting). It completes after emitting that boolean. It is the reactive equivalent of `Array.prototype.every`.

## Category
filtering

## Import
```typescript
import { every } from 'rxjs';
```

## Signature
```typescript
every<T>(predicate: (value: T, index: number, source: Observable<T>) => boolean, thisArg?: any): OperatorFunction<T, boolean>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `(value: T, index: number, source: Observable<T>) => boolean` | A function called for each source value. If it returns `false` for any value, `every` emits `false` immediately and completes. |
| thisArg | `any` | Optional. An object to use as `this` inside the predicate. |

## Return Type
An `OperatorFunction<T, boolean>` — an Observable that emits a single `boolean` value and completes.

## Marble Diagram
```
Source:  --2--4--6--8--|
every(x => x % 2 === 0)
Output:  --------------true|    (all even — emits true on completion)

Source:  --2--4--5--8--|
every(x => x % 2 === 0)
Output:  --------false|         (short-circuits at 5)
```

## Examples

### Example 1: Check that all values are positive
```typescript
import { of, every } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  every(n => n > 0)
).subscribe(result => console.log('All positive?', result));
// Output: All positive? true
```

### Example 2: Short-circuit on a failing value
```typescript
import { of, every } from 'rxjs';

of(2, 4, 5, 6).pipe(
  every(n => n % 2 === 0)
).subscribe(result => console.log('All even?', result));
// Output: All even? false  (short-circuits when 5 is encountered)
```

### Example 3: Validate that all API responses are successful
```typescript
import { from, every, map } from 'rxjs';

const responses = [
  { status: 200, body: 'OK' },
  { status: 201, body: 'Created' },
  { status: 200, body: 'OK' },
];

from(responses).pipe(
  every(r => r.status >= 200 && r.status < 300)
).subscribe(allOk => {
  if (allOk) {
    console.log('All requests succeeded');
  } else {
    console.log('Some requests failed');
  }
});
// Output: All requests succeeded
```

## Common Pitfalls

### Pitfall 1: every emits true for an empty source
Like `Array.prototype.every`, `every` with an empty source emits `true` vacuously — there are no counterexamples.

```typescript
import { EMPTY, every } from 'rxjs';

EMPTY.pipe(
  every(n => n > 0)
).subscribe(result => console.log(result)); // true
// This is correct mathematically but can be surprising
```

### Pitfall 2: Using every on an infinite stream
`every` can only emit `true` when the source completes. On an infinite stream, if no value fails the predicate, `every` will never emit. It will emit `false` if a failing value is encountered (short-circuit), but never `true`.

```typescript
import { interval, every } from 'rxjs';

// ❌ Never emits true — interval never completes
interval(500).pipe(
  every(n => n >= 0)
).subscribe(console.log);

// ✅ Bound the source
import { take } from 'rxjs';
interval(500).pipe(
  take(5),
  every(n => n >= 0)
).subscribe(console.log); // true
```

## Related Operators
- **`filter`**: Emits values passing a predicate; does not emit a single boolean summary.
- **`some` (not in RxJS)**: Use `first` with a predicate plus `map` to check if any value matches.
- **`isEmpty`**: Checks whether the source emits any values at all.
- **`find`**: Emits the first matching value rather than a boolean.
