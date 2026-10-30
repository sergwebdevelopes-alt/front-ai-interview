# Architecture and decisions

This file is the project's memory. The agent reads it at the start of every session, so decisions survive a cleared context.

## Architecture

Written by the agent from the candidate's description. What belongs here is described in `AGENTS.md`.

### Folder structure (feature-based)

```
src/
  shared/
    config.ts                     # app config read from env (apiBaseUrl)
    http/
      types.ts                    # HttpProvider interface (contract), GetOptions
      httpProvider.ts             # fetch implementation of HttpProvider
      httpError.ts                # HttpError, toHttpError(response)
    url/
      useQueryParam.ts            # useQueryParam, updateQueryParams (push/replace, popstate)
    hooks/
      useRequest.ts               # abort, request key, retry, loading/error, cache
      useDebouncedCallback.ts     # debounced function with cancel
      useLastActiveValue.ts       # last value while active (dialog content during close)
    cache/requestCache.ts         # in-memory cache: 5 min fresh, 50 entries; clear() for tests
    errors/toError.ts             # unknown → Error
    ui/
      ErrorAlert.tsx              # error Alert with a Retry button
      ErrorBoundary.tsx           # render-error boundary, fallback ErrorAlert, resetKey
      CloseIcon.tsx               # close icon (SvgIcon, no icon library)
      focusRing.ts                # shared keyboard-focus outline style
      visuallyHidden.ts           # style for screen-reader-only content
  features/products/
    domain/                       # pure TS: no React, fetch or URL
      product.ts                  # Product, Review, ProductListItem, ProductListPage
      sort.ts, pagination.ts, search.ts, productId.ts   # business rules
      errors.ts                   # ProductNotFoundError
      productsRepository.ts       # ProductsRepository interface (getCatalog, search, getById)
      catalogState.ts             # CatalogState interface (skip, sort, query)
      productSelection.ts         # ProductSelection (state + actions), ProductSelectionActions
    infrastructure/               # implementations of the domain interfaces
      httpProductsRepository.ts   # via httpProvider; API response types live here
      urlCatalogState.ts          # CatalogState in ?skip, ?sortBy, ?order, ?q
      urlProductSelection.ts      # ProductSelection in ?productId; actions without subscribing
      index.ts                    # the one place that picks implementations
    application/                  # use cases as hooks
      useProductsList.ts, useProductSearch.ts, useProductDetails.ts, useOpenProduct.ts
    ui/                           # components; *Container files wire a use case, the rest only render
      utils.ts                    # formatPrice, formatDate
      ProductsSearch/             # ProductsSearch, ProductsSearchContainer
      ProductsTable/              # ProductsTable, ProductsTableContainer, columns (config, px widths),
                                  # TableStateRows, SingleLineText, resultsAnnouncement (live-region text)
      ProductDialog/              # ProductDialog, ProductDialogContainer, LazyProductDialog,
                                  # one component per section, Section/InfoRow
  test/                           # test-only helpers (not in the app build)
    setup.ts                      # jest-dom matchers; after each test: cleanup, cache clear, URL reset
    fakeProductsRepository.ts     # typed vi.fn repository + deferred()
    inMemoryProductsRepository.ts # makeCatalog(n) + repository with real paging, sort, search, 404
    productFixtures.ts            # makeListItem(), makeProduct()
  App.tsx                         # layout only: renders the *Container components
  App.test.tsx                    # full-app tests with the in-memory repository
  main.tsx                        # theme, CssBaseline, root ErrorBoundary
```

Tests live next to the code as `*.test.ts(x)` (for example `domain/sort.test.ts`, `ui/ProductsTable/ProductsTable.test.tsx`).

### Layers and data flow

`ui → application → domain ← infrastructure`. `App.tsx` only lays out the three `*Container` components; each container calls its use case and passes the result to the presentational component next to it, so state changes re-render only that part of the page (typing re-renders the search input; opening a product re-renders the dialog, not the table).

