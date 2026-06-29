# switchAll

## Brief Description
`switchAll` subscribes to the most recently emitted higher-order (inner) Observable, unsubscribing from the previous one whenever a new inner Observable arrives. It flattens a stream of Observables by always following the latest one, discarding any still-active previous inner Observable. This makes it ideal for scenarios like "always show the result of the latest search query" where older in-flight results are irrelevant once a newer one has been initiated.

## Category
higher-order

## Import
```typescript
import { switchAll } from 'rxjs';
```

## Signature
```typescript
switchAll<O extends ObservableInput<any>>(): OperatorFunction<O, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| *(none)* | — | `switchAll` takes no parameters. The source Observable must emit `ObservableInput` values (Observables, Promises, arrays, etc.). |

## Return Type
An `Observable<ObservedValueOf<O>>` that emits values from the most recently received inner Observable, switching away from (and unsubscribing from) previous ones as new ones arrive.

## Marble Diagram
```
Source (higher-order):   --A--------B------C--------|
                           |         |      |
A inner:                   a--a--a--a--a...
B inner:                             b--b--b--b...
C inner:                                    c--c--c--|

switchAll()
Output:                  --a--a--a--b--b---c--c--c--|
                                    ^ B arrives, A unsubscribed
                                           ^ C arrives, B unsubscribed
```

## Examples

### Example 1: Live Search — Always Use the Latest Query
```typescript
import { fromEvent, map, debounceTime, switchAll } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const searchInput = document.getElementById('search') as HTMLInputElement;

fromEvent(searchInput, 'input').pipe(
  debounceTime(300),
  map((event) => {
    const query = (event.target as HTMLInputElement).value;
    return ajax.getJSON<string[]>(`/api/search?q=${encodeURIComponent(query)}`);
  }),
  switchAll() // cancel previous request when a new one is mapped
).subscribe({
  next: (results) => console.log('Search results:', results),
  error: (err) => console.error('Search error:', err)
});
```

### Example 2: Switching Between Tab Content Streams
```typescript
import { Subject, switchAll, map, interval, take } from 'rxjs';

const tabClick$ = new Subject<'home' | 'news' | 'profile'>();

const contentStream = (tab: string) =>
  interval(1000).pipe(
    take(5),
    map((i) => `${tab} update #${i + 1}`)
  );

tabClick$.pipe(
  map((tab) => contentStream(tab)),
  switchAll() // unsubscribe from previous tab's stream when tab changes
).subscribe((content) => console.log('Content:', content));

tabClick$.next('home');     // Start home updates
setTimeout(() => tabClick$.next('news'), 2500);    // Switch to news at 2.5s
setTimeout(() => tabClick$.next('profile'), 4200); // Switch to profile at 4.2s
```

### Example 3: Reacting to the Latest Configuration Observable
```typescript
import { BehaviorSubject, switchAll, map, interval, take } from 'rxjs';

interface Config {
  pollInterval: number;
  endpoint: string;
}

const config$ = new BehaviorSubject<Config>({ pollInterval: 1000, endpoint: '/api/v1' });

const pollingStream = (config: Config) =>
  interval(config.pollInterval).pipe(
    take(10),
    map((i) => `${config.endpoint}/data?tick=${i}`)
  );

// Whenever config changes, switch to a new polling stream
config$.pipe(
  map((config) => pollingStream(config)),
  switchAll()
).subscribe((url) => console.log('Polling:', url));

// Update config after 3s — previous polling stream is cancelled
setTimeout(() => {
  config$.next({ pollInterval: 500, endpoint: '/api/v2' });
}, 3000);
```

## Common Pitfalls

### Pitfall 1: Source Must Emit Observables (Not Plain Values)
`switchAll` expects the source Observable to emit `ObservableInput` values. Piping it onto a plain value stream results in an error or no emissions.

```typescript
import { of, switchAll } from 'rxjs';

// ❌ Source emits numbers, not Observables — will not work as intended
of(1, 2, 3).pipe(
  switchAll() // TypeScript error: number is not ObservableInput
).subscribe(console.log);

// ✅ Map values to Observables first, then switchAll
import { map } from 'rxjs';
of(1, 2, 3).pipe(
  map((n) => of(n * 10)),
  switchAll()
).subscribe(console.log); // Logs: 10, 20, 30
```

### Pitfall 2: Dropped Emissions When Inner Observables Are Slow to Complete
If you need all inner Observable results (not just the latest), `switchAll` is the wrong choice — it discards in-flight inner Observables.

```typescript
import { from, map, switchAll, mergeAll } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const ids = [1, 2, 3];

// ❌ Only the last request result may be received; earlier ones are cancelled
from(ids).pipe(
  map((id) => ajax.getJSON(`/api/item/${id}`)),
  switchAll()
).subscribe(console.log);

// ✅ Use mergeAll (or mergeMap) to keep all concurrent requests
from(ids).pipe(
  map((id) => ajax.getJSON(`/api/item/${id}`)),
  mergeAll()
).subscribe(console.log);
```

## Related Operators
- **`switchMap`**: Combines the projection and flattening steps of `map` + `switchAll` in one operator.
- **`switchMapTo`**: Deprecated; like `switchMap` but with a fixed inner Observable.
- **`mergeAll`**: Like `switchAll` but keeps all inner Observables active concurrently.
- **`concatAll`**: Like `switchAll` but queues inner Observables and processes them sequentially.
- **`exhaustAll`**: Like `switchAll` but ignores new inner Observables while one is active.
