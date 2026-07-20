# RxJS Operator Documentation

Complete documentation for all RxJS pipeable operators, organized by category.
Each page includes: description, signature, parameters, marble diagram, 3 examples, common pitfalls, and related operators.

## Categories

### [Filtering](./filtering/)
Operators that selectively emit values from the source observable.

| Operator | Description |
|----------|-------------|
| [filter](./filtering/filter.md) | Emit values that pass a predicate |
| [find](./filtering/find.md) | Emit the first value matching a predicate, then complete |
| [findIndex](./filtering/findIndex.md) | Emit the index of the first matching value, then complete |
| [first](./filtering/first.md) | Emit only the first value (or first matching value) |
| [last](./filtering/last.md) | Emit only the last value before completion |
| [single](./filtering/single.md) | Emit only the single value that matches; error on 0 or 2+ matches |
| [elementAt](./filtering/elementAt.md) | Emit only the value at a specific index |
| [skip](./filtering/skip.md) | Skip the first N values |
| [skipLast](./filtering/skipLast.md) | Skip the last N values |
| [skipUntil](./filtering/skipUntil.md) | Skip values until a notifier observable emits |
| [skipWhile](./filtering/skipWhile.md) | Skip values while a predicate holds true |
| [take](./filtering/take.md) | Emit only the first N values |
| [takeLast](./filtering/takeLast.md) | Emit only the last N values |
| [takeUntil](./filtering/takeUntil.md) | Emit values until a notifier observable emits |
| [takeWhile](./filtering/takeWhile.md) | Emit values while a predicate holds true |
| [every](./filtering/every.md) | Emit a boolean: do all values satisfy a predicate? |
| [isEmpty](./filtering/isEmpty.md) | Emit true if the source completes without emitting any values |
| [defaultIfEmpty](./filtering/defaultIfEmpty.md) | Emit a fallback value if the source completes without emitting |
| [ignoreElements](./filtering/ignoreElements.md) | Ignore all next emissions; forward only error/complete |
| [distinct](./filtering/distinct.md) | Emit values not seen before (global uniqueness) |
| [distinctUntilChanged](./filtering/distinctUntilChanged.md) | Emit values only when they differ from the previous |
| [distinctUntilKeyChanged](./filtering/distinctUntilKeyChanged.md) | Emit objects only when a specified key's value changes |

### [Transformation](./transformation/)
Operators that transform each emitted value or accumulate values.

| Operator | Description |
|----------|-------------|
| [map](./transformation/map.md) | Transform each value with a projection function |
| [mapTo](./transformation/mapTo.md) | Replace each value with a constant *(deprecated)* |
| [scan](./transformation/scan.md) | Accumulate values over time, emitting each intermediate result |
| [reduce](./transformation/reduce.md) | Accumulate all values, emit only the final result on completion |
| [expand](./transformation/expand.md) | Recursively project values to observables and merge the results |
| [groupBy](./transformation/groupBy.md) | Group source values by a key into separate GroupedObservables |
| [pairwise](./transformation/pairwise.md) | Emit `[previous, current]` pairs for consecutive values |
| [toArray](./transformation/toArray.md) | Collect all values into a single array emitted on completion |
| [count](./transformation/count.md) | Emit the number of values emitted by the source |
| [max](./transformation/max.md) | Emit the maximum value when the source completes |
| [min](./transformation/min.md) | Emit the minimum value when the source completes |
| [materialize](./transformation/materialize.md) | Wrap each notification in a `Notification` object |
| [dematerialize](./transformation/dematerialize.md) | Unwrap `Notification` objects back into observable notifications |
| [timestamp](./transformation/timestamp.md) | Attach a timestamp to each emitted value |
| [timeInterval](./transformation/timeInterval.md) | Emit time elapsed since the previous emission |
| [sequenceEqual](./transformation/sequenceEqual.md) | Compare two observables for sequential equality |
| [concatMap](./transformation/concatMap.md) | Map to inner observables and subscribe sequentially *(pre-existing)* |
| [exhaustMap](./transformation/exhaustMap.md) | Map to inner observable, ignoring new values while one is active *(pre-existing)* |
| [mergeMap](./transformation/mergeMap.md) | Map to inner observables and subscribe concurrently *(pre-existing)* |
| [switchMap](./transformation/switchMap.md) | Map to inner observable, cancelling previous on new emission *(pre-existing)* |

### [Higher-Order Mapping](./higher-order/)
Additional flattening/mapping operators.

| Operator | Description |
|----------|-------------|
| [concatMap](./higher-order/concatMap.md) | Sequential mapping with queuing |
| [concatMapTo](./higher-order/concatMapTo.md) | Like `concatMap` but maps to a fixed observable *(deprecated)* |
| [mergeMapTo](./higher-order/mergeMapTo.md) | Like `mergeMap` but maps to a fixed observable *(deprecated)* |
| [mergeScan](./higher-order/mergeScan.md) | Like `scan` but the accumulator returns an observable |
| [switchAll](./higher-order/switchAll.md) | Flatten a higher-order observable, subscribing only to the latest |
| [switchMapTo](./higher-order/switchMapTo.md) | Like `switchMap` but maps to a fixed observable *(deprecated)* |
| [switchScan](./higher-order/switchScan.md) | Like `scan` but the accumulator returns an observable, cancels previous |
| [exhaustAll](./higher-order/exhaustAll.md) | Flatten a higher-order observable, ignoring new while one is active |

### [Combination](./combination/)
Operators that combine values from multiple observables.

