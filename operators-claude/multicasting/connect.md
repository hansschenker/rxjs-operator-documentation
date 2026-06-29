# connect

## Brief Description
`connect` is a multicasting operator that gives you explicit, imperative control over a shared multicast subscription. It accepts a `selector` function that receives a `ConnectableObservable`-like `shared$` Observable (backed by a `Subject`) and returns an Observable built from that shared source. The operator subscribes to the selector's returned Observable and, crucially, starts multicasting the source only once — regardless of how many times `shared$` is subscribed to inside the selector. This makes it perfect for constructing complex pipelines where a single source emission needs to be sent down multiple independent branches (e.g., splitting, racing, or combining the same source with itself) without triggering multiple source subscriptions.

## Category
multicasting

## Import
```typescript
import { connect } from 'rxjs';
```

## Signature
```typescript
connect<T, O extends ObservableInput<unknown>>(
  selector: (shared: Observable<T>) => O,
  config?: ConnectConfig<T>
): OperatorFunction<T, ObservedValueOf<O>>
```

Where `ConnectConfig<T>` is:
```typescript
interface ConnectConfig<T> {
  connector: () => SubjectLike<T>;
}
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `(shared: Observable<T>) => ObservableInput<O>` | A function that receives the shared multicast Observable and returns the Observable to subscribe to. Use `shared` multiple times inside this function to create branches — all branches share one underlying source subscription. |
| `config` | `ConnectConfig<T>` | *(Optional)* Configuration object. |
| `config.connector` | `() => SubjectLike<T>` | Factory returning the Subject that multicasts the source. Defaults to `() => new Subject<T>()`. Supply a `ReplaySubject` factory here to replay values to branches that subscribe late within the selector. |

## Return Type
Returns an `OperatorFunction<T, ObservedValueOf<O>>`. The resulting Observable emits whatever the `selector` function's returned Observable emits. The source is subscribed to exactly once and its emissions are fanned out through the internal Subject to all usages of `shared` inside the selector.

## Marble Diagram
```
Source:       --1--2--3--4--5--|>

Inside selector, two branches derived from shared$:
  Branch A (filter even):  -----2-----4------|>
  Branch B (filter odd):   --1-----3-----5--|>

merge(A, B) output: --1--2--3--4--5--|>

Only ONE subscription to Source.
```

## Examples

### Example 1: Fan out a single source into two independent branches
```typescript
import { of, connect, filter, map, merge } from 'rxjs';

// Without connect, subscribing to both 'even$' and 'odd$' separately
// would create two subscriptions to the source.
const result$ = of(1, 2, 3, 4, 5).pipe(
  connect((shared$) => {
    const even$ = shared$.pipe(
      filter((n) => n % 2 === 0),
      map((n) => `even: ${n}`)
    );
    const odd$ = shared$.pipe(
      filter((n) => n % 2 !== 0),
      map((n) => `odd: ${n}`)
    );
    // merge both branches — one source subscription feeds both.
    return merge(even$, odd$);
  })
);

result$.subscribe(console.log);
// odd: 1
// even: 2
// odd: 3
// even: 4
// odd: 5
```

### Example 2: Partitioning a stream with side effects — proving one execution
```typescript
import { interval, connect, filter, map, merge, take, tap } from 'rxjs';

const source$ = interval(500).pipe(
  take(6),
  tap((v) => console.log(`[source tick] ${v}`)) // fires only once per emission
);

const combined$ = source$.pipe(
  connect((shared$) =>
    merge(
      shared$.pipe(
        filter((v) => v % 2 === 0),
        map((v) => ({ type: 'even', value: v }))
      ),
      shared$.pipe(
        filter((v) => v % 2 !== 0),
        map((v) => ({ type: 'odd', value: v }))
      )
    )
  )
);

combined$.subscribe(({ type, value }) =>
  console.log(`  -> ${type} branch received: ${value}`)
);

// Output — note [source tick] fires only once per tick:
// [source tick] 0
//   -> even branch received: 0
// [source tick] 1
//   -> odd branch received: 1
// ...
```

### Example 3: Using a custom connector to buffer values for a late branch
```typescript
import { of, connect, map, combineLatest, ReplaySubject } from 'rxjs';

// Some branches inside the selector may subscribe to shared$ after emissions
// have already begun (e.g., when nested inside a combineLatest). Using a
// ReplaySubject connector ensures those branches still get the buffered values.
const result$ = of(10, 20, 30).pipe(
  connect(
    (shared$) => {
      const doubled$ = shared$.pipe(map((v) => v * 2));
      const tripled$ = shared$.pipe(map((v) => v * 3));
      // combineLatest will subscribe to tripled$ slightly after doubled$;
      // the ReplaySubject connector ensures tripled$ doesn't miss earlier values.
      return combineLatest([doubled$, tripled$]);
    },
    {
      connector: () => new ReplaySubject<number>(1),
    }
  )
);

