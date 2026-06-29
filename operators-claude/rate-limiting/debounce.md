# debounce

## Brief Description
`debounce` delays emissions from the source observable, discarding prior values when new ones arrive before the silence window closes. Unlike `debounceTime`, the silence duration is determined by a factory function that returns an observable — making it dynamic and reactive. Its primary use case is rate-limiting user input or any event stream where only the final emission after a burst of activity is meaningful, but the suppression window needs to vary based on runtime conditions.

## Category
rate-limiting

## Import
```typescript
import { debounce } from 'rxjs';
```

## Signature
```typescript
debounce<T>(durationSelector: (value: T) => ObservableInput<any>): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `durationSelector` | `(value: T) => ObservableInput<any>` | A function that receives each source value and returns an observable or promise. The source value is emitted only after this inner observable emits or completes without being superseded by a new source value. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable that emits the same type as the source, but only when the inner observable produced by `durationSelector` fires without being cancelled by a newer source emission.

## Marble Diagram
```
Source:   --a--b--------c--d--d--------e--|
          debounce(() => timer(30ms))
Output:   -----------b--------d-----------e--|

Explanation:
- 'a' is suppressed because 'b' arrives before its timer fires
- 'b' passes through after 30ms of silence
- 'c' is suppressed because 'd' arrives before its timer fires
- The second 'd' passes through after 30ms of silence
- 'e' passes through at completion
```

## Examples

### Example 1: Dynamic debounce based on input length
```typescript
import { fromEvent, timer } from 'rxjs';
import { debounce, map } from 'rxjs';

const searchInput = document.getElementById('search') as HTMLInputElement;

// Short query → wait longer (user likely still typing);
// Long query → wait less (probably more deliberate)
const search$ = fromEvent<InputEvent>(searchInput, 'input').pipe(
  map(event => (event.target as HTMLInputElement).value),
  debounce(query => timer(query.length < 3 ? 600 : 300))
);

search$.subscribe(query => {
  console.log('Searching for:', query);
});
```

### Example 2: Debounce until a loading indicator hides
```typescript
import { Subject, BehaviorSubject } from 'rxjs';
import { debounce, filter } from 'rxjs';

const clicks$ = new Subject<string>();
const isLoading$ = new BehaviorSubject<boolean>(false);

// Delay the next action until the loading state resolves
const action$ = clicks$.pipe(
  debounce(() => isLoading$.pipe(filter(loading => !loading)))
);

action$.subscribe(action => console.log('Executing action:', action));

isLoading$.next(true);
clicks$.next('save');
clicks$.next('save'); // only this one will fire, after loading stops
setTimeout(() => isLoading$.next(false), 500);
```

### Example 3: Debounce with a promise-based duration
```typescript
import { fromEvent } from 'rxjs';
import { debounce, map } from 'rxjs';

const btn = document.getElementById('submit') as HTMLButtonElement;

const clicks$ = fromEvent(btn, 'click').pipe(
  map((_, index) => index),
  // Uses a promise as the duration — resolves after a microtask
  debounce(() => new Promise<void>(resolve => setTimeout(resolve, 400)))
);

clicks$.subscribe(clickIndex => {
  console.log('Final click index in burst:', clickIndex);
});
```

## Common Pitfalls

### Pitfall 1: Forgetting that `durationSelector` receives each value
The factory is called with the **current source value**, not a constant. Ignoring the value when you need dynamic behavior produces a static debounce indistinguishable from `debounceTime`.

```typescript
// ❌ Ignores the value — same as debounceTime(300)
debounce(() => timer(300))

// ✅ Uses the value to compute a meaningful duration
debounce((value: string) => timer(value.length > 10 ? 100 : 500))
```

### Pitfall 2: Returning a never-completing observable
If `durationSelector` returns an observable that never emits, the source value is silently swallowed forever.

```typescript
import { NEVER } from 'rxjs';

// ❌ Source values are lost — the gate never opens
debounce(() => NEVER)

// ✅ Ensure the inner observable eventually emits
debounce(() => timer(300))
```

## Related Operators
- **`debounceTime`**: Convenience wrapper for `debounce` with a fixed millisecond delay; prefer it when the duration is constant.
- **`throttle`**: Emits the first value in a window then suppresses; `debounce` emits the *last* value after a quiet period.
- **`auditTime`** / **`audit`**: Similar to throttle but emits the most recent value at the end of a fixed or dynamic window, regardless of when the first value arrived.
- **`sample`**: Emits the most recent source value whenever a separate notifier observable fires, rather than on a timer tied to source activity.
