# 🌱 freshup

> Keep our deps fresh(up) to date

Updating deps manually is a vibe killer. I built **freshup** to fix that—check outdated packages, pick your strategy (patch/minor/major), and get back to shipping. No more version-checking mental gymnastics.

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
