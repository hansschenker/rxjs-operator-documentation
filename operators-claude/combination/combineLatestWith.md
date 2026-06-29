# combineLatestWith

## Brief Description
`combineLatestWith` combines the source Observable with one or more other Observables and emits an array of their latest values whenever any of them emits. The combined Observable only begins emitting once every input Observable has emitted at least one value. This operator is the pipeable counterpart to the `combineLatest` creation function, making it ergonomic to use in a pipe chain when the Observables to combine are known ahead of time.

## Category
combination

## Import
```typescript
import { combineLatestWith } from 'rxjs';
```

## Signature
```typescript
combineLatestWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, Cons<T, A>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...otherSources` | `ObservableInputTuple<A>` | One or more Observables (or values that can be converted to Observables) to combine with the source. |

## Return Type
An `OperatorFunction` that produces an Observable emitting a tuple (typed array) containing the latest value from the source as the first element, followed by the latest values from each of the provided Observables in order.

## Marble Diagram
```
source$:  --1---------3----4------>
other$:   -----2-----------5------>

result$:  -----[1,2]--[3,2]-[3,5]-[4,5]-->
          (emits when any input emits, after all have emitted at least once)
```

## Examples

### Example 1: Combining a search term with filter options
```typescript
import { fromEvent, combineLatestWith } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';

const searchInput = document.querySelector('#search') as HTMLInputElement;
const categorySelect = document.querySelector('#category') as HTMLSelectElement;

const searchTerm$ = fromEvent(searchInput, 'input').pipe(
  map((e) => (e.target as HTMLInputElement).value),
  debounceTime(300),
  startWith('')
);

const selectedCategory$ = fromEvent(categorySelect, 'change').pipe(
  map((e) => (e.target as HTMLSelectElement).value),
  startWith('all')
);

searchTerm$.pipe(
  combineLatestWith(selectedCategory$)
).subscribe(([term, category]) => {
  console.log(`Searching for "${term}" in category: ${category}`);
  // Trigger API call with both values
});
```

### Example 2: Combining user settings with theme data
```typescript
import { BehaviorSubject, combineLatestWith } from 'rxjs';
import { map } from 'rxjs/operators';

const userPreferences$ = new BehaviorSubject({ fontSize: 14, language: 'en' });
const themeMode$ = new BehaviorSubject<'light' | 'dark'>('light');
const accentColor$ = new BehaviorSubject('#007bff');

userPreferences$.pipe(
  combineLatestWith(themeMode$, accentColor$),
  map(([prefs, theme, accent]) => ({
    ...prefs,
    theme,
    accent
  }))
).subscribe(appConfig => {
  console.log('App config updated:', appConfig);
  applyConfig(appConfig);
});

function applyConfig(config: object) {
  console.log('Applying config:', config);
}

// Simulate user changing theme
themeMode$.next('dark');
// Output: App config updated: { fontSize: 14, language: 'en', theme: 'dark', accent: '#007bff' }
```

### Example 3: Combining geolocation with map zoom level
```typescript
import { interval, BehaviorSubject, combineLatestWith } from 'rxjs';
import { map, take } from 'rxjs/operators';

// Simulate GPS updates every 2 seconds
const gpsPosition$ = interval(2000).pipe(
  map((i) => ({ lat: 51.5 + i * 0.001, lng: -0.1 + i * 0.001 })),
  take(5)
);

const mapZoom$ = new BehaviorSubject(12);

gpsPosition$.pipe(
  combineLatestWith(mapZoom$)
).subscribe(([position, zoom]) => {
  console.log(`Rendering map at zoom ${zoom}:`, position);
  // Re-render map tile
});

// Simulate user zooming in
setTimeout(() => mapZoom$.next(15), 3000);
```

## Common Pitfalls

### Pitfall 1: Not seeding Observables with an initial value
If any of the combined Observables has not yet emitted, no output is produced. Use `startWith` or `BehaviorSubject` to ensure an initial value.

```typescript
import { Subject, combineLatestWith } from 'rxjs';
import { startWith } from 'rxjs/operators';

const a$ = new Subject<number>();
const b$ = new Subject<number>();

// ❌ No output until BOTH a$ and b$ have emitted
a$.pipe(
  combineLatestWith(b$)
).subscribe(console.log);
a$.next(1); // Nothing logged yet

// ✅ Use startWith to provide an initial value
a$.pipe(
  startWith(0),
  combineLatestWith(b$.pipe(startWith(0)))
).subscribe(console.log); // Logs [0, 0] immediately
```

### Pitfall 2: Confusing combineLatestWith with zipWith
`combineLatestWith` emits the *latest* value from each source on every emission, not paired by index. If you need strict index-based pairing, use `zipWith`.

```typescript
import { of, combineLatestWith, zipWith } from 'rxjs';

const source$ = of(1, 2, 3);
const other$ = of('a', 'b', 'c');

// ❌ Unexpected: combineLatestWith replays the latest value
source$.pipe(
  combineLatestWith(other$)
).subscribe(console.log);
// [3, 'a'], [3, 'b'], [3, 'c']  — not paired by index!

// ✅ Use zipWith for index-based pairing
source$.pipe(
  zipWith(other$)
).subscribe(console.log);
// [1, 'a'], [2, 'b'], [3, 'c']
```

## Related Operators
- **`combineLatest`**: Static creation function; use when all Observables to combine are known upfront and you are not already in a pipe chain.
- **`combineLatestAll`**: Used when the Observables to combine are emitted dynamically by a higher-order Observable.
- **`withLatestFrom`**: Only emits when the *source* emits, sampling the latest value from the other Observables rather than reacting to all of them.
- **`zipWith`**: Pairs values strictly by emission index; use when you need 1-to-1 correspondence.
- **`forkJoin`**: Emits only once when all source Observables complete, useful for parallel one-shot operations.
