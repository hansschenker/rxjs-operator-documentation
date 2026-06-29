# repeat

## Brief Description
`repeat` resubscribes to the source observable when it *completes*, effectively repeating the entire sequence a specified number of times (or indefinitely). Unlike `retry`, it does not react to errors — it only triggers on successful completion. In RxJS 7+ a configuration object lets you add a delay between repetitions, replacing the need for `repeatWhen`.

## Category
error-handling

## Import
```typescript
import { repeat } from 'rxjs';
```

## Signature
```typescript
// Simple count overload
repeat<T>(count?: number): MonoTypeOperatorFunction<T>

// Config object overload (RxJS 7+)
repeat<T>(config: RepeatConfig): MonoTypeOperatorFunction<T>

// RepeatConfig shape
interface RepeatConfig {
  count?: number;  // number of repetitions (default: Infinity)
  delay?: number | ((count: number) => ObservableInput<any>);
}
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `count` | `number` | The maximum number of times to resubscribe. Defaults to `Infinity` when the number overload is used with no argument. A value of `0` causes immediate completion. |
| `config` | `RepeatConfig` | Configuration object (RxJS 7+). Supports `count` and a `delay` (milliseconds or factory function). |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable that mirrors the source and resubscribes after each completion. Completes when the repeat count is reached or the delay factory itself completes.

## Marble Diagram
```
Source:  --a--b--|   (completes)
repeat(2) means resubscribe twice AFTER the first run (3 total runs):

Result:  --a--b--a--b--a--b--|
```

## Examples

### Example 1: Repeat a finite sequence a fixed number of times
```typescript
import { of, repeat } from 'rxjs';

of(1, 2, 3).pipe(
  repeat(3)
).subscribe({
  next: v => console.log(v),
  complete: () => console.log('Done'),
});
// Output: 1 2 3 1 2 3 1 2 3 Done
```

### Example 2: Poll an API every 5 seconds (RxJS 7+ delay config)
```typescript
import { fromFetch, repeat, switchMap } from 'rxjs';

const poll$ = fromFetch('https://api.example.com/status').pipe(
  switchMap(response => response.json()),
  repeat({
    delay: 5000, // wait 5 seconds after each completion before re-fetching
  })
);

const subscription = poll$.subscribe({
  next: data => console.log('Status:', data),
  error: err => console.error(err),
});

// Stop polling after 30 seconds
setTimeout(() => subscription.unsubscribe(), 30_000);
```

### Example 3: Repeat with dynamic delay factory
```typescript
import { of, repeat, timer } from 'rxjs';

of('ping').pipe(
  repeat({
    count: 5,
    delay: count => {
      const ms = count * 1000; // delay grows with each repetition
      console.log(`Repetition ${count} — next in ${ms}ms`);
      return timer(ms);
    },
  })
).subscribe({
  next: v => console.log(v),
  complete: () => console.log('All repetitions done'),
});
```

## Common Pitfalls

### Pitfall 1: `repeat()` with no argument loops infinitely
With no argument, `repeat()` resubscribes forever. This is useful for polling but will cause memory issues if the source produces values faster than they are consumed.

```typescript
// ❌ Infinite loop — never completes, potential memory issue
of(1, 2, 3).pipe(repeat()).subscribe(console.log);

// ✅ Use a finite count or combine with takeUntil / take
import { take } from 'rxjs';
of(1, 2, 3).pipe(repeat(), take(9)).subscribe(console.log); // 3 iterations
```

### Pitfall 2: `repeat` does not catch errors — it only reacts to completions
If the source errors, `repeat` will not resubscribe. Use `retry` for error-based resubscription.

```typescript
import { throwError, repeat, retry } from 'rxjs';

// ❌ repeat has no effect on an erroring source
throwError(() => new Error('fail')).pipe(
  repeat(3) // never triggered because source errors, not completes
).subscribe({ error: err => console.error(err.message) }); // 'fail'

// ✅ Use retry for error scenarios
throwError(() => new Error('fail')).pipe(
  retry(3)
).subscribe({ error: err => console.error(err.message) });
```

## Related Operators
- **`retry`**: Analogous operator that resubscribes on *error* instead of completion.
- **`repeatWhen`**: Deprecated in RxJS 7 — the `delay` factory in `repeat`'s config object is the modern replacement.
- **`interval`**: A simpler alternative when you just need values emitted on a fixed schedule.
- **`timer`**: Often used inside `repeat`'s delay factory to create dynamic delays.