- `domain` holds the types, the business rules and the interfaces (`ProductsRepository`, `CatalogState`, `ProductSelection`). It doesn't depend on anything else.
- `infrastructure` implements those interfaces. `infrastructure/index.ts` exports only the chosen implementations (`productsRepository`, `useCatalogState`, `useProductSelection`, `useProductSelectionActions`). `useProductSelectionActions` only writes and doesn't subscribe, so the table can open a product without re-rendering when it changes. Switching a source, for example `?productId` → React state, means writing a new implementation and changing one line in `index.ts`. A non-URL implementation of `CatalogState` must be a shared store, because several hooks read it.
- `application` hooks import implementations only from `infrastructure/index.ts`, never from the URL, `fetch` or `HttpError`. They hold the business rules: the empty query → `getCatalog`, otherwise `search`; a sort change or a new query resets `skip`; a `skip` past the last page is corrected to the last page.
- In `ui`, only `*Container` components import from `application`; all other components only render props and call callbacks.
- Requests go through `shared/hooks/useRequest`. Each request has a key built from all its inputs, prefixed per use case (`products:`, `product:`), and its own `AbortController`; a response for an outdated key is ignored. Successful responses go into `shared/cache/requestCache`: cached data shows immediately, entries older than 5 minutes are refreshed in the background, a failed refresh keeps the cached data, and Retry bypasses the cache.
- The product dialog is loaded with `React.lazy` on first open (`LazyProductDialog`) and stays mounted afterwards. While closing, it keeps showing its last content (`useLastActiveValue`).
- Render errors are caught by `ErrorBoundary` at three levels: the root (`main.tsx`), the table and the dialog content. The fallback is `ErrorAlert` with Retry; the table resets on query/page/sort change, the dialog on product change.
- `httpProvider` is a plain object that wraps `fetch` and implements the `HttpProvider` interface. There is no DI. For now it has only `get`. The base URL comes from `config.apiBaseUrl` (`VITE_API_BASE_URL` in `.env`; `.env` is git-ignored, `.env.example` is committed as the template). On a non-2xx response it throws an `HttpError` (status and the API `message`); errors are built in `httpError.ts`. Every request times out after `config.httpTimeoutMs` (5 s; `timeoutMs` per call overrides it) and then throws `RequestTimeoutError`; the timeout is combined with the caller's abort signal, and a cancel is not reported as a timeout. The repository turns a 404 on `getById` into `ProductNotFoundError`.
- Catalog is a short table with the columns brand, model, description, category and price. The list request asks only for these fields (`select=brand,title,description,category,price`). Model is `title`. A missing `brand` is shown as "—".
- Pagination is server-side: 20 per page, `limit=20&skip=…`.
- Opening the modal makes a separate request, `GET /products/:id`, and the modal shows all the product's data.

### UI state in the URL

`?q=phone&sortBy=price&order=asc&skip=20&productId=12`: `q` is the search query, `sortBy` and `order` the sort, `skip` the current page offset. `productId` is present only while the modal is open. Several params changed together are written as one history entry (`updateQueryParams`). A `skip` past the last page is replaced (`replaceState`) with the last page once the total is known.

### Loading, error and empty states

- Table: `Skeleton` rows while loading; an `ErrorAlert` (an `Alert` with a Retry button) on error (for example, catalog unavailable); a single "No products" row when the list is empty, or "No results for …" with a Clear search button when a search finds nothing.
- Dialog: the same pattern inside `DialogContent`. If the product is not found (404), it shows "Product not found". A ✕ button (`aria-label="Close"`), the Close button, Esc and a click outside close it.
- Keyboard: table rows open the product with Enter or Space. Rows and sort headers have a visible outline on keyboard focus.
- Screen readers: the table is named "Products" and has `aria-busy` while loading; a polite live region (`role="status"`) announces the result after each load ("194 products, page 2 of 10", "23 results for “phone”, page 1 of 2", "No results for …") and is empty while loading. A request timeout shows the usual `ErrorAlert` ("Request timed out after 5 s") with Retry.

