# STRICT POLICY: No Lazy Fallbacks for Core SDK Dependencies

The AI agent MUST follow these absolute rules during coding and package installation. Any work packet that violates these rules will be immediately marked as FAIL.

## 1. NEVER Create Fallback UI When Core SDK Installation Fails
If App-in-Toss SDK (`@apps-in-toss/web-framework`), TDS (`@toss/tds-mobile`), or any platform-required design system fails to install, **NEVER build custom UI (Custom CSS, Tailwind) or mock the functionality as a workaround.**
- FORBIDDEN: "The package is missing, so I'll create similar-looking HTML/CSS components instead."
- FORBIDDEN: Removing the dependency from `package.json` to make the build pass.

## 2. ETARGET / Package Not Found Error Resolution Manual
When `No matching version found` or `ETARGET` error occurs, DO NOT assume the package is private.
1. **Check versions:** Verify if a specific version (e.g., `^1.0.0`) is hardcoded. Run `npm view [package-name] versions` to see available versions.
2. **Use latest:** Install with `npm install [package-name]@latest`.
3. **Use official CLI:** If manual installation keeps failing, switch to the platform's official CLI (e.g., `npx ait init`) to generate the boilerplate.

## 3. Escalation Obligation
If the dependency issue is not resolved after 2+ attempts, **DO NOT write hacky code to pass tests. Abort the pipeline immediately.**
- Tag the error log with `[CRITICAL_DEPENDENCY_ERROR]` and escalate to Opus model or request human intervention.
- In the Toss ecosystem (App-in-Toss), apps without TDS are 100% rejected during review. A clean abort is always better than "working garbage."
