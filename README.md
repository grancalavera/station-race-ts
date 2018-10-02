#station-race-ts

## Keep in mind

### Predifined types in lib.d.ts

```typescript
type Partial<T> = { [P in keyof T]?: T[P] };
```

## Troubleshooting

- running out of inotify user watches https://unix.stackexchange.com/questions/13751/kernel-inotify-watch-limit-reached
