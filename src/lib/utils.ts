export function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return ` ~${(bytes / 1024).toFixed(0)}KB`;
  return ` ~${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\-\.]/g, "_").substring(0, 60);
}

export function parseTime(input: string): number | null {
  const parts = input.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  return null;
}
