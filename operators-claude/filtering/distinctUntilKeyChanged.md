# distinctUntilKeyChanged

## Brief Description
The `distinctUntilKeyChanged` operator is a specialization of `distinctUntilChanged` that compares emissions by a specified object property key. It emits a value only when the value at the given key differs from the previous emission's value at the same key. An optional custom comparator can override the default strict equality check for the key's value. This is a convenient shorthand when working with state objects or event objects.

## Category
filtering

## Import
```typescript
import { distinctUntilKeyChanged } from 'rxjs';
```

## Signature
```typescript
distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare?: (x: T[K], y: T[K]) => boolean
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| key | `K extends keyof T` | The property key of the emitted objects to compare between consecutive emissions. |
| compare | `(x: T[K], y: T[K]) => boolean` | Optional. A custom comparison function applied to the values at `key`. Should return `true` if the values are considered equal (suppressing the emission). Defaults to strict equality (`===`). |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type that suppresses emissions when the specified key's value has not changed.

## Marble Diagram
```
Source:  --{n:'A'}--{n:'A'}--{n:'B'}--{n:'B'}--{n:'A'}--|
distinctUntilKeyChanged('n')
Output:  --{n:'A'}-----------{n:'B'}-----------{n:'A'}--|
```

## Examples

### Example 1: Suppress consecutive emissions with the same name
```typescript
import { of, distinctUntilKeyChanged } from 'rxjs';

of(
  { name: 'Alice', score: 10 },
  { name: 'Alice', score: 20 },
  { name: 'Bob', score: 15 },
  { name: 'Bob', score: 30 },
  { name: 'Alice', score: 25 },
).pipe(
  distinctUntilKeyChanged('name')
).subscribe(user => console.log(user.name, user.score));
// Output:
// Alice 10
// Bob 15
// Alice 25
```

### Example 2: React to route changes in a router events stream
```typescript
import { of, distinctUntilKeyChanged, filter } from 'rxjs';

// Simplified router event simulation
const routerEvents$ = of(
  { type: 'NavigationEnd', url: '/home' },
  { type: 'NavigationEnd', url: '/home' }, // duplicate
  { type: 'NavigationEnd', url: '/profile' },
  { type: 'NavigationEnd', url: '/settings' },
);

routerEvents$.pipe(
  distinctUntilKeyChanged('url')
).subscribe(event => console.log('Navigated to:', event.url));
// Output: /home, /profile, /settings
```

### Example 3: Use a custom comparator for case-insensitive key comparison
```typescript
import { of, distinctUntilKeyChanged } from 'rxjs';

of(
  { category: 'Fruits' },
  { category: 'fruits' }, // same, different case
  { category: 'VEGETABLES' },
  { category: 'vegetables' }, // same, different case
).pipe(
  distinctUntilKeyChanged(
    'category',
    (prev, curr) => prev.toLowerCase() === curr.toLowerCase()
  )
).subscribe(item => console.log(item.category));
// Output: Fruits, VEGETABLES
```

## Common Pitfalls

### Pitfall 1: Using it on nested or complex key values without a comparator
If the key holds an object or array, default strict equality will always see them as different references even when their contents match.

```typescript
import { of, distinctUntilKeyChanged } from 'rxjs';

// ❌ tags is a different array reference each emission
of(
  { id: 1, tags: ['a', 'b'] },
  { id: 1, tags: ['a', 'b'] }, // Different array reference!
).pipe(
  distinctUntilKeyChanged('tags')
).subscribe(console.log); // Emits both

// ✅ Provide a comparator that handles structural equality
of(
  { id: 1, tags: ['a', 'b'] },
  { id: 1, tags: ['a', 'b'] },
).pipe(
  distinctUntilKeyChanged(
    'tags',
    (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
  )
).subscribe(console.log); // Emits only the first
```

### Pitfall 2: Expecting it to monitor multiple keys simultaneously
`distinctUntilKeyChanged` monitors only one key at a time. To track changes to multiple keys, use `distinctUntilChanged` with a custom comparator.

```typescript
import { of, distinctUntilChanged, distinctUntilKeyChanged } from 'rxjs';

// ❌ Only tracks 'name' — changes to 'role' are ignored
of(
  { name: 'Alice', role: 'admin' },
  { name: 'Alice', role: 'user' },  // role changed — NOT emitted
).pipe(
  distinctUntilKeyChanged('name')
).subscribe(console.log); // Only first emitted

// ✅ Use distinctUntilChanged with a multi-key comparator
of(
  { name: 'Alice', role: 'admin' },
  { name: 'Alice', role: 'user' },
).pipe(
  distinctUntilChanged(
    (prev, curr) => prev.name === curr.name && prev.role === curr.role
  )
).subscribe(console.log); // Both emitted
```

## Related Operators
- **`distinctUntilChanged`**: More general — accepts a custom comparator and key selector.
- **`distinct`**: Suppresses all previously-seen values globally, not just adjacent ones.
- **`pluck` (deprecated in RxJS 8)**: Use `map(obj => obj.key)` to extract a property before applying other operators.
- **`filter`**: Suppresses values based on a predicate; does not track previous values.
