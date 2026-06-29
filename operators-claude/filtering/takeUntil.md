# takeUntil

## Brief Description
The `takeUntil` operator emits values from the source observable until a notifier observable emits its first value, at which point the source is unsubscribed and the output observable completes. It is one of the most important operators in RxJS for managing subscription lifetimes and preventing memory leaks — commonly used in Angular components to tie subscriptions to a component's lifetime.

## Category
filtering

## Import
```typescript
import { takeUntil } from 'rxjs';
```

## Signature
```typescript
takeUntil<T>(notifier: ObservableInput<any>): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| notifier | `ObservableInput<any>` | An Observable (or compatible input) that, when it emits, causes the output observable to complete and the source to be unsubscribed. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type that completes when the notifier emits.

## Marble Diagram
```
Source:   --1--2--3--4--5--6-->
Notifier: -----------N--------->
takeUntil(Notifier)
Output:   --1--2--3--|           (completes when notifier fires)
```

## Examples

### Example 1: Stop a stream when a stop button is clicked
```typescript
import { interval, fromEvent, takeUntil } from 'rxjs';

const stop$ = fromEvent(document.querySelector('#stop')!, 'click');

interval(1000).pipe(
  takeUntil(stop$)
).subscribe({
  next: val => console.log(val),
  complete: () => console.log('Stopped'),
});
```

### Example 2: Angular component lifecycle teardown pattern
```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval, takeUntil } from 'rxjs';

@Component({ selector: 'app-timer', template: '{{ count }}' })
export class TimerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  count = 0;

  ngOnInit(): void {
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(n => (this.count = n));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Example 3: Race two streams — take values until a timeout
```typescript
import { interval, timer, takeUntil } from 'rxjs';

interval(300).pipe(
  takeUntil(timer(1500))
).subscribe({
  next: val => console.log('Value:', val),
  complete: () => console.log('Timed out'),
});
// Output: 0, 1, 2, 3, 4, Timed out
```

## Common Pitfalls

### Pitfall 1: Placing takeUntil before other operators that create inner subscriptions
`takeUntil` must be the last operator in the pipe (or at least after any flattening operators) to ensure inner subscriptions are also cleaned up.

```typescript
import { interval, Subject, takeUntil, mergeMap, timer } from 'rxjs';

const stop$ = new Subject<void>();

// ❌ takeUntil before mergeMap — inner observables may not be cancelled
interval(500).pipe(
  takeUntil(stop$),
  mergeMap(() => timer(2000))
).subscribe(console.log);

// ✅ takeUntil after mergeMap — all subscriptions cancelled cleanly
interval(500).pipe(
  mergeMap(() => timer(2000)),
  takeUntil(stop$)
).subscribe(console.log);

setTimeout(() => stop$.next(), 1000);
```

### Pitfall 2: Forgetting to complete the notifier subject
Not calling `.complete()` on a Subject used as a notifier can cause minor memory leaks since the Subject itself remains subscribed.

```typescript
import { Subject } from 'rxjs';

const stop$ = new Subject<void>();

// ❌ Subject is never completed, retains internal state
stop$.next();

// ✅ Always complete the notifier
stop$.next();
stop$.complete();
```

## Related Operators
- **`skipUntil`**: The complement — skips values until the notifier fires, then passes all through.
- **`takeWhile`**: Completes based on a predicate on source values, not an external observable.
- **`take`**: Takes the first N values and completes.
- **`first`**: Takes the first value (or first match) and completes.
