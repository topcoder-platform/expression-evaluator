# Expression Evaluator

This is a very simple version of a compiler expression evaluation. It can be used for parsing expressions without introducing the risk of script injection via `eval` method.

# Submission

For now we always should include updated prebuilt code into the repository. As for now for quick development we include this npm module directly as git repository.

To do so, run before commit:
```sh
npm run prepublish
```

# Commands

- `npm run clean` - Remove `lib/` directory
- `npm test` - Run tests with linting and coverage results.
- `npm run lint` - Run ESlint with airbnb-config
- `npm run build` - Babel will transpile ES6 => ES5 and minify the code.
- `npm run prepublish` - Hook for npm. Do all the checks before publishing your module.

# License

MIT © Topcoder Inc.
