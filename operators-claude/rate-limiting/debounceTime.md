# debounceTime

## Brief Description
`debounceTime` delays emissions from the source observable by a fixed duration and discards any value that is followed by another value before that duration elapses. In effect, it waits for a period of silence before forwarding a value. It is the go-to operator for preventing rapid-fire events — such as keystrokes, window resizes, or scroll events — from triggering expensive downstream work on every occurrence.

## Category
rate-limiting

## Import
```typescript
import { debounceTime } from 'rxjs';
```

## Signature
```typescript
debounceTime<T>(dueTime: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `dueTime` | `number` | The silence duration in milliseconds (or scheduler units). A new source emission resets this timer. |
| `scheduler` | `SchedulerLike` (optional) | The scheduler used to manage the timer. Defaults to `asyncScheduler`. Pass `TestScheduler` during unit tests. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source that emits only after `dueTime` milliseconds of silence from the source.

## Marble Diagram
```
Source:   --a-b-c---------d--e-----------f--|
          debounceTime(40ms)
Output:   ----------------c------e----------f--|

Explanation:
- 'a' and 'b' are discarded because 'c' follows within 40ms
- 'c' passes through after 40ms of silence
- 'd' is discarded because 'e' follows within 40ms
- 'e' and 'f' pass through after their respective silence windows
```

## Examples

### Example 1: Debouncing a search input
```typescript
import { fromEvent } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, switchMap } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const input = document.getElementById('search') as HTMLInputElement;

fromEvent<InputEvent>(input, 'input').pipe(
  map(event => (event.target as HTMLInputElement).value.trim()),
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query =>
    ajax.getJSON<{ results: string[] }>(`/api/search?q=${encodeURIComponent(query)}`)
  )
).subscribe(response => {
  console.log('Search results:', response.results);
});
```

### Example 2: Debouncing window resize events
```typescript
import { fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs';

const resize$ = fromEvent(window, 'resize').pipe(
  debounceTime(150),
  map(() => ({ width: window.innerWidth, height: window.innerHeight }))
);

resize$.subscribe(({ width, height }) => {
  console.log(`Recalculating layout for ${width}x${height}`);
  // Expensive layout recalculation happens at most once per 150ms of silence
});
```

### Example 3: Auto-saving form data
```typescript
import { fromEvent, merge } from 'rxjs';
import { debounceTime, map, tap } from 'rxjs';

const titleInput = document.getElementById('title') as HTMLInputElement;
const bodyInput = document.getElementById('body') as HTMLTextAreaElement;

const formChange$ = merge(
  fromEvent(titleInput, 'input'),
  fromEvent(bodyInput, 'input')
).pipe(
  debounceTime(1000),
  map(() => ({
    title: titleInput.value,
    body: bodyInput.value,
  })),
  tap(() => console.log('Auto-saving...'))
);

formChange$.subscribe(data => {
  localStorage.setItem('draft', JSON.stringify(data));
  console.log('Draft saved:', data);
});
```

## Common Pitfalls

### Pitfall 1: The last value before source completion may be lost
If the source completes before the debounce timer fires, the buffered value is discarded. This is often surprising when debouncing finite observables.

```typescript
import { of } from 'rxjs';
import { debounceTime } from 'rxjs';

// ❌ Emits nothing — 'of' completes synchronously, timer never fires
of('hello').pipe(debounceTime(300)).subscribe(console.log);

// ✅ Use a Subject or real async source if you need the last value
import { Subject } from 'rxjs';
const s = new Subject<string>();
s.pipe(debounceTime(300)).subscribe(console.log);
s.next('hello');
setTimeout(() => s.complete(), 400); // 'hello' will be emitted
```

### Pitfall 2: Choosing too short a debounce duration
A duration that is too short fails to collapse rapid bursts; too long creates a sluggish UX. A common heuristic is 150–300ms for keystroke debouncing.

```typescript
// ❌ 10ms is often too short to catch real typing bursts
debounceTime(10)

// ✅ 300ms is a broadly accepted sweet spot for search inputs
debounceTime(300)
```

## Related Operators
- **`debounce`**: The dynamic version — pass a factory function that returns an observable to vary the silence window per emission.
- **`throttleTime`**: Emits the first value in a window and suppresses the rest; useful when you want *immediate* feedback with a cooldown.
- **`auditTime`**: Emits the most recent value at the *end* of each fixed-size window, regardless of when values arrived.
- **`distinctUntilChanged`**: Often paired with `debounceTime` to avoid reacting when the final debounced value equals the previous one.