### Naming

camelCase files for code (`httpProvider.ts`, `useProductsList.ts`), PascalCase files for components (`ProductsTable.tsx`). Named exports everywhere except `App`. Implementations are named after what they're built on (`httpProductsRepository`, `useUrlCatalogState`). No comments in code.

Imports: anything that leaves the current folder uses the `@/` alias for `src/` (`'@/shared/ui/ErrorAlert.tsx'`); same-folder imports stay `./`. Extensions are kept. The alias is configured in `tsconfig.app.json` (`paths`) and `vite.config.ts` (`resolve.alias`).

### Definition of done

The candidate reviews each chunk manually and approves it. `npm run typecheck` and `npm run lint` must pass (AGENTS.md), and so must `npm test`. Every new or changed behaviour comes with tests.

## Decisions

Entries are added by the agent once the candidate confirms them. The format is described in `AGENTS.md`.

### 1. HTTP layer
- Context: the app needs a single way to call the API.
- Decision: a plain `httpProvider` object (`{ get, post, put, ... }`) that wraps `fetch`, with no DI. It throws `HttpError` on non-2xx responses.
- Why: keeps the architecture simple; requests are not scattered as raw `fetch` calls. A result-object return was rejected because every call site would have to check it.

### 2. Feature-based folders
- Context: deciding where API, state and components live.
- Decision: `src/shared/` for cross-feature code, and `src/features/products/{api,types,hooks,components}`.
- Why: product code stays together. Layered and flat structures were rejected.

### 3. Business logic in custom hooks
- Context: how components get data.
- Decision: custom hooks own fetching, state and URL sync, and components only render.
- Why: keeps logic out of components. TanStack Query was rejected (new dependency), and so was fetching inside components.

### 4. UI state in URL query params
- Context: where the current page and the open product live.
- Decision: `?skip=…&productId=…` via the History API, with no router.
- Why: survives reload and can be shared. Local state was rejected (lost on reload), and so was React Router (new dependency).

### 5. Server-side pagination
- Context: the table shows 20 products per page out of 194.
- Decision: request each page with `limit=20&skip=…`.
- Why: matches a real back office. Loading everything and paging on the client was rejected.

### 6. Short list data, full product on open
- Context: the table shows short info; the modal shows the full product page.
- Decision: the list uses `select=brand,title,description,category,price` (Model = `title`, missing brand shown as "—"). The modal triggers `GET /products/:id`.
- Why: a smaller list payload; full data is loaded only when needed.

### 7. Loading, error and empty conventions
- Context: consistent states across the table and modal.
- Decision: `Skeleton` while loading, `Alert` with Retry on error, an empty row for no results, and "Product not found" for 404.
- Why: chosen over a spinner-based approach.

### 8. httpProvider has only `get`
- Context: the dummyjson API is used read-only.
- Decision: `httpProvider` exposes only `get`; other methods are added when needed.
- Why: no unused code. A full `{ get, post, put, delete }` set was rejected for now.

### 9. HTTP layer split into contract, implementation and errors
- Context: keeping `httpProvider` clean.
- Decision: `shared/http/types.ts` (the `HttpProvider` interface), `httpProvider.ts` (fetch implementation), `httpError.ts` (`HttpError` and building it from a response).
- Why: feature APIs depend on the contract, and error handling is kept out of the provider. Two-file and class-only splits were rejected.

### 10. Base URL from env
- Context: `BASE_URL` should not be hardcoded in `httpProvider`.
- Decision: `VITE_API_BASE_URL` in `.env`, read once in `shared/config.ts`.
- Why: it can change per environment without code changes. A plain constant and a `createHttpProvider(baseUrl)` factory were rejected.

### 11. Naming
- Context: a consistent file and export style.
- Decision: camelCase files for code, PascalCase files for components, named exports (except `App`).
- Why: chosen over kebab-case files.

