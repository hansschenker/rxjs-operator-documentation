# distinctUntilChanged

## Brief Description
The `distinctUntilChanged` operator emits values from the source observable only when the current value is different from the immediately preceding value. Unlike `distinct`, it only compares adjacent values, not the entire history — making it memory-efficient for long-running streams. It accepts an optional comparator function for custom equality logic and an optional key selector.

## Category
filtering

## Import
```typescript
import { distinctUntilChanged } from 'rxjs';
```

## Signature
```typescript
distinctUntilChanged<T, K>(
  comparator?: (previous: K, current: K) => boolean,
  keySelector?: (value: T) => K
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| comparator | `(previous: K, current: K) => boolean` | Optional. A function that returns `true` if the two values should be considered equal (and the current value suppressed). Defaults to strict equality (`===`). |
| keySelector | `(value: T) => K` | Optional. A function to extract the key used for comparison. The key is passed to the comparator. Defaults to the identity function. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type that suppresses consecutive duplicate values.

## Marble Diagram
```
Source:  --1--1--2--2--3--1--|
distinctUntilChanged()
Output:  --1-----2-----3--1--|
         (consecutive duplicates suppressed; non-consecutive 1s pass through)
```

## Examples

### Example 1: Suppress consecutive duplicate numbers
```typescript
import { of, distinctUntilChanged } from 'rxjs';

of(1, 1, 2, 3, 3, 3, 1).pipe(
  distinctUntilChanged()
).subscribe(console.log);
// Output: 1, 2, 3, 1
```

### Example 2: Compare objects with a custom comparator
```typescript
import { of, distinctUntilChanged } from 'rxjs';

interface Point { x: number; y: number; }

of<Point>(
  { x: 0, y: 0 },
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 0 },
).pipe(
  distinctUntilChanged((prev, curr) => prev.x === curr.x && prev.y === curr.y)
).subscribe(console.log);
// Output: { x: 0, y: 0 }, { x: 1, y: 0 }
```

### Example 3: Use keySelector to compare by a property
```typescript
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

interface AppState {
  user: string;
  theme: string;
}

const state$ = new BehaviorSubject<AppState>({ user: 'Alice', theme: 'dark' });

// Only emit when the user property changes
state$.pipe(
  distinctUntilChanged((prev, curr) => prev === curr, s => s.user)
).subscribe(s => console.log('User changed:', s.user));

state$.next({ user: 'Alice', theme: 'light' }); // No emit — user unchanged
state$.next({ user: 'Bob', theme: 'light' });   // Emits — user changed
// Output: User changed: Alice (initial), User changed: Bob
```

## Common Pitfalls

### Pitfall 1: Using default comparator with objects (reference equality)
By default, `distinctUntilChanged` uses `===`. Two different object references are never equal by `===`, even if their contents are identical.

```typescript
import { of, distinctUntilChanged } from 'rxjs';

// ❌ Both objects are distinct references — both emitted
of({ a: 1 }, { a: 1 }).pipe(
  distinctUntilChanged()
).subscribe(console.log); // { a: 1 }, { a: 1 }

// ✅ Provide a custom comparator
of({ a: 1 }, { a: 1 }).pipe(
  distinctUntilChanged((prev, curr) => prev.a === curr.a)
).subscribe(console.log); // { a: 1 }
```

### Pitfall 2: Confusing distinctUntilChanged with distinct
`distinctUntilChanged` only prevents *consecutive* duplicates. Values that appeared earlier can appear again once a different value is emitted between them.

```typescript
import { of, distinctUntilChanged, distinct } from 'rxjs';

// distinctUntilChanged: 1 appears twice (separated by 2)
of(1, 1, 2, 1).pipe(distinctUntilChanged()).subscribe(console.log);
// Output: 1, 2, 1

// distinct: 1 only appears once ever
of(1, 1, 2, 1).pipe(distinct()).subscribe(console.log);
// Output: 1, 2
```

## Related Operators
- **`distinct`**: Suppresses all previously-seen duplicates, not just consecutive ones.
- **`distinctUntilKeyChanged`**: Shorthand for comparing by a named object key.
- **`debounceTime`**: Suppresses rapid consecutive emissions by time, not equality.
- **`auditTime`**: Emits the most recent value from a window, not distinct values.
