# pterocli

simple user-focused cli for interacting with pterodactyl servers

## installation

```bash
npx pterocli --key=ptlc_myawesomekeyhere --url=https://example.com --server=12345678
```

### manual
```bash
bun install
```

```bash
bun run index.ts
```

## roadmap!

- [ ] separate websocket / ptero stuff into library
- [x] allow stdin to send commands
- [ ] setup exe build with bun (https://runspired.com/2025/01/25/npx-executables-with-bun.html ?)
      other qol maybe:
- [ ] allow env vars instead of just cli flags