| Operator | Description |
|----------|-------------|
| [combineLatestAll](./combination/combineLatestAll.md) | Combine all inner observables using combineLatest strategy |
| [combineLatestWith](./combination/combineLatestWith.md) | Combine source with other observables using combineLatest |
| [concatAll](./combination/concatAll.md) | Subscribe to inner observables one at a time, in order |
| [concatWith](./combination/concatWith.md) | Append other observables sequentially after the source completes |
| [mergeAll](./combination/mergeAll.md) | Subscribe to all inner observables concurrently |
| [mergeWith](./combination/mergeWith.md) | Merge source emissions with other observables concurrently |
| [raceWith](./combination/raceWith.md) | Mirror the observable that emits first |
| [startWith](./combination/startWith.md) | Prepend synchronous values before the source |
| [endWith](./combination/endWith.md) | Append synchronous values after the source completes |
| [withLatestFrom](./combination/withLatestFrom.md) | Combine source value with the latest value from another observable |
| [zipAll](./combination/zipAll.md) | Combine inner observables using zip strategy |
| [zipWith](./combination/zipWith.md) | Pair the source with other observables by emission index |
| [onErrorResumeNextWith](./combination/onErrorResumeNextWith.md) | Continue with next observable on error or completion |
| [combineLatest](./combination/combineLatest-operator-documentation.md) | Combine latest values from multiple observables *(pre-existing)* |

### [Error Handling](./error-handling/)
Operators that handle, recover from, or react to errors.

| Operator | Description |
|----------|-------------|
| [catchError](./error-handling/catchError.md) | Catch and recover from errors by switching to another observable |
| [retry](./error-handling/retry.md) | Resubscribe to the source on error, up to N times |
| [retryWhen](./error-handling/retryWhen.md) | Resubscribe based on a notifier observable *(deprecated in v8)* |
| [repeat](./error-handling/repeat.md) | Resubscribe to the source when it completes |
| [repeatWhen](./error-handling/repeatWhen.md) | Resubscribe based on a notifier observable *(deprecated in v8)* |
| [throwIfEmpty](./error-handling/throwIfEmpty.md) | Throw an error if the source completes without emitting |

### [Utility](./utility/)
Operators for side effects, scheduling, and other pipeline utilities.

| Operator | Description |
|----------|-------------|
| [tap](./utility/tap.md) | Perform side effects without modifying the stream |
| [finalize](./utility/finalize.md) | Execute a callback on completion, error, or unsubscribe |
| [delay](./utility/delay.md) | Delay each emission by a fixed amount of time |
| [delayWhen](./utility/delayWhen.md) | Delay each emission until a per-value observable emits |
| [observeOn](./utility/observeOn.md) | Re-emit values on a specified scheduler |
| [subscribeOn](./utility/subscribeOn.md) | Subscribe to the source on a specified scheduler |
| [timeout](./utility/timeout.md) | Error if source does not emit within a time limit |
| [timeoutWith](./utility/timeoutWith.md) | Switch to another observable if source exceeds a time limit *(deprecated)* |
| [partition](./utility/partition.md) | Split a source into two observables based on a predicate |

### [Rate Limiting](./rate-limiting/)
Operators that control the rate of emissions.

| Operator | Description |
|----------|-------------|
| [debounce](./rate-limiting/debounce.md) | Emit after silence — duration controlled by an observable |
| [debounceTime](./rate-limiting/debounceTime.md) | Emit after a fixed silence duration (most common) |
| [throttle](./rate-limiting/throttle.md) | Emit, then ignore, for a duration controlled by an observable |
| [throttleTime](./rate-limiting/throttleTime.md) | Emit, then ignore, for a fixed duration |
| [audit](./rate-limiting/audit.md) | Sample the most recent value after a duration observable emits |
| [auditTime](./rate-limiting/auditTime.md) | Sample the most recent value every N milliseconds |
| [sample](./rate-limiting/sample.md) | Emit the most recent source value whenever a notifier emits |
| [sampleTime](./rate-limiting/sampleTime.md) | Emit the most recent source value at a fixed interval |

### [Multicasting](./multicasting/)
Operators that share a single subscription among multiple subscribers.

| Operator | Description |
|----------|-------------|
| [share](./multicasting/share.md) | Multicast via a Subject; auto-connects and disconnects |
| [shareReplay](./multicasting/shareReplay.md) | Multicast and replay N most recent values to late subscribers |
| [connect](./multicasting/connect.md) | Create a multicast observable with explicit subscriber coordination |

### [Buffering & Windowing](./buffering/)
Operators that collect values into arrays (buffers) or nested observables (windows).

| Operator | Description |
|----------|-------------|
| [buffer](./buffering/buffer.md) | Collect values into arrays, flushed by a notifier observable |
| [bufferCount](./buffering/bufferCount.md) | Collect values into fixed-size arrays |
| [bufferTime](./buffering/bufferTime.md) | Collect values into time-bounded arrays |
| [bufferToggle](./buffering/bufferToggle.md) | Open/close buffers with separate observables |
| [bufferWhen](./buffering/bufferWhen.md) | Close buffers when a factory-produced observable emits |
| [window](./buffering/window.md) | Emit nested observables (windows), closed by a notifier |
| [windowCount](./buffering/windowCount.md) | Emit nested observables of fixed item count |
| [windowTime](./buffering/windowTime.md) | Emit nested observables bounded by time |
| [windowToggle](./buffering/windowToggle.md) | Open/close windows with separate observables |
| [windowWhen](./buffering/windowWhen.md) | Close windows when a factory-produced observable emits |

---

## Operator Count

| Category | Count |
|----------|-------|
| Filtering | 22 |
| Transformation | 20 |
| Higher-Order Mapping | 8 |
| Combination | 14 |
| Error Handling | 6 |
| Utility | 9 |
| Rate Limiting | 8 |
| Multicasting | 3 |
| Buffering & Windowing | 10 |
| **Total** | **100** |
