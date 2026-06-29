# filter

## Brief Description
The `filter` operator emits only those items from the source observable that satisfy a provided predicate function. It is the reactive equivalent of `Array.prototype.filter` and is one of the most commonly used filtering operators in RxJS, useful whenever you need to exclude certain values from a stream based on a condition.

## Category
filtering

## Import
```typescript
import { filter } from 'rxjs';
```

## Signature
```typescript
filter<T>(predicate: (value: T, index: number) => boolean, thisArg?: any): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `(value: T, index: number) => boolean` | A function that evaluates each source value. If it returns `true`, the value is emitted; otherwise it is dropped. The second argument is the zero-based index of the value. |
| thisArg | `any` | Optional. An object to use as `this` inside the predicate function. |

## Return Type
A `MonoTypeOperatorFunction<T>` — returns an Observable of the same type as the source, emitting only values for which the predicate returns `true`.

## Marble Diagram
```
Source:  --1--2--3--4--5--6--|
filter(x => x % 2 === 0)
Output:  -----2-----4-----6--|
```

## Examples

### Example 1: Filter even numbers
```typescript
import { of, filter } from 'rxjs';

of(1, 2, 3, 4, 5, 6).pipe(
  filter(n => n % 2 === 0)
).subscribe(console.log);
// Output: 2, 4, 6
```

### Example 2: Filter objects by property
```typescript
import { from, filter } from 'rxjs';

interface User {
  name: string;
  age: number;
  active: boolean;
}

const users: User[] = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Carol', age: 35, active: true },
];

from(users).pipe(
  filter(user => user.active)
).subscribe(user => console.log(user.name));
// Output: Alice, Carol
```

### Example 3: Use index parameter to skip the first emission
```typescript
import { interval, filter, take } from 'rxjs';

interval(500).pipe(
  filter((_, index) => index > 2),
  take(4)
).subscribe(console.log);
// Output: 3, 4, 5, 6  (skips index 0, 1, 2)
```

## Common Pitfalls

### Pitfall 1: Using filter as a type guard without narrowing the type
When filtering by type, use a type-predicate function to properly narrow the TypeScript type.

```typescript
import { of, filter } from 'rxjs';

// ❌ TypeScript still infers string | null
of('hello', null, 'world').pipe(
  filter(val => val !== null)
).subscribe(val => val.toUpperCase()); // TS error: val could be null

// ✅ Type predicate narrows to string
of('hello', null, 'world').pipe(
  filter((val): val is string => val !== null)
).subscribe(val => val.toUpperCase()); // Safe
```

### Pitfall 2: Confusing filter with take or first
`filter` never completes the stream — it just drops values. If you want the stream to complete after finding a match, use `first` or `find` instead.

```typescript
import { interval, filter, first } from 'rxjs';

// ❌ Stream never completes — subscription leaks
interval(1000).pipe(
  filter(n => n === 5)
).subscribe(console.log);

// ✅ Completes after emitting the first matching value
interval(1000).pipe(
  first(n => n === 5)
).subscribe(console.log);
```

## Related Operators
- **`first`**: Emits only the first value (optionally matching a predicate) and then completes.
- **`find`**: Emits only the first value matching a predicate and then completes.
- **`takeWhile`**: Emits values while a predicate holds true, then completes the stream.
- **`every`**: Emits a single boolean indicating whether all source values satisfy a predicate.
