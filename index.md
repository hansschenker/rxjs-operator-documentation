---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: RxJS Operators
  text: A formal spec for every pipeable operator
  tagline: 100 operators across 9 categories — each with its signature, marble diagram, three runnable examples, and the pitfalls that bite in practice. Documented with a consistent eight-policy framework.
  actions:
    - theme: brand
      text: Browse Operators
      link: /operators-claude/transformation/map
    - theme: alt
      text: Authoring Standard
      link: /SKILL

features:
  - title: Transformation
    details: 'map, scan, mergeMap, switchMap, concatMap, groupBy, expand …'
    link: /operators-claude/transformation/map
  - title: Filtering
    details: 'filter, take, takeUntil, distinctUntilChanged, defaultIfEmpty …'
    link: /operators-claude/filtering/filter
  - title: Combination
    details: 'combineLatestWith, zipWith, withLatestFrom, startWith, mergeWith …'
    link: /operators-claude/combination/combineLatestWith
  - title: Higher-Order Mapping
    details: 'switchAll, exhaustAll, mergeScan, switchScan, concatMapTo …'
    link: /operators-claude/higher-order/switchAll
  - title: Rate Limiting
    details: 'debounceTime, throttleTime, auditTime, sampleTime …'
    link: /operators-claude/rate-limiting/debounceTime
  - title: Buffering & Windowing
    details: 'buffer, bufferTime, window, windowToggle, bufferWhen …'
    link: /operators-claude/buffering/buffer
  - title: Error Handling
    details: 'catchError, retry, retryWhen, repeat, throwIfEmpty …'
    link: /operators-claude/error-handling/catchError
  - title: Utility
    details: 'tap, delay, finalize, timeout, partition, observeOn …'
    link: /operators-claude/utility/tap
  - title: Multicasting
    details: 'share, shareReplay, connect'
    link: /operators-claude/multicasting/share
---
