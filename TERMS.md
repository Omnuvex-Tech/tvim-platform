# tvim-platform Project Terms

## 1. No Fallback Values for Environment Variables

Environment variables must **never** have fallback/default values using `??`, `||`, or any other operator.

**Wrong:**
```ts
process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
```

**Correct:**
```ts
process.env.NEXT_PUBLIC_APP_URL
process.env.NEXT_PUBLIC_API_URL
```

All configuration values must come from `.env` files. If an env variable is missing, the app should fail explicitly rather than silently using a default value.

## 2. Indentation: 1 Tab = 4 Spaces

All files must use **4 spaces** for indentation. No tabs, no 2-space indentation.

## 3. No Comments

No comment lines (`//`, `/* */`, `<!-- -->`) are allowed in any file. Code must be self-explanatory through clear naming and structure.

## 4. No Unnecessary console.log

`console.log` must not exist in the codebase. If logging is needed, it must be handled through a dedicated logging mechanism — never raw `console.log`.

## 5. Function Expressions Only

Use **arrow function expressions** (`const fn = () => {}`), never function declarations (`function fn() {}`).

## 6. Types and Interfaces in @repo/types

All `type` and `interface` definitions must live in `packages/types`. Organized by domain:

```
packages/types/src/
    types/
        web/        ← frontend types
        api/        ← backend types
    interfaces/
        web/        ← frontend interfaces
        api/        ← backend interfaces
```

Each domain folder contains purpose-specific files (e.g., `error.ts`, `notify.ts`, `response.ts`) with a barrel `index.ts`. No inline type definitions in components or classes.

## 7. Component Folder Structure

Every component in `packages/ui` must be in its own **PascalCase folder** with a barrel `index.ts`:

```
components/
    Button/
        button.tsx
        index.ts
    Card/
        card.tsx
        index.ts
```

No flat component files directly in `components/`.

## 8. Styles Folder Structure

Styles in `packages/ui` follow the same folder pattern inside `src/styles/`:

```
styles/
    index.css              ← entry point
    Globals/
        globals.css
```

## 9. Classes in App Scope

Application-specific classes (e.g., `ApiResponse`) live in `apps/tvim-web/classes/`, not in shared packages. Only truly shared utilities belong in `packages/shared`.

## 10. Separation of Concerns in Packages

- `@repo/types` — Type and interface definitions only (zero runtime cost)
- `@repo/shared` — Shared runtime utilities (normalizer, guards)
- `@repo/ui` — React components and styles
- `@repo/typescript-config` — TypeScript configurations
- `@repo/eslint-config` — ESLint configurations
