# 🌱 Freshup

> A personal tool to keep dependencies fresh, minus the headache.

I built **Freshup** because I found the process of updating dependencies tedious. I wanted a quick way to see what's outdated, choose exactly what to update (patch, minor, or major), and get on with my work—without manually checking versions or editing `package.json`.

It works for me, and if you use **npm**, **pnpm**, **yarn**, or **bun**, it might work for you too.

## Why use it?

- **It's Interactive:** Instead of blindly updating everything, I can pick and choose.
- **It's Granular:** Sometimes I only want bug fixes (`patch`), sometimes I'm ready for new features (`minor`).
- **It's Safe-ish:** It has a `--dry-run` mode so I can see what happens before committing.

## Usage

You don't need to install it. Just run it in your project root:

```bash
npx @fauziralpiandi/freshup
```

### Modes

By default, it checks for the **latest** versions. But you can be specific about your strategy:

```bash
npx @fauziralpiandi/freshup patch  # Just bug fixes
npx @fauziralpiandi/freshup minor  # New features
npx @fauziralpiandi/freshup major  # I like living dangerously
```

### Options

| Flag            | Description                                                     |
| :-------------- | :-------------------------------------------------------------- |
| `-d, --dry-run` | See what would change without actually touching `package.json`. |
| `-w, --write`   | Skip the selection and update everything immediately.           |
| `-i, --install` | Run `npm install` (or equivalent) right after updating.         |

## License

[MIT](LICENSE) © 2025 Fauzira Alpiandi