### 12. URL `skip` handling
- Context: `?skip` can be edited by hand to invalid values.
- Decision: non-numbers and negatives become 0, and other values snap down to a page boundary. A skip past the end shows the empty row while pagination shows the last page. Each page change uses `pushState`. The first page has no `skip` in the URL.
- Why: Back steps through pages, and the API never gets odd offsets. Passing skip through unchanged and `replaceState` were rejected.

### 13. Table formatting
- Context: how prices and long descriptions are displayed.
- Decision: prices in USD via `Intl.NumberFormat` ($9.99); descriptions cut at 2 lines with an ellipsis.
- Why: keeps rows compact. Full descriptions and raw numbers were rejected.

### 14. Sorting
- Context: every column header should sort the catalog.
- Decision: sorting is done by the API (`sortBy` + `order`), with `?sortBy&order` in the URL. Clicking a header cycles asc → desc → off; another column starts at asc. A sort change resets `skip`, in one history entry. Invalid values in the URL mean no sorting.
- Why: the order is correct across all pages. Sorting only the current page, keeping `skip` and local state only were rejected.

### 15. Search
- Context: search by title and description.
- Decision: `?q` in the URL, written 200 ms after typing stops with `replaceState`. A new query resets `skip` and keeps the sort; input is trimmed. Previous requests are aborted. No results shows a Clear search button.
- Why: consistent with the rest of the URL state, and Back doesn't step through partial queries. Local state only, `pushState` while typing, resetting the sort and a minimum query length were rejected.

### 16. Four layers per feature
- Context: business logic was mixed with URL, fetching and rendering in single hooks and components.
- Decision: `domain`, `infrastructure`, `application`, `ui` inside each feature, with dependencies `ui → application → domain ← infrastructure`.
- Why: each layer has one job, and rules are pure TS. Keeping the old folders and only adding `domain/` was rejected.

### 17. Domain interfaces, implementations chosen in `infrastructure/index.ts`
- Context: the open product is in the URL today but might live in state tomorrow; the same goes for the catalog state and the API.
- Decision: interfaces in `domain/`, split by topic (`productsRepository.ts`, `catalogState.ts`, `productSelection.ts`). Implementations in `infrastructure/`, and `index.ts` is the one place that picks them. No DI.
- Why: switching a source is a new file plus one line. Passing implementations as hook arguments and a React Context provider were rejected; a single `ports.ts` / `contracts.ts` file and the name `bindings.ts` were rejected.

### 18. Shared `useRequest`
- Context: abort, request key, retry and loading/error logic was duplicated in two hooks.
- Decision: `shared/hooks/useRequest({ key, run } | null)` returns `{ data, error, isLoading, retry }`.
- Why: one place for cancelation and race handling. Keeping the logic per hook was rejected.

### 19. Separate catalog and search in the repository
- Context: one `getList` branched on the query inside the repository.
- Decision: `ProductsRepository` has `getCatalog`, `search` and `getById`. The use case picks `search` when there is a query.
- Why: the repository doesn't hold business rules. Private helpers behind one method and two separate repositories were rejected.

### 20. Domain error for a missing product
- Context: the details use case checked `HttpError.status === 404`.
- Decision: the repository turns a 404 into `ProductNotFoundError` (`domain/errors.ts`).
- Why: use cases don't depend on HTTP.

### 21. UI split
- Context: the table and dialog were large single files.
- Decision: table columns are a config (`columns.tsx` with `render`), state rows in `TableStateRows.tsx`, the dialog has one component per section, the error Alert is shared (`shared/ui/ErrorAlert.tsx`), formatters live in `ui/utils.ts`.
- Why: a new column is one entry; each component has one job.

### 22. Pending search write skipped after Back/Forward
- Context: typing and pressing Back within 200 ms wrote the pending search into the restored URL.
- Decision: each debounced write remembers the `q` it was scheduled for and is skipped if `q` changed in the meantime.
- Why: no extra effect, and the input already syncs to the restored query.

