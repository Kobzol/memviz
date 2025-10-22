// Execute `fn` while disabling the global panning and zooming logic
export function withDisabledPanZoom(fn: () => void) {
  const transform = document.body.style.removeProperty("transform");
  try {
    fn();
  } finally {
    document.body.style.setProperty("transform", transform);
  }
}
