import { describe, expect, it, vi } from "vitest";

import { renderQueryResults } from "../src/core/output.js";

describe("output rendering", () => {
  it("emits raw JSON only when json mode is enabled", () => {
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

    renderQueryResults(
      "users",
      [
        {
          createTime: "2025-01-01T00:00:00.000Z",
          data: { name: "Ada" },
          id: "ada",
          path: "users/ada",
          updateTime: "2025-01-01T00:00:00.000Z",
        },
      ],
      { json: true },
    );

    expect(stdoutSpy).toHaveBeenCalledOnce();
    const payload = String(stdoutSpy.mock.calls[0]?.[0]);
    expect(() => JSON.parse(payload)).not.toThrow();

    stdoutSpy.mockRestore();
  });
});
