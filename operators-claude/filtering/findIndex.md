# findIndex

## Brief Description
The `findIndex` operator emits the zero-based index of the first value from the source observable that satisfies the provided predicate function, then completes. It is the reactive equivalent of `Array.prototype.findIndex`. If no value satisfies the predicate before the source completes, it emits `-1`.

## Category
filtering

## Import
```typescript
import { findIndex } from 'rxjs';
```

## Signature
```typescript
findIndex<T>(predicate: (value: T, index: number, source: Observable<T>) => boolean, thisArg?: any): OperatorFunction<T, number>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `(value: T, index: number, source: Observable<T>) => boolean` | A function called for each source value. The operator emits the index of the first value for which this returns `true`. |
| thisArg | `any` | Optional. An object to use as `this` inside the predicate. |

## Return Type
An `OperatorFunction<T, number>` — an Observable that emits a single `number` representing the zero-based index of the first matching value, or `-1` if no match is found.

## Marble Diagram
```
Source:  --a--b--c--d--e--|
findIndex(x => x === 'c')
Output:  ----------2|      (index of 'c' is 2)
```

## Examples

### Example 1: Find the index of the first matching number
```typescript
import { of, findIndex } from 'rxjs';

of(10, 20, 30, 40, 50).pipe(
  findIndex(n => n > 25)
).subscribe(console.log);
// Output: 2  (30 is at index 2)
```

### Example 2: Find the index of a matching object
```typescript
import { from, findIndex } from 'rxjs';

const tasks = [
  { id: 'a', done: false },
  { id: 'b', done: false },
  { id: 'c', done: true },
  { id: 'd', done: true },
];

from(tasks).pipe(
  findIndex(task => task.done)
).subscribe(idx => {
  console.log(`First completed task is at index: ${idx}`);
});
// Output: First completed task is at index: 2
```

### Example 3: Handle the no-match case (-1)
```typescript
import { of, findIndex } from 'rxjs';

of(1, 2, 3).pipe(
  findIndex(n => n > 100)
).subscribe(idx => {
  if (idx === -1) {
    console.log('No matching element found');
  } else {
    console.log(`Found at index: ${idx}`);
  }
});
// Output: No matching element found
```

## Common Pitfalls

### Pitfall 1: Confusing findIndex with find
`findIndex` emits the index as a number, not the value itself. Use `find` when you need the actual value.

```typescript
import { of, find, findIndex } from 'rxjs';

// ❌ This emits 2 (the index), not 30 (the value)
of(10, 20, 30, 40).pipe(
  findIndex(n => n > 25)
).subscribe(result => console.log(result)); // 2, not 30

// ✅ Use find to get the value
of(10, 20, 30, 40).pipe(
  find(n => n > 25)
).subscribe(result => console.log(result)); // 30
```

### Pitfall 2: Not checking for -1 before using the index
When no element matches, `findIndex` emits `-1`. Using `-1` as an array index will give unexpected results.

```typescript
import { of, findIndex } from 'rxjs';

const arr = ['apple', 'banana', 'cherry'];

// ❌ arr[-1] is undefined in JavaScript
of(...arr).pipe(
  findIndex(s => s.startsWith('z'))
).subscribe(idx => console.log(arr[idx])); // undefined

// ✅ Always check for -1
of(...arr).pipe(
  findIndex(s => s.startsWith('z'))
).subscribe(idx => {
  if (idx !== -1) {
    console.log(arr[idx]);
  } else {
    console.log('Not found');
  }
});
```

## Related Operators
- **`find`**: Emits the first matching value (not the index).
- **`filter`**: Emits all values satisfying the predicate.
- **`first`**: Emits the first value (or first match) and errors if none is found.
- **`elementAt`**: Emits the value at a specific index in the stream.