### 23. Dialog keeps its content while closing
- Context: the content cleared immediately, so the closing animation showed an empty dialog.
- Decision: `shared/hooks/useLastActiveValue` in the UI keeps the last open view during the fade-out.
- Why: a display concern, so `useProductDetails` and the URL logic stay unchanged.

### 24. Containers for colocated state
- Context: all hooks lived in `App`, so typing or opening a product re-rendered the whole page.
- Decision: `features/products/containers/` wire one use case to one `ui` component; `App` only lays them out. Clear search moved to `useProductsList`. The table opens products through `useOpenProduct`, built on `ProductSelectionActions`, which don't subscribe to the selection.
- Why: each state change re-renders only its part of the page. A local component in `App.tsx` was rejected.

### 25. Lazy-loaded product dialog
- Context: the dialog code was in the initial bundle although it's needed only after a click.
- Decision: `LazyProductDialog` with `React.lazy`; nothing loads before the first open, then the dialog stays mounted. A `Backdrop` with `CircularProgress` shows while the file loads.
- Why: smaller initial JS (about 7 kB gzip); MUI itself stays in the main bundle.

### 26. Request cache
- Context: going back to a page, re-sorting or reopening a product refetched and showed skeletons.
- Decision: `shared/cache/requestCache` in memory, used by `useRequest`: fresh for 5 minutes, then refreshed in the background; at most 50 entries; only successful responses; a failed background refresh keeps the cached data; Retry bypasses the cache.
- Why: instant navigation to data already seen. Always refetching and never refetching were rejected.

### 27. Skeletons kept on page and sort changes
- Context: keeping previous rows with a progress bar while loading was considered.
- Decision: not done; decision 7 stays.
- Why: skeletons are fine for this task.

### 28. Error boundaries
- Context: a render error blanked the whole page.
- Decision: `shared/ui/ErrorBoundary` (own class component) at the root, around the table and around the dialog content; fallback `ErrorAlert` with Retry; automatic reset via `resetKey` (table: query/page/sort, dialog: product).
- Why: a crash in one part doesn't take down the others. Table/dialog only, root only and a page reload as recovery were rejected; `react-error-boundary` was not added.

### 29. Keyboard and close button
- Context: rows opened only with Enter, and the dialog had no ✕ button.
- Decision: rows open with Enter or Space; an `IconButton` with `aria-label="Close"` in the dialog header, using `shared/ui/CloseIcon` (an inline `SvgIcon`). Rows and sort headers show a 2px primary-colored outline on keyboard focus only (`:focus-visible` on rows, `.Mui-focusVisible` on `TableSortLabel`), using the shared `focusRing(offsetPx)` style from `shared/ui/focusRing.ts`.
- Why: standard keyboard behaviour without a new dependency (`@mui/icons-material` not added). The search field keeps its `label`, which is already linked to the input.

### 30. `@/` import alias
- Context: deep relative imports like `../../../../shared/...`.
- Decision: `@/` → `src/` for every import that leaves the current folder; same-folder imports stay `./`.
- Why: imports don't change when files move within the tree. Aliasing only 2+ levels up and aliasing everything were rejected.

### 31. Stable table layout
- Context: columns jumped while sorting, searching and paging, because the default auto layout sizes columns from their current content.
- Decision: `tableLayout: 'fixed'` with `px` widths in the column config (Brand 160, Model 220, Category 140, Price 110; Description takes the rest, at least 320). The table has `minWidth` computed from the config (`PRODUCT_TABLE_MIN_WIDTH`) and scrolls horizontally on narrow screens. Short columns are one line with an ellipsis and the full text in `title` (`SingleLineText`); the description always takes 2 lines; skeleton rows have the same height as data rows.
- Why: widths and row heights don't depend on the data. Percentage widths were rejected (too narrow on mobile), and so was wrapping long names (rows would change height).

### 32. `.env` not committed
- Context: environment values shouldn't live in git.
- Decision: `.env` is in `.gitignore`; `.env.example` with `VITE_API_BASE_URL` is committed, and the README says to copy it.
- Why: each environment keeps its own values; the template documents which variables are needed.

