import { vi } from "vitest";

if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}
