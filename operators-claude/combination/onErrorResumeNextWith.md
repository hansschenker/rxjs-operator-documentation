# onErrorResumeNextWith

## Brief Description
`onErrorResumeNextWith` subscribes to the source Observable and, if it errors or completes, immediately and silently moves on to subscribe to the next provided Observable — ignoring errors entirely. It continues through the provided Observables in order, always moving forward regardless of whether the previous Observable completed normally or with an error. This operator is useful for resilient sequential workflows where you want best-effort processing and failures should be skipped rather than propagated.

## Category
combination

## Import
```typescript
import { onErrorResumeNextWith } from 'rxjs';
```

## Signature
```typescript
onErrorResumeNextWith<T, A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...sources` | `ObservableInputTuple<A>` | One or more Observables to subscribe to sequentially after the source Observable completes or errors. Errors in any Observable in the chain are silently swallowed. |

## Return Type
An `OperatorFunction` that returns an Observable emitting values from each source in sequence, silently ignoring any errors and moving to the next source. The result Observable completes after all sources have been exhausted.

## Marble Diagram
```
source$:  --1--2--X            (source errors at X)
other1$:       ---3--4--X      (other1 also errors, but error is swallowed)
other2$:              ---5--6--|

result$:  --1--2-----3--4----5--6--|  (errors silently skipped, chain continues)
```

## Examples

### Example 1: Trying multiple data sources, falling through on failure
```typescript
import { throwError, of, onErrorResumeNextWith } from 'rxjs';
import { delay } from 'rxjs/operators';

// Primary source fails
const primarySource$ = throwError(() => new Error('Primary DB unavailable'));

// Fallback sources
const cacheSource$ = of('Cached data (stale)').pipe(delay(100));
const defaultSource$ = of('Default placeholder data');

primarySource$.pipe(
  onErrorResumeNextWith(cacheSource$, defaultSource$)
).subscribe({
  next: (value) => console.log('Got value:', value),
  complete: () => console.log('All sources exhausted')
});
// Got value: Cached data (stale)
// Got value: Default placeholder data
// All sources exhausted
// Note: primary error was silently ignored
```

### Example 2: Processing a batch of files, skipping failures
```typescript
import { from, of, onErrorResumeNextWith, defer } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt'];

// Simulate file processing where some files fail
const processFile = (filename: string) => {
  if (filename === 'file2.txt' || filename === 'file3.txt') {
    return throwError(() => new Error(`Failed to process ${filename}`));
  }
  return of(`Processed: ${filename}`);
};

// Process files in sequence, skipping failures
const [first, ...rest] = files.map(processFile);

first.pipe(
  onErrorResumeNextWith(...rest)
).subscribe({
  next: (result) => console.log(result),
  complete: () => console.log('Batch complete')
});
// Processed: file1.txt
// (file2.txt error silently skipped)
// (file3.txt error silently skipped)
// Processed: file4.txt
// Batch complete
```

### Example 3: Resilient startup sequence that ignores non-critical failures
```typescript
import { of, throwError, onErrorResumeNextWith } from 'rxjs';
import { tap, delay, catchError } from 'rxjs/operators';

const loadUserPreferences$ = of({ theme: 'dark', lang: 'en' }).pipe(
  delay(200),
  tap(() => console.log('Preferences loaded'))
);

// Analytics init fails, but we want to continue
const initAnalytics$ = throwError(() => new Error('Analytics service down')).pipe(
  tap(() => console.log('Analytics initialized')) // never reached
);

const startApp$ = of('App ready').pipe(
  tap((msg) => console.log(msg))
);

loadUserPreferences$.pipe(
  onErrorResumeNextWith(initAnalytics$, startApp$)
).subscribe({
  next: (v) => console.log('Value:', v),
  complete: () => console.log('Startup complete')
});
// Value: { theme: 'dark', lang: 'en' }  (after 200ms)
// Preferences loaded
// (analytics error silently ignored)
// Value: App ready
// Startup complete
```

## Common Pitfalls

### Pitfall 1: Errors are completely silent — debugging becomes difficult
`onErrorResumeNextWith` swallows all errors without any notification to the subscriber. This can make it very hard to detect or diagnose problems in production.

```typescript
import { throwError, of, onErrorResumeNextWith } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// ❌ Errors vanish with no trace
throwError(() => new Error('Silent failure')).pipe(
  onErrorResumeNextWith(of('fallback'))
).subscribe({
  next: console.log,   // 'fallback'
  error: console.error // NEVER called
});

// ✅ Log errors before they are swallowed using tap + catchError on each source
const logAndContinue = <T>(source$: import('rxjs').Observable<T>, label: string) =>
  source$.pipe(
    catchError((err) => {
      console.warn(`[${label}] Error suppressed:`, err.message);
      return throwError(() => err); // re-throw so onErrorResumeNextWith moves on
    })
  );

logAndContinue(throwError(() => new Error('oops')), 'primary').pipe(
  onErrorResumeNextWith(of('fallback'))
).subscribe(console.log);
// [primary] Error suppressed: oops
// fallback
```

### Pitfall 2: Not to be confused with catchError for single-source recovery
`onErrorResumeNextWith` is designed for a *chain of sources* where all errors are skipped. If you want to handle errors from a single source and recover gracefully, `catchError` is more appropriate and gives you control over the error.

```typescript
import { throwError, of, onErrorResumeNextWith } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ❌ onErrorResumeNextWith — you lose error context entirely
throwError(() => new Error('fetch failed')).pipe(
  onErrorResumeNextWith(of('default'))
).subscribe(console.log); // 'default' — no idea what went wrong

// ✅ catchError — handle error with context and return fallback
throwError(() => new Error('fetch failed')).pipe(
  catchError((err) => {
    console.error('Handled error:', err.message);
    return of('default');
  })
).subscribe(console.log);
// Handled error: fetch failed
// default
```

## Related Operators
- **`onErrorResumeNext`**: Static creation function; use when you have multiple sources upfront and no existing pipe chain.
- **`catchError`**: Handles errors from the source with full access to the error object; use for single-source recovery with context.
- **`retry` / `retryWhen`**: Retries the failing Observable rather than moving on to a different one.
- **`concatWith`**: Sequential combination without error suppression; use when you want errors to propagate normally.
- **`iif`**: Conditional subscription to one of two Observables; use when the choice of source depends on a condition rather than error state.
