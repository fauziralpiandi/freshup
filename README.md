# 🌱 freshup

> Keep your deps fresh(up) to date

**freshup** is a lightweight utility to keep your project current without the clutter. It provides a granular, interactive overview of outdated packages, allowing you to choose your update strategy—from safe patches to latest releases—in seconds:

- ⚡ **Instant**: No installation needed. Run and go.
- 📦 **Universal**: Works with `npm`, `pnpm`, `yarn`, and `bun`.
- ⌨️ **Interactive**: Toggle updates directly in your terminal.
- 🤖 **Smart**: Intelligent version and prefix resolution.
- 🛡️ **Safe**: Preview before committing.

## Quick Start 🚀

Run this in your project root to see what's outdated:

```bash
npx freshup
```

### Preview

```sh
🌱 Freshup v0.1.0

Checking registry... Checked!

Update (latest)
  dependencies
❯ ◉ react          17.0.0  →  18.3.1
  ◉ next           14.0.0  →  15.1.0

  devDependencies
  ◉ typescript     5.0.0   →  5.7.2

- Space to toggle, Enter to confirm
```

---

## Update Strategies 🎯

Choose how aggressive you want to be:

```bash
npx freshup [mode]
```

- **`latest`** (Default): Move to the absolute latest versions.
- **`major`**: Allow breaking changes (v1 → v2).
- **`minor`**: New features, no breaks (v1.1 → v1.2).
- **`patch`**: Bug fixes only (v1.1.0 → v1.1.1).

## Advanced Flags 🛠️

| Command                 | Description                                     |
| :---------------------- | :---------------------------------------------- |
| `npx freshup --dry-run` | Preview changes without writing to file.        |
| `npx freshup --write`   | Apply updates immediately (skip prompts).       |
| `npx freshup --install` | Run install command automatically after update. |

---

<details>
<summary>Requirements & Installation</summary>

- Requires **Node.js >= 18.0.0**
- Works with **npm, yarn, pnpm, or bun**
- Global install (optional): `npm install -g freshup`
</details>

## License

[MIT License](LICENSE) © 2025 Fauzira Alpiandi