result$.subscribe(([d, t]) => console.log(`doubled=${d}, tripled=${t}`));
// doubled=20, tripled=30
// doubled=40, tripled=60
// doubled=60, tripled=90
```

## Common Pitfalls

### Pitfall 1: Subscribing to the source directly instead of using shared$
The entire point of `connect` is to subscribe to `shared$` (the multicasted version) inside the selector, not to the original source. Accidentally closing over the original source creates extra subscriptions.

```typescript
import { interval, connect, filter, merge, take, tap } from 'rxjs';

const source$ = interval(500).pipe(
  take(4),
  tap(() => console.log('[source]'))
);

// ❌ Subscribing to source$ inside the selector creates a SECOND subscription.
source$.pipe(
  connect((shared$) =>
    merge(
      shared$.pipe(filter((v) => v % 2 === 0)),
      source$.pipe(filter((v) => v % 2 !== 0)) // wrong — uses source$ not shared$
    )
  )
).subscribe();

// ✅ Always use shared$ for every branch inside the selector.
source$.pipe(
  connect((shared$) =>
    merge(
      shared$.pipe(filter((v) => v % 2 === 0)),
      shared$.pipe(filter((v) => v % 2 !== 0)) // correct
    )
  )
).subscribe();
```

### Pitfall 2: Forgetting that the default Subject has no buffer — synchronous race conditions
The default connector is a plain `Subject`. If one branch inside the selector subscribes synchronously after another, it may miss emissions that arrived before it subscribed. Use a `ReplaySubject` connector when branches have staggered subscription timing.

```typescript
import { of, connect, combineLatest, map, ReplaySubject } from 'rxjs';

const nums$ = of(1, 2, 3);

// ❌ combineLatest subscribes to the second branch after the first has already
// consumed emissions from the Subject — second branch may see nothing.
nums$.pipe(
  connect((shared$) =>
    combineLatest([
      shared$.pipe(map((v) => v * 2)),    // subscribes first
      shared$.pipe(map((v) => v * 10)),   // subscribes second, misses earlier values
    ])
  )
).subscribe(console.log);

// ✅ Provide a ReplaySubject so the late-subscribing branch gets buffered values.
nums$.pipe(
  connect(
    (shared$) =>
      combineLatest([
        shared$.pipe(map((v) => v * 2)),
        shared$.pipe(map((v) => v * 10)),
      ]),
    { connector: () => new ReplaySubject<number>(1) }
  )
).subscribe(([a, b]) => console.log(a, b));
// 2 10
// 4 20
// 6 30
```

### Pitfall 3: Confusing connect with the deprecated publish().connect() pattern
`connect` (the operator) is not the same as calling `.connect()` on a `ConnectableObservable`. The old imperative pattern required separate `publish()` and `.connect()` calls and is deprecated. The modern `connect` operator keeps everything inside a single composable pipeline.

```typescript
import { interval, publish, take } from 'rxjs';

// ❌ Deprecated imperative approach — avoid in new code.
const source$ = interval(500).pipe(take(4));
const connectable$ = source$.pipe(publish()) as any;
const sub1 = connectable$.subscribe((v: number) => console.log('A', v));
const sub2 = connectable$.subscribe((v: number) => console.log('B', v));
connectable$.connect(); // manually kick off

// ✅ Modern declarative approach with connect operator.
import { connect, merge, filter } from 'rxjs';
interval(500).pipe(
  take(4),
  connect((shared$) =>
    merge(
      shared$.pipe(filter((v) => v % 2 === 0)),
      shared$.pipe(filter((v) => v % 2 !== 0))
    )
  )
).subscribe(console.log);
```

## Related Operators
- **`share`**: A higher-level convenience wrapper around `connect` with automatic ref-counting. Prefer `share` when you just need basic multicasting without branching inside a selector.
- **`shareReplay`**: Like `share` but replays buffered values to new subscribers. Use when you need caching without the selector-based branching of `connect`.
- **`partition`**: Splits a source into two Observables based on a predicate. Simpler than `connect` for the common two-branch split case, though it creates two separate subscriptions internally.
- **`publish`**: Deprecated predecessor to `connect`. Avoid in new code.
- **`multicast`**: Deprecated lower-level multicasting operator. Avoid in new code.
