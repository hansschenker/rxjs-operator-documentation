# endWith

## Brief Description
`endWith` appends one or more synchronous values to the end of the source Observable's emission sequence, emitting them after the source Observable completes. This operator is the counterpart to `startWith` and is useful for adding a completion marker, a sentinel value, or a final status message after all source data has been processed.

## Category
combination

## Import
```typescript
import { endWith } from 'rxjs';
```

## Signature
```typescript
endWith<T, A extends readonly unknown[]>(
  ...values: A
): OperatorFunction<T, T | A[number]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...values` | `A` | One or more synchronous values to emit after the source Observable completes. Multiple values are emitted in the order provided before the result Observable completes. |

## Return Type
An `OperatorFunction` that returns an Observable that mirrors the source Observable and then emits the provided values synchronously before completing.

## Marble Diagram
```
source$:  --1----2----3--|         (source completes)
endWith('done'):

result$:  --1----2----3--done|     ('done' emitted synchronously after source completes)
```

## Examples

### Example 1: Adding a completion sentinel to a data stream
```typescript
import { of, endWith } from 'rxjs';

const records$ = of('record-1', 'record-2', 'record-3');

records$.pipe(
  endWith('END_OF_STREAM')
).subscribe(value => {
  if (value === 'END_OF_STREAM') {
    console.log('Processing complete, sending final batch...');
  } else {
    console.log('Processing:', value);
  }
});
// Processing: record-1
// Processing: record-2
// Processing: record-3
// Processing complete, sending final batch...
```

### Example 2: Tracking upload progress with a final state
```typescript
import { interval, endWith } from 'rxjs';
import { map, take } from 'rxjs/operators';

type UploadState =
  | { status: 'uploading'; progress: number }
  | { status: 'complete'; progress: 100 };

const uploadProgress$ = interval(500).pipe(
  take(5),
  map((i): UploadState => ({ status: 'uploading', progress: (i + 1) * 20 })),
  endWith<UploadState, [UploadState]>({ status: 'complete', progress: 100 })
);

uploadProgress$.subscribe(state => {
  if (state.status === 'uploading') {
    console.log(`Uploading: ${state.progress}%`);
  } else {
    console.log('Upload complete!');
  }
});
// Uploading: 20%
// Uploading: 40%
// Uploading: 60%
// Uploading: 80%
// Uploading: 100%
// Upload complete!
```

### Example 3: Combining startWith and endWith for lifecycle markers
```typescript
import { ajax } from 'rxjs/ajax';
import { startWith, endWith, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type StreamEvent =
  | { type: 'start' }
  | { type: 'data'; payload: unknown }
  | { type: 'end' };

// Wrap any data stream with lifecycle events
const wrapWithLifecycle = <T>(source$: import('rxjs').Observable<T>) =>
  source$.pipe(
    startWith<StreamEvent>({ type: 'start' }),
    endWith<StreamEvent>({ type: 'end' })
  );

const data$ = of({ type: 'data' as const, payload: { id: 1, name: 'Alice' } });

wrapWithLifecycle(data$).subscribe(event => {
  console.log('Event:', event);
});
// Event: { type: 'start' }
// Event: { type: 'data', payload: { id: 1, name: 'Alice' } }
// Event: { type: 'end' }
```

## Common Pitfalls

### Pitfall 1: endWith does not run if the source errors
If the source Observable errors, `endWith` values are NOT emitted. The error propagates directly. Use `finalize` if you need cleanup logic on both completion and error.

```typescript
import { throwError, of, endWith } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// ❌ endWith is skipped when the source errors
throwError(() => new Error('oops')).pipe(
  endWith('done')
).subscribe({
  next: console.log,  // 'done' is never logged
  error: (e) => console.error(e.message) // oops
});

// ✅ Use finalize for guaranteed teardown logic
throwError(() => new Error('oops')).pipe(
  endWith('done'),
  finalize(() => console.log('Finalized (always runs)'))
).subscribe({
  next: console.log,
  error: (e) => console.error(e.message)
});
```

### Pitfall 2: Type widening when appended values differ from source type
Like `startWith`, `endWith` widens the type when the appended value type differs from the source type. This is by design but requires downstream type handling.

```typescript
import { of, endWith } from 'rxjs';

// ❌ Result is Observable<number | string>, not Observable<number>
const nums$ = of(1, 2, 3).pipe(
  endWith('DONE') // widens to number | string
);

nums$.subscribe((v) => {
  // v: number | string — must check before numeric ops
  if (typeof v === 'number') {
    console.log(v * 2);
  } else {
    console.log(v);
  }
});

// ✅ Define a discriminated union type to make intent clear
type DataEvent = { kind: 'value'; n: number } | { kind: 'done' };
const typed$ = of<DataEvent>(
  { kind: 'value', n: 1 },
  { kind: 'value', n: 2 }
).pipe(
  endWith<DataEvent>({ kind: 'done' })
);
```

## Related Operators
- **`startWith`**: Prepends synchronous values to the beginning of the source Observable (the opposite direction).
- **`concatWith`**: Appends entire Observables (not just synchronous values) after the source completes.
- **`finalize`**: Runs a side-effect callback when the Observable terminates for any reason (complete or error); use for guaranteed teardown.
- **`last`**: Emits only the last value of the source before completion; useful when you only need the final emission.
- **`materialize` / `dematerialize`**: Converts emissions to `Notification` objects, providing another way to represent terminal events.