### 33. Tests
- Context: the project had no test runner; the code should be covered by tests.
- Decision: Vitest + Testing Library (`@testing-library/react`, `user-event`, `jest-dom`) + jsdom as exact-version devDependencies. Config in `vite.config.ts` (`test` block, reuses the `@/` alias and React plugin); `tsconfig.test.json` type-checks tests, `tsconfig.app.json` excludes them. Tests live next to the code as `*.test.ts(x)` and cover every layer: domain, shared, infrastructure, application, ui. Use-case tests swap only `productsRepository` by mocking `infrastructure/index.ts` and keep the real URL hooks; `requestCache.clear()` runs after each test. Scripts: `npm test`, `npm run test:watch`.
- Why: covers logic, hooks and components with the existing Vite setup. Vitest only (no hooks/components) and Vitest + jsdom without Testing Library were rejected; `__tests__/` folders and a top-level `tests/` were rejected.

### 34. Request timeout
- Context: a hung API kept the skeletons on screen forever.
- Decision: `httpProvider.get` times out after `config.httpTimeoutMs` (5 s); `GetOptions.timeoutMs` overrides it per call. `AbortSignal.timeout` is combined with the caller's signal via `AbortSignal.any`, so canceling still works. A timeout throws `RequestTimeoutError` ("Request timed out after 5 s"); a cancel by the caller stays an `AbortError` and is not reported as a timeout.
- Why: a hang becomes the usual error with Retry. 10 s and 30 s were rejected; a fixed timeout without override and per-call-only timeouts were rejected; passing the raw browser error through was rejected.

### 35. `skip` past the last page jumps to the last page
- Context: `?skip=500` showed "No products" although there are 194 (supersedes the "empty row" part of decision 12).
- Decision: once the response shows that `skip` is past the last page, `useProductsList` corrects the URL to the last page with `replaceState`; until then the list reports loading, so no empty page flashes. Rules in the domain: `lastPageSkip(total)`, `isPastLastPage(skip, total)`. A search past the first page with no results goes to the first page and keeps `q`.
- Why: the user always sees products, and Back doesn't return to the bad URL. A "This page doesn't exist" message with a button and jumping to the first page were rejected.

### 36. Screen-reader support for the table
- Context: loading and results weren't announced, and the table had no accessible name.
- Decision: `aria-label="Products"` and `aria-busy` on the table; a visually hidden, always-mounted `role="status"` region announces results and page after each load and is empty while loading. Text comes from `describeResults()` (`ui/ProductsTable/resultsAnnouncement.ts`); the hiding style is `shared/ui/visuallyHidden.ts`.
- Why: screen readers hear what changed without extra noise while paging. Announcing "Loading…" and announcing results without the page were rejected.

### 37. Full-app tests
- Context: the `*Container` components and the wiring between layers had no test.
- Decision: `src/App.test.tsx` renders the real `App` and swaps only `productsRepository` for `createInMemoryProductsRepository(makeCatalog(45))` (real paging, sort, search, 404). It covers first page, paging, sorting, search with debounce and Clear search, opening and closing a product, restoring state from the URL, not found and Retry.
- Why: one place that checks the whole flow end to end in jsdom, without mocking the URL, cache or `*Container` components.

### 38. Containers live in `ui`, next to their component
- Context: a separate `features/products/containers/` folder looked like its own layer, although containers are UI too (supersedes the folder part of decision 24).
- Decision: each `*Container` sits in the folder of the component it wires: `ui/ProductsSearch/`, `ui/ProductsTable/`, `ui/ProductDialog/` (`ProductsSearch.tsx` moved into its own folder). Only `*Container` files import from `application`; the other components stay presentational. Dependency direction: `ui → application → domain ← infrastructure`.
- Why: a component and its wiring are found together, with one layer fewer. A `ui/connected/` subfolder and merging each container into its component were rejected.
