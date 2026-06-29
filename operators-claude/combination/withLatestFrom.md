# withLatestFrom

## Brief Description
`withLatestFrom` combines the source Observable with one or more other Observables, but only emits when the *source* Observable emits. At the moment of each source emission, it samples the most recent value from each other Observable and combines them into an array (or passes them through an optional projection function). This is different from `combineLatestWith`, which emits whenever *any* Observable emits. Use `withLatestFrom` when you want to enrich source events with context data without the context data driving new emissions.

## Category
combination

## Import
```typescript
import { withLatestFrom } from 'rxjs';
```

## Signature
```typescript
// Overloads (simplified)
withLatestFrom<T, O extends ObservableInput<any>>(
  ...inputs: [...ObservableInputTuple<O>]
): OperatorFunction<T, [T, ...ObservedValueTupleFrom<O>]>

withLatestFrom<T, O extends ObservableInput<any>, R>(
  ...inputsAndProject: [...ObservableInputTuple<O>, (...values: [T, ...ObservedValueOf<O>[]]) => R]
): OperatorFunction<T, R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...inputs` | `ObservableInputTuple` | One or more Observables to sample when the source emits. The latest value from each is taken at the time of the source emission. |
| `project` (optional) | `(...values) => R` | An optional projection function applied to the source value plus the sampled values to produce the output. |

## Return Type
An `OperatorFunction` that returns an Observable that emits only when the source emits. Each emission is either a tuple of `[sourceValue, ...sampledValues]` or the result of the optional projection function.

## Marble Diagram
```
source$:  ------A-----------B---------C-------->
other$:   --1------2---3-----------4----------->

result$:  ------[A,1]-------[B,3]---[C,4]------>
          (only emits when source$ emits, sampling latest from other$)
          (if other$ hasn't emitted yet when source emits, nothing is output)
```

## Examples

### Example 1: Enriching click events with current form state
```typescript
import { fromEvent, BehaviorSubject, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';

const submitBtn = document.querySelector('#submit') as HTMLButtonElement;

const formState$ = new BehaviorSubject({
  username: '',
  email: '',
  agreed: false
});

// Form fields update formState$ on every change
// (setup omitted for brevity)

const clicks$ = fromEvent(submitBtn, 'click');

clicks$.pipe(
  withLatestFrom(formState$),
  map(([_click, formData]) => formData)
).subscribe(formData => {
  if (formData.agreed) {
    console.log('Submitting:', formData);
  } else {
    console.log('Must agree to terms!');
  }
});
```

### Example 2: Adding authentication context to API requests
```typescript
import { Subject, BehaviorSubject, withLatestFrom } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';

interface AuthState {
  token: string | null;
  userId: string | null;
}

const apiRequest$ = new Subject<{ endpoint: string; body: object }>();
const authState$ = new BehaviorSubject<AuthState>({ token: 'abc123', userId: 'user-1' });

apiRequest$.pipe(
  withLatestFrom(authState$),
  switchMap(([request, auth]) => {
    if (!auth.token) {
      throw new Error('Not authenticated');
    }
    console.log(`POST ${request.endpoint} as user ${auth.userId}`);
    // Simulated HTTP call with auth header
    return of({ success: true, userId: auth.userId });
  })
).subscribe(response => console.log('Response:', response));

apiRequest$.next({ endpoint: '/api/posts', body: { title: 'Hello World' } });
// POST /api/posts as user user-1
// Response: { success: true, userId: 'user-1' }
```

### Example 3: Combining a timer tick with current sensor readings
```typescript
import { interval, BehaviorSubject, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';

const temperature$ = new BehaviorSubject(20.5);
const humidity$ = new BehaviorSubject(55);

// Simulate sensor updates
setInterval(() => temperature$.next(20 + Math.random() * 5), 800);
setInterval(() => humidity$.next(50 + Math.random() * 20), 1200);

// Log a snapshot every 3 seconds
interval(3000).pipe(
  withLatestFrom(temperature$, humidity$),
  map(([tick, temp, hum]) => ({
    timestamp: new Date().toISOString(),
    temperature: temp.toFixed(1),
    humidity: hum.toFixed(0)
  }))
).subscribe(snapshot => {
  console.log('Sensor snapshot:', snapshot);
});
```

## Common Pitfalls

### Pitfall 1: Other Observables must have emitted before the source emits, or emissions are silently dropped
If the source emits before any of the other Observables have produced a value, that source emission is silently ignored. This is unlike `combineLatestWith` which simply waits. Use `startWith` or `BehaviorSubject` to ensure an initial value.

```typescript
import { Subject, withLatestFrom, startWith } from 'rxjs';

const trigger$ = new Subject<string>();
const context$ = new Subject<number>();

// ❌ First trigger emission is dropped because context$ hasn't emitted
trigger$.pipe(
  withLatestFrom(context$)
).subscribe(console.log);

trigger$.next('first'); // Silently dropped — context$ has no value yet
context$.next(100);
trigger$.next('second'); // ['second', 100] — this one works

// ✅ Seed context$ with an initial value
trigger$.pipe(
  withLatestFrom(context$.pipe(startWith(0)))
).subscribe(console.log);
trigger$.next('first'); // ['first', 0]
```

### Pitfall 2: Confusing withLatestFrom with combineLatestWith
`withLatestFrom` emits only when the *source* emits. `combineLatestWith` emits whenever *any* input emits. Using `combineLatestWith` when you mean `withLatestFrom` causes spurious emissions triggered by context changes.

```typescript
import { interval, BehaviorSubject, withLatestFrom, combineLatestWith } from 'rxjs';
import { take } from 'rxjs/operators';

const tick$ = interval(1000).pipe(take(3));
const config$ = new BehaviorSubject({ pageSize: 10 });

// ❌ combineLatestWith: ALSO fires when config changes — may cause unintended API calls
tick$.pipe(
  combineLatestWith(config$)
).subscribe(([tick, config]) => console.log('combineLatest:', tick, config));

config$.next({ pageSize: 20 }); // triggers an extra emission!

// ✅ withLatestFrom: only fires on tick — config is just context
tick$.pipe(
  withLatestFrom(config$)
).subscribe(([tick, config]) => console.log('withLatestFrom:', tick, config));

config$.next({ pageSize: 20 }); // NO extra emission
```

## Related Operators
- **`combineLatestWith`**: Emits whenever any input emits; use when changes to context Observables should also trigger output.
- **`zipWith`**: Pairs values by index rather than by latest; each source value is consumed exactly once.
- **`switchMap`**: Useful when the context Observable should determine a new inner Observable rather than just provide a snapshot value.
- **`sample`**: Takes a value from the source when a separate notifier Observable emits, without adding context from other streams.
- **`audit` / `throttleTime`**: Rate-limiting alternatives when you want to control emission frequency.
