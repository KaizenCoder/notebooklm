# Accessibility Enhancements (FE without orchestrator)

- Skip link added (`<SkipLink />`) at top of app; main container has `id="main-content"` (Notebook route)
- DevBanner only in dev; no a11y impact
- AudioPlayer and ChatArea a11y notes documented for quick review

Run a11y tests:
- `npm run test:e2e` (includes axe-core spec for chat)
