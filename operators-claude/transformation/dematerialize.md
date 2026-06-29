# dematerialize

## Brief Description
Converts a stream of `Notification` objects back into an Observable that emits the wrapped values, re-throws wrapped errors, and completes when it encounters a completion `Notification`. It is the inverse of `materialize`. Use `dematerialize` when you have a stream of `Notification` objects and want to convert them back to a regular Observable.

## Category
transformation

## Import
```typescript
import { dematerialize } from 'rxjs';
```

## Signature
```typescript
dematerialize<N extends ObservableNotification<unknown>>(): OperatorFunction<N, ValueFromNotification<N>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| (none) | — | `dematerialize` takes no parameters. |

## Return Type
An `Observable` that emits the unwrapped values from `next` Notifications, errors on `error` Notifications, and completes on `complete` Notifications.

## Marble Diagram
```
Source:  --N(1)--N(2)--E(err)--|
dematerialize()
Output:  --1-----2-----X
         (error notification becomes an actual error)

Source:  --N(1)--N(2)--C()--|
dematerialize()
Output:  --1-----2-----|
```

## Examples

### Example 1: Round-trip with materialize
```typescript
import { of, materialize, dematerialize } from 'rxjs';

of(10, 20, 30).pipe(
  materialize(),
  // ... some intermediate processing of Notification objects ...
  dematerialize()
).subscribe({
  next: val => console.log('Value:', val),
  complete: () => console.log('Complete')
});
// Output:
// Value: 10
// Value: 20
// Value: 30
// Complete
```

### Example 2: Selectively replay notifications from a store
```typescript
import { of, Notification, dematerialize, from } from 'rxjs';

// Imagine these notifications were stored/serialized
const storedNotifications: Notification<number>[] = [
  Notification.createNext(42),
  Notification.createNext(100),
  Notification.createComplete(),
];

from(storedNotifications).pipe(
  dematerialize()
).subscribe({
  next: val => console.log('Replayed value:', val),
  complete: () => console.log('Replay complete')
});
// Output:
// Replayed value: 42
// Replayed value: 100
// Replay complete
```

### Example 3: Filter and re-emit notifications selectively
```typescript
import { of, throwError, merge, materialize, filter, dematerialize, Notification } from 'rxjs';

const mixed$ = merge(
  of(1, 2),
  throwError(() => new Error('Simulated error')),
  of(3, 4)
);

mixed$.pipe(
  materialize(),
  filter((n: Notification<number>) => {
    if (n.kind === 'E') {
      console.warn('Suppressed error:', n.error.message);
      return false; // swallow errors
    }
    return true;
  }),
  dematerialize()
).subscribe({
  next: val => console.log('Value:', val),
  complete: () => console.log('Done')
});
// Output:
// Value: 1
// Value: 2
// Suppressed error: Simulated error
// Done
```

## Common Pitfalls

### Pitfall 1: Using dematerialize on a non-Notification stream
`dematerialize` expects each emitted value to be a `Notification` object. Using it on a plain value stream will produce unexpected results or runtime errors.

```typescript
import { of, dematerialize } from 'rxjs';

// ❌ Source does not emit Notification objects
of(1, 2, 3).pipe(
  dematerialize() as any // TypeScript will catch this at compile time
).subscribe({
  error: err => console.error('Runtime error:', err)
});

// ✅ Use dematerialize only after materialize or when you have Notification objects
import { materialize } from 'rxjs';
of(1, 2, 3).pipe(
  materialize(),
  dematerialize()
).subscribe(val => console.log(val));
```

### Pitfall 2: Forgetting that error Notifications cause the output stream to error
A `Notification` with `kind: 'E'` will cause the output Observable to error, not just emit a value. Filter these out with `materialize`/`filter` if you want to swallow errors.

```typescript
import { from, Notification, dematerialize } from 'rxjs';

const notifications: Notification<number>[] = [
  Notification.createNext(1),
  Notification.createError(new Error('boom')),
  Notification.createNext(2), // this will not be reached
];

// ❌ The error notification terminates the stream
from(notifications).pipe(
  dematerialize()
).subscribe({
  next: val => console.log(val),      // prints: 1
  error: err => console.error(err.message) // prints: boom — stream ends here
});
```

## Related Operators
- **`materialize`**: The inverse of `dematerialize`; wraps emissions into `Notification` objects.
- **`catchError`**: Handles errors at the Observable level without needing to materialize/dematerialize.
- **`tap`**: Observe notifications for side effects without converting the stream.
