# materialize

## Brief Description
Wraps every emission from the source Observable — including `next`, `error`, and `complete` notifications — into a `Notification` object and emits them as regular `next` values. This converts an Observable's notification channel into data, allowing error and completion events to be handled uniformly as values rather than through separate error/complete callbacks. It is the inverse of `dematerialize`.

## Category
transformation

## Import
```typescript
import { materialize } from 'rxjs';
```

## Signature
```typescript
materialize<T>(): OperatorFunction<T, Notification<T> & TypedNotification<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| (none) | — | `materialize` takes no parameters. |

## Return Type
An `Observable<Notification<T>>` that never errors (errors from the source become `Notification` objects with `kind: 'E'`). Each emission is a `Notification<T>` with:
- `kind`: `'N'` (next), `'E'` (error), or `'C'` (complete)
- `value`: the emitted value (for `kind: 'N'`)
- `error`: the error (for `kind: 'E'`)
- `hasValue`: boolean

## Marble Diagram
```
Source:  --1----2----3--X
materialize()
Output:  --N(1)-N(2)-N(3)-E(err)--|
         (errors become Notification objects; stream itself completes)

Source:  --1----2----3--|
materialize()
Output:  --N(1)-N(2)-N(3)-C()--|
```

## Examples

### Example 1: Inspect all notification types
```typescript
import { of, materialize } from 'rxjs';

of(1, 2, 3).pipe(
  materialize()
).subscribe(notification => {
  console.log(`Kind: ${notification.kind}, Value: ${notification.value}`);
});
// Output:
// Kind: N, Value: 1
// Kind: N, Value: 2
// Kind: N, Value: 3
// Kind: C, Value: undefined
```

### Example 2: Capture errors as values for logging
```typescript
import { throwError, of, materialize, Notification } from 'rxjs';

function riskyOperation(shouldFail: boolean) {
  return shouldFail
    ? throwError(() => new Error('Operation failed'))
    : of('Success result');
}

riskyOperation(true).pipe(
  materialize()
).subscribe((n: Notification<string>) => {
  if (n.kind === 'E') {
    console.log('Error captured as value:', n.error.message);
  } else if (n.kind === 'N') {
    console.log('Value:', n.value);
  } else if (n.kind === 'C') {
    console.log('Stream completed');
  }
});
// Output:
// Error captured as value: Operation failed
```

### Example 3: Use materialize/dematerialize to suppress errors in a higher-order stream
```typescript
import { from, mergeMap, materialize, dematerialize, filter, Notification } from 'rxjs';
import { of, throwError } from 'rxjs';

const sources = [
  of(1, 2, 3),
  throwError(() => new Error('Source 2 failed')),
  of(7, 8, 9),
];

// Without materialize, the error from source 2 would terminate the outer stream
from(sources).pipe(
  mergeMap(source$ =>
    source$.pipe(
      materialize()
    )
  ),
  filter((n: Notification<number>) => n.kind !== 'E'), // discard errors
  dematerialize()
).subscribe({
  next: val => console.log('Value:', val),
  complete: () => console.log('All sources processed')
});
// Output:
// Value: 1
// Value: 2
// Value: 3
// Value: 7
// Value: 8
// Value: 9
// All sources processed
```

## Common Pitfalls

### Pitfall 1: Forgetting that the materialized stream never errors
After `materialize`, the resulting stream never throws. Errors from the source become `Notification` objects with `kind: 'E'`.

```typescript
import { throwError, materialize } from 'rxjs';

// The error handler here will NOT be called
throwError(() => new Error('Oops')).pipe(
  materialize()
).subscribe({
  next: n => console.log('Got notification:', n.kind, n.error?.message),
  error: err => console.error('NEVER CALLED:', err) // errors become 'N' emissions
});
// Output:
// Got notification: E Oops
```

### Pitfall 2: Comparing notification kinds with wrong case
The `kind` property uses uppercase single characters: `'N'`, `'E'`, `'C'`.

```typescript
import { of, materialize } from 'rxjs';

of(1).pipe(materialize()).subscribe(n => {
  // ❌ Wrong — kind values are uppercase single chars
  if ((n.kind as string) === 'next') console.log('next'); // never true

  // ✅ Correct
  if (n.kind === 'N') console.log('next value:', n.value);
});
```

## Related Operators
- **`dematerialize`**: The inverse — converts `Notification` objects back into actual Observable emissions.
- **`catchError`**: Handles errors in-stream without converting them to values; often simpler than `materialize` for error handling.
- **`tap`**: Inspects notifications without transforming the stream.
