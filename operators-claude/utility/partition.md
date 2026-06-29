# partition

## Brief Description
`partition` splits a single source observable into two separate observables based on a predicate function. The first observable in the returned tuple emits values for which the predicate returns `true`; the second emits values for which it returns `false`. It is a convenient alternative to using two separate `filter` calls on the same source, and is commonly used to separate valid data from errors, successes from failures, or any binary categorization.

> **Note**: In RxJS 7+, `partition` is a **pipeable creation function** imported from `'rxjs'`, called as `partition(source$, predicate)` — not as a pipeable operator inside `.pipe()`.

## Category
utility

## Import
```typescript
import { partition } from 'rxjs';
```

## Signature
```typescript
partition<T>(
  source: ObservableInput<T>,
  predicate: (value: T, index: number) => boolean
): [Observable<T>, Observable<T>]
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| source | `ObservableInput<T>` | The source observable to split. |
| predicate | `(value: T, index: number) => boolean` | A function called for each emission with the value and its zero-based index. Values for which this returns `true` go to the first observable; `false` values go to the second. |

## Return Type
Returns a tuple `[Observable<T>, Observable<T>]` where the first observable contains items matching the predicate and the second contains items that do not match.

## Marble Diagram
```
Source:      --1--2--3--4--5--6--|>
predicate:   x => x % 2 === 0

[evens$]:    -----2-----4-----6--|>
[odds$]:     --1-----3-----5-----|>
```

## Examples

### Example 1: Separating even and odd numbers
```typescript
import { of, partition } from 'rxjs';

const source$ = of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

const [evens$, odds$] = partition(source$, value => value % 2 === 0);

evens$.subscribe(val => console.log('Even:', val));
odds$.subscribe(val => console.log('Odd:', val));

// Output:
// Even: 2
// Even: 4
// Even: 6
// Even: 8
// Even: 10
// Odd: 1
// Odd: 3
// Odd: 5
// Odd: 7
// Odd: 9
```

### Example 2: Routing HTTP results — successes and failures
```typescript
import { of, partition } from 'rxjs';
import { mergeMap } from 'rxjs';

interface ApiResponse {
  status: 'success' | 'error';
  data?: string;
  error?: string;
}

// Simulate a stream of API responses
const responses$ = of<ApiResponse>(
  { status: 'success', data: 'User loaded' },
  { status: 'error', error: 'Not found' },
  { status: 'success', data: 'Profile updated' },
  { status: 'error', error: 'Server error' }
);

const [success$, failure$] = partition(
  responses$,
  response => response.status === 'success'
);

success$.subscribe(res => console.log('Success:', res.data));
failure$.subscribe(res => console.error('Error:', res.error));

// Output:
// Success: User loaded
// Success: Profile updated
// Error: Not found
// Error: Server error
```

### Example 3: Separating admin and regular users using index
```typescript
import { from, partition } from 'rxjs';

interface User {
  name: string;
  role: 'admin' | 'user';
}

const users: User[] = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Carol', role: 'admin' },
  { name: 'Dave', role: 'user' },
];

const [admins$, regularUsers$] = partition(
  from(users),
  (user, index) => {
    console.log(`Checking user at index ${index}:`, user.name);
    return user.role === 'admin';
  }
);

admins$.subscribe(user => console.log('Admin:', user.name));
regularUsers$.subscribe(user => console.log('User:', user.name));

// Output:
// Checking user at index 0: Alice
// Checking user at index 1: Bob
// Checking user at index 2: Carol
// Checking user at index 3: Dave
// Admin: Alice
// Admin: Carol
// ... (then regularUsers$ subscription runs the source again)
```

## Common Pitfalls

### Pitfall 1: Subscribing to both partitions causes the source to run twice
`partition` creates two independent observables that each subscribe to the source separately. For non-shared (cold) observables, the source executes once per subscription. Use `share()` on the source to avoid double execution.

```typescript
import { of, partition, share } from 'rxjs';
import { tap } from 'rxjs';

let executionCount = 0;
const source$ = of(1, 2, 3, 4).pipe(
  tap(() => executionCount++)
);

// ❌ Incorrect — source runs twice (once per partition subscription)
const [a$, b$] = partition(source$, x => x % 2 === 0);
a$.subscribe();
b$.subscribe();
console.log('Executions:', executionCount); // 8 — source ran twice!

// ✅ Correct — share the source so it runs once
const shared$ = source$.pipe(share());
const [c$, d$] = partition(shared$, x => x % 2 === 0);
c$.subscribe();
d$.subscribe();
// Now the source runs once (though timing with share matters)
```

### Pitfall 2: Using partition inside pipe() as if it were a pipeable operator
`partition` is NOT a pipeable operator — it is a standalone function. It cannot be used inside `.pipe()` and must be called with the source observable as its first argument.

```typescript
import { of, partition } from 'rxjs';

// ❌ Incorrect — partition is not a pipeable operator
// of(1, 2, 3, 4).pipe(
//   partition(x => x % 2 === 0) // TypeError!
// ).subscribe(...);

// ✅ Correct — call partition as a function with the source
const source$ = of(1, 2, 3, 4);
const [evens$, odds$] = partition(source$, x => x % 2 === 0);
evens$.subscribe(val => console.log('Even:', val));
odds$.subscribe(val => console.log('Odd:', val));
```

## Related Operators
- **`filter`**: Use two separate `filter` calls as an alternative; more flexible but requires two explicit subscriptions or a shared source.
- **`groupBy`**: Splits a source into multiple observables keyed by a selector; more powerful for more than two groups.
- **`share`**: Use with `partition` to prevent the source observable from being subscribed to multiple times.
- **`iif`**: Conditionally subscribes to one of two observables based on a condition evaluated at subscription time; different use case from partitioning a stream.
