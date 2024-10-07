# Change Log

## Dev

- Added support for visualizing structures.
- Added support for visualizing enums.

## 0.3.0

- Improve robustness of dynamic memory allocation tracking.
  - It should now work properly, without causing debugging issues.
- Added visualization of allocations on the heap.
- Added highlighting of freed heap allocations.

## 0.2.1

- Add an option to disable dynamic allocation tracking.
  - The tracking is not very robust yet and in certain cases it can break debugging.
- Fix some cases where an unexpected breakpoint exception would be shown to the user
  during debugging.
- Add simple heuristic to make pointer arrows layout a bit smarter.
- Fix an edge case when loading invalid C strings.
- Add simple UI configuration.
  - Currently it allows you to turn off displaying pointers as arrows.
  - The configuration is currently not persisted.

## 0.2.0

- Add visualization of pointers using arrows.
- Add text visualization of string pointers and char arrays.
- Add a configuration panel to the `Run & Debug` activity view.
- Add simple UI configuration settings in the rendered webview.
- Show a notification when an error occurs.
- Improve rendering of (hierarchical) tooltips.

## 0.1.3

- Add simple visualization of arrays.
- Add simple visualization of chars.
- Prettier styling.

## 0.0.1

- Visualization of scalar (int, float, bool) stack variables.
