# mapTo

## Brief Description
Maps every emission from the source Observable to the same constant value, ignoring the actual emitted value. This is a convenience shorthand for `map(() => constant)`. **Note: `mapTo` is deprecated as of RxJS 7.** The recommended replacement is `map(() => value)` with an arrow function.

## Category
transformation

## Import
```typescript
import { mapTo } from 'rxjs';
```

## Signature
```typescript
/** @deprecated Use map(() => value) instead. Will be removed in v9. */
mapTo<R>(value: R): OperatorFunction<unknown, R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `R` | The constant value to emit for every source emission. |

## Return Type
An `Observable<R>` that emits the constant `value` for every emission from the source.

## Marble Diagram
```
Source:  --a----b----c----d--|
mapTo('X')
Output:  --X----X----X----X--|
```

## Examples

### Example 1: Map all emissions to a fixed string (deprecated syntax shown for reference)
```typescript
import { interval, mapTo, take } from 'rxjs';

// Deprecated — shown for reference when reading legacy code
interval(1000).pipe(
  take(4),
  mapTo('tick')
).subscribe(val => console.log(val));
// Output (every second):
// tick
// tick
// tick
// tick
```

### Example 2: Preferred replacement using map
```typescript
import { fromEvent, map } from 'rxjs';

// ✅ Preferred: use map(() => value) instead of mapTo
const clicks$ = fromEvent(document, 'click');

clicks$.pipe(
  map(() => 1) // count each click as 1
).subscribe(val => console.log('Clicked, value:', val));
// Output on each click:
// Clicked, value: 1
```

### Example 3: Converting event stream to action objects
```typescript
import { fromEvent, map } from 'rxjs';

interface Action {
  type: string;
  payload?: unknown;
}

// ✅ Modern equivalent of mapTo({ type: 'BUTTON_CLICKED' })
const button = document.querySelector('#submit-btn')!;

fromEvent(button, 'click').pipe(
  map((): Action => ({ type: 'SUBMIT_CLICKED', payload: null }))
).subscribe(action => console.log('Dispatching action:', action));
// Output on click:
// Dispatching action: { type: 'SUBMIT_CLICKED', payload: null }
```

## Common Pitfalls

### Pitfall 1: Using mapTo in new code (it is deprecated)
New code should use `map(() => value)` rather than `mapTo(value)`. The `mapTo` operator will be removed in RxJS v9.

```typescript
import { interval, mapTo, map, take } from 'rxjs';

// ❌ Deprecated — avoid in new code
interval(1000).pipe(
  take(3),
  mapTo('hello')
).subscribe(console.log);

// ✅ Preferred modern equivalent
interval(1000).pipe(
  take(3),
  map(() => 'hello')
).subscribe(console.log);
```

### Pitfall 2: Mapping to a mutable object reference
The same object reference is emitted for every value. If the object is mutated downstream, all references are affected.

```typescript
import { of, map } from 'rxjs';

const sharedObj = { count: 0 };

// ❌ All emissions share the same object reference
of(1, 2, 3).pipe(
  map(() => sharedObj)
).subscribe(obj => {
  obj.count++;
  console.log(obj); // { count: 1 }, { count: 2 }, { count: 3 } — all same ref
});

// ✅ Create a new object for each emission
of(1, 2, 3).pipe(
  map(() => ({ count: 0 }))
).subscribe(obj => console.log(obj)); // each is a fresh object
```

## Related Operators
- **`map`**: The general-purpose transformation operator; use `map(() => value)` instead of `mapTo(value)`.
- **`tap`**: Performs side effects without changing the emitted value; different from mapping to a constant.
- **`ignoreElements`**: Discards all next emissions entirely, only forwarding complete/error notifications.
