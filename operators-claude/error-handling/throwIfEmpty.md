# throwIfEmpty

## Brief Description
`throwIfEmpty` monitors the source observable and, if it completes without having emitted any values, throws an error. This is useful when an empty stream represents a business logic failure — for example, when a required resource is expected to exist, or when a filter must match at least one item. By default it throws an `EmptyError`, but you can provide a factory to produce a custom error.

## Category
error-handling

## Import
```typescript
import { throwIfEmpty } from 'rxjs';
```

## Signature
```typescript
throwIfEmpty<T>(
  errorFactory?: () => any
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `errorFactory` | `() => any` | Optional. A zero-argument function that returns the error to throw when the source completes empty. Defaults to `() => new EmptyError()`. |

## Return Type
A `MonoTypeOperatorFunction<T>` — passes all source values through unchanged, but errors with the result of `errorFactory()` (or `EmptyError`) if the source completes without emitting.

## Marble Diagram
```
Source A (emits values):  --a--b--c--|    throwIfEmpty   --a--b--c--|
Source B (empty):         --|             throwIfEmpty   --#  (EmptyError)
Source C (errors first):  --#            throwIfEmpty   --#  (original error)
```

## Examples

### Example 1: Guard against an empty stream with the default EmptyError
```typescript
import { of, filter, throwIfEmpty } from 'rxjs';

const items = [1, 2, 3, 4, 5];

of(...items).pipe(
  filter(x => x > 10), // no items pass the filter
  throwIfEmpty()
).subscribe({
  next: v => console.log(v),
  error: err => console.error('Error:', err.name), // 'EmptyError'
});
```

### Example 2: Provide a custom error factory
```typescript
import { EMPTY, throwIfEmpty } from 'rxjs';

class ResourceNotFoundError extends Error {
  constructor(public readonly resourceId: string) {
    super(`Resource "${resourceId}" not found`);
    this.name = 'ResourceNotFoundError';
  }
}

const resourceId = 'user-42';

// Simulating a DB query that returns no rows
EMPTY.pipe(
  throwIfEmpty(() => new ResourceNotFoundError(resourceId))
).subscribe({
  next: row => console.log(row),
  error: (err: ResourceNotFoundError) => {
    console.error(`[${err.name}] ${err.message}`);
    // [ResourceNotFoundError] Resource "user-42" not found
  },
});
```

### Example 3: Combine with catchError for conditional fallback
```typescript
import { of, filter, throwIfEmpty, catchError, EMPTY } from 'rxjs';

const results$ = of(10, 20, 30).pipe(
  filter(x => x > 100),          // always empty
  throwIfEmpty(() => new Error('No results matched the criteria')),
  catchError(err => {
    console.warn('Caught:', err.message);
    // Return a safe default instead of propagating the error
    return of(-1);
  })
);

results$.subscribe({
  next: v => console.log('Result:', v),   // Result: -1
  complete: () => console.log('Done'),
});
```

## Common Pitfalls

### Pitfall 1: Confusing source errors with empty-stream errors
`throwIfEmpty` only fires when the source *completes cleanly with no emissions*. If the source errors before emitting, the original error is forwarded as-is.

```typescript
import { throwError, throwIfEmpty } from 'rxjs';

// ❌ Mistaken expectation — throwIfEmpty does NOT run when source errors
throwError(() => new Error('source error')).pipe(
  throwIfEmpty(() => new Error('empty error'))
).subscribe({
  error: err => console.error(err.message), // 'source error', not 'empty error'
});

// ✅ Use catchError alongside throwIfEmpty for full coverage
import { EMPTY, catchError } from 'rxjs';
EMPTY.pipe(
  throwIfEmpty(() => new Error('empty')),
  catchError(err => { console.error(err.message); return EMPTY; })
).subscribe();
```

### Pitfall 2: The errorFactory is only called once, on completion
The factory is not called for each subscription — it runs once when the stream completes empty. Avoid producing global side effects inside the factory.

```typescript
// ❌ Side-effectful factory — runs once per empty completion, not per value
source$.pipe(
  throwIfEmpty(() => {
    trackAnalyticsEvent('empty-stream'); // called every time source completes empty
    return new EmptyError();
  })
);

// ✅ Log side effects in the error handler instead
source$.pipe(
  throwIfEmpty()
).subscribe({
  error: err => {
    if (err.name === 'EmptyError') trackAnalyticsEvent('empty-stream');
  },
});
```

## Related Operators
- **`catchError`**: Intercepts errors emitted by `throwIfEmpty` (or any operator) for recovery.
- **`defaultIfEmpty`**: Emits a default value when the source is empty rather than throwing — a non-error alternative to `throwIfEmpty`.
- **`filter`**: Often used upstream of `throwIfEmpty` to enforce that at least one item passes a predicate.
- **`single`**: Throws if the source emits zero *or more than one* value matching a predicate.
