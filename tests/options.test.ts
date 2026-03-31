import { describe, expect, it } from "vitest";

import { parseLiteral, parseOrderBy, parseSelect, parseWhereClause } from "../src/cli/options.js";
import { ValidationError } from "../src/core/errors.js";

describe("parseLiteral", () => {
  it("parses JSON primitives", () => {
    expect(parseLiteral("42")).toBe(42);
    expect(parseLiteral("true")).toBe(true);
    expect(parseLiteral("null")).toBeNull();
  });

  it("falls back to strings for invalid JSON", () => {
    expect(parseLiteral("{bad json")).toBe("{bad json");
    expect(parseLiteral("hello")).toBe("hello");
  });
});

describe("parseWhereClause", () => {
  it("parses field, operator, and value", () => {
    expect(parseWhereClause("age,>=,21")).toEqual({
      field: "age",
      operator: ">=",
      value: 21,
    });
  });

  it("requires array literals for array membership operators", () => {
    expect(() => parseWhereClause("status,in,active")).toThrow(ValidationError);
  });
});

describe("parseOrderBy", () => {
  it("defaults to ascending sort", () => {
    expect(parseOrderBy("createdAt")).toEqual({
      direction: "asc",
      field: "createdAt",
    });
  });
});

describe("parseSelect", () => {
  it("splits comma-separated fields", () => {
    expect(parseSelect("name,email")).toEqual(["name", "email"]);
  });
});
