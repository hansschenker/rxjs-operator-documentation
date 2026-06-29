# find

## Brief Description
The `find` operator emits the first value from the source observable that satisfies the provided predicate function, then completes immediately. It is the reactive equivalent of `Array.prototype.find`. If no value satisfies the predicate before the source completes, it emits `undefined`.

## Category
filtering

## Import
```typescript
import { find } from 'rxjs';
```

## Signature
```typescript
find<T>(predicate: (value: T, index: number, source: Observable<T>) => boolean, thisArg?: any): OperatorFunction<T, T | undefined>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `(value: T, index: number, source: Observable<T>) => boolean` | A function called for each source value. The operator emits the first value for which this returns `true`. |
| thisArg | `any` | Optional. An object to use as `this` inside the predicate. |

## Return Type
An `OperatorFunction<T, T | undefined>` — an Observable that emits a single value of type `T` (the first match), or `undefined` if no match is found before the source completes.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
find(x => x > 3)
Output:  ----------4|      (completes immediately after emitting)
```

## Examples

### Example 1: Find the first item meeting a condition
```typescript
import { of, find } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  find(n => n > 3)
).subscribe(console.log);
// Output: 4
```

### Example 2: Find an object by property value
```typescript
import { from, find } from 'rxjs';

interface Product {
  id: number;
  name: string;
  inStock: boolean;
}

const products: Product[] = [
  { id: 1, name: 'Widget', inStock: false },
  { id: 2, name: 'Gadget', inStock: true },
  { id: 3, name: 'Doohickey', inStock: true },
];

from(products).pipe(
  find(p => p.inStock)
).subscribe(product => {
  if (product) {
    console.log(`First in-stock product: ${product.name}`);
  }
});
// Output: First in-stock product: Gadget
```

### Example 3: Handle the case where no match is found
```typescript
import { of, find } from 'rxjs';

of(1, 2, 3).pipe(
  find(n => n > 10)
).subscribe(result => {
  console.log(result); // undefined — no match found
  console.log(result ?? 'No match found');
});
// Output: undefined
// Output: No match found
```

## Common Pitfalls

### Pitfall 1: Not handling the undefined case
`find` emits `undefined` when no match exists, unlike `first` which throws an error. Always guard against `undefined` in the subscriber.

```typescript
import { of, find } from 'rxjs';

// ❌ Will throw a runtime error if result is undefined
of(1, 2, 3).pipe(
  find(n => n > 10)
).subscribe(result => console.log(result!.toString())); // Unsafe

// ✅ Guard against undefined
of(1, 2, 3).pipe(
  find(n => n > 10)
).subscribe(result => {
  if (result !== undefined) {
    console.log(result.toString());
  } else {
    console.log('Not found');
  }
});
```

### Pitfall 2: Expecting find to emit multiple values
`find` always completes after the first match. Use `filter` if you want all matching values.

```typescript
import { of, find, filter } from 'rxjs';

// ❌ Only emits the first match (4), then completes
of(1, 2, 3, 4, 5, 6).pipe(
  find(n => n > 3)
).subscribe(console.log);
// Output: 4

// ✅ Use filter to emit all matches
of(1, 2, 3, 4, 5, 6).pipe(
  filter(n => n > 3)
).subscribe(console.log);
// Output: 4, 5, 6
```

## Related Operators
- **`filter`**: Emits all values that satisfy the predicate, does not complete the stream.
- **`findIndex`**: Like `find` but emits the index of the first matching value, not the value itself.
- **`first`**: Emits the first value (or first value matching a predicate) and throws if none exists.
- **`single`**: Emits a single matching value and errors if there are zero or more than one matches.
