# startWith

## Brief Description
`startWith` prepends one or more synchronous values to the beginning of the source Observable's emission sequence. The provided values are emitted immediately upon subscription, before any values from the source Observable arrive. This is commonly used to provide initial state, seed a `combineLatest` or `combineLatestWith` so it emits right away, or display a loading/default state before real data arrives.

## Category
combination

## Import
```typescript
import { startWith } from 'rxjs';
```

## Signature
```typescript
startWith<T, A extends readonly unknown[]>(
  ...values: A
): OperatorFunction<T, T | A[number]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...values` | `A` | One or more synchronous values to emit before the source Observable begins emitting. Multiple values are emitted in the order provided. |

## Return Type
An `OperatorFunction` that returns an Observable that synchronously emits all provided values in order, then subscribes to and mirrors the source Observable.

## Marble Diagram
```
source$:  ----1----2----3--->     (source emits 1, 2, 3)
startWith(0):

result$:  0---1----2----3--->     (0 emitted synchronously on subscription)
```

## Examples

### Example 1: Providing initial state for a BehaviorSubject-like stream
```typescript
import { fromEvent, startWith } from 'rxjs';
import { map, scan } from 'rxjs/operators';

const incrementBtn = document.querySelector('#increment') as HTMLButtonElement;

const count$ = fromEvent(incrementBtn, 'click').pipe(
  scan((count) => count + 1, 0),
  startWith(0) // Emit 0 immediately so the UI renders before any click
);

count$.subscribe(count => {
  const el = document.querySelector('#counter')!;
  el.textContent = `Count: ${count}`;
});
// UI shows "Count: 0" immediately, then increments on each click
```

### Example 2: Seeding combineLatestWith so it emits immediately
```typescript
import { BehaviorSubject, fromEvent, combineLatestWith, startWith } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';

const searchInput = document.querySelector('#search') as HTMLInputElement;
const activeOnly$ = new BehaviorSubject(false);

const searchTerm$ = fromEvent(searchInput, 'input').pipe(
  map((e) => (e.target as HTMLInputElement).value),
  debounceTime(300),
  startWith('') // Without this, combineLatestWith won't emit until user types
);

searchTerm$.pipe(
  combineLatestWith(activeOnly$)
).subscribe(([term, activeOnly]) => {
  console.log(`Searching: "${term}", active only: ${activeOnly}`);
});
// Logs immediately with ['', false] then updates on user interaction
```

### Example 3: Showing a loading state before data arrives
```typescript
import { of, startWith } from 'rxjs';
import { delay, map } from 'rxjs/operators';

interface AppState {
  loading: boolean;
  data: string[] | null;
  error: string | null;
}

// Simulate async data fetch
const fetchUsers$ = of(['Alice', 'Bob', 'Carol']).pipe(
  delay(1500),
  map((users): AppState => ({ loading: false, data: users, error: null }))
);

const loadingState: AppState = { loading: true, data: null, error: null };

fetchUsers$.pipe(
  startWith(loadingState)
).subscribe(state => {
  if (state.loading) {
    console.log('Showing spinner...');
  } else {
    console.log('Data loaded:', state.data);
  }
});
// Showing spinner... (immediately)
// Data loaded: ['Alice', 'Bob', 'Carol'] (after 1500ms)
```

## Common Pitfalls

### Pitfall 1: startWith values are emitted synchronously — be careful with side effects
The prepended values are emitted during subscription, before the observable is fully set up downstream in some architectures. This is usually fine but can cause issues if subscribers expect asynchronous initialization.

```typescript
import { of, startWith } from 'rxjs';
import { tap } from 'rxjs/operators';

let sideEffect = 0;

// ❌ Unexpected: side effect runs synchronously during subscription setup
const obs$ = of(1, 2, 3).pipe(
  startWith(0),
  tap(() => sideEffect++)
);
console.log('Before subscribe, sideEffect:', sideEffect); // 0
obs$.subscribe();
console.log('After subscribe, sideEffect:', sideEffect); // 4 — ran synchronously

// ✅ If you need async startup, use defer or a Subject
import { defer } from 'rxjs';
const asyncStart$ = defer(() => of(0));
```

### Pitfall 2: Type widening when mixing types
When the `startWith` value type differs from the source type, TypeScript widens the result type to a union. This is often intentional (e.g., `null | User`) but can be surprising.

```typescript
import { of, startWith } from 'rxjs';

// ❌ Unintended type: Observable<string | null>
const data$ = of('real data').pipe(
  startWith(null)
);
// data$ is Observable<string | null> — downstream must handle null

// ✅ Make the intent explicit with a typed loading state
type LoadState = { status: 'loading' } | { status: 'loaded'; data: string };
const typed$ = of<LoadState>({ status: 'loaded', data: 'real data' }).pipe(
  startWith<LoadState>({ status: 'loading' })
);
```

## Related Operators
- **`endWith`**: Appends synchronous values to the end of the source Observable (the opposite direction).
- **`concatWith`**: Appends entire Observables (not just values) after the source completes.
- **`BehaviorSubject`**: An alternative when you need an observable that always has the latest value and replays it on subscription.
- **`defaultIfEmpty`**: Emits a default value only if the source completes without emitting anything.
- **`defer`**: Use when you need the initial value to be computed lazily at subscription time.
