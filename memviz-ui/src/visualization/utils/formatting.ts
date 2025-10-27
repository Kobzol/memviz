export function formatLocation(file: string | null, line: number): string {
  let result = file;
  if (file?.includes("/")) {
    const segments = file.split("/");
    result = segments[segments.length - 1];
  }
  return `${result ?? "<unknown-file>"}:${line}`;
}
