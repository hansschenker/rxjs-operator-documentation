# defaultIfEmpty

## Brief Description
`defaultIfEmpty` guarantees that the resulting Observable emits at least one value. If the source completes **without** emitting anything, `defaultIfEmpty` emits a single fallback value and then completes. If the source emits one or more values, the fallback is ignored and every source value passes through unchanged. It is the idiomatic way to protect a downstream consumer that assumes the stream is non-empty — for example, supplying a placeholder when a filtered search yields no results.

## Category
filtering

## Import
```typescript
import { defaultIfEmpty } from 'rxjs';
```

## Signature
```typescript
defaultIfEmpty<T, R>(defaultValue: R): OperatorFunction<T, T | R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `defaultValue` | `R` | The value to emit if — and only if — the source completes without having emitted any value. |

## Return Type
An `OperatorFunction<T, T | R>` — an Observable that emits either the source's values (type `T`) or, when the source was empty, the single `defaultValue` (type `R`).

## Marble Diagram
```
Source:  --------|                 (completes without emitting)
defaultIfEmpty('empty')
Output:  --------(empty)|

Source:  --a--b--|
defaultIfEmpty('empty')
Output:  --a--b--|                 (source emitted — default is ignored)
```

## Examples

### Example 1: Provide a fallback for an empty source
```typescript
import { EMPTY, defaultIfEmpty } from 'rxjs';

EMPTY.pipe(
  defaultIfEmpty('no data')
).subscribe(value => console.log(value));
// Output: no data
```

### Example 2: Fallback when a filter removes every value
```typescript
import { of, filter, defaultIfEmpty } from 'rxjs';

const numbers = of(1, 3, 5, 7);

numbers.pipe(
  filter(n => n % 2 === 0),          // no even numbers → source becomes empty
  defaultIfEmpty(-1)
).subscribe(value => console.log(value));
// Output: -1

// When at least one value survives the filter, the default is not used:
of(1, 2, 3).pipe(
  filter(n => n % 2 === 0),
  defaultIfEmpty(-1)
).subscribe(value => console.log(value));
// Output: 2
```

### Example 3: Guarantee a UI always renders something
```typescript
import { of, map, defaultIfEmpty } from 'rxjs';

interface Notification { id: number; text: string; }

const notifications$ = of<Notification[]>([]).pipe(
  // Imagine this came from an API; here it is empty
  map(list => list.map(n => n.text)),
  defaultIfEmpty(['You have no new notifications'])
);

notifications$.subscribe(messages => console.log(messages));
// Output: [ 'You have no new notifications' ]
```

## Common Pitfalls

### Pitfall 1: Confusing defaultIfEmpty with startWith
`startWith` **always** prepends its value(s), regardless of whether the source emits. `defaultIfEmpty` emits its value **only** when the source turns out to be empty. Reaching for `startWith` when you meant "fallback" produces a spurious leading value.

```typescript
import { of, startWith, defaultIfEmpty } from 'rxjs';

// ❌ startWith prepends 0 even though the source has real values
of(1, 2).pipe(startWith(0)).subscribe(console.log);
// 0, 1, 2

// ✅ defaultIfEmpty only kicks in for an empty source
of(1, 2).pipe(defaultIfEmpty(0)).subscribe(console.log);
// 1, 2
of().pipe(defaultIfEmpty(0)).subscribe(console.log);
// 0
```

### Pitfall 2: Expecting the default to cover errors
The fallback is emitted only on **empty completion**. If the source *errors* before emitting, `defaultIfEmpty` does nothing — the error propagates untouched. Use `catchError` (optionally alongside `defaultIfEmpty`) when you need to recover from failures.

```typescript
import { throwError, defaultIfEmpty, catchError, of } from 'rxjs';

// ❌ The default never appears — the stream errors instead
throwError(() => new Error('boom')).pipe(
  defaultIfEmpty('fallback')
).subscribe({
  next: console.log,
  error: err => console.error('errored:', err.message) // errored: boom
});

// ✅ Recover from the error explicitly
throwError(() => new Error('boom')).pipe(
  defaultIfEmpty('fallback'),
  catchError(() => of('recovered'))
).subscribe(console.log); // recovered
```

## Related Operators
- **`startWith`**: Always prepends value(s) to the source, whether or not it is empty.
- **`throwIfEmpty`**: The error-oriented counterpart — raises an `EmptyError` instead of substituting a value when the source is empty.
- **`isEmpty`**: Reports *whether* the source was empty as a boolean, rather than substituting a value.
- **`every`**: Emits a boolean indicating whether all values satisfy a predicate (an empty source yields `true`).
- **`last` / `first`**: Accept a `defaultValue` argument that behaves like `defaultIfEmpty` for the specific case of taking a single value.
