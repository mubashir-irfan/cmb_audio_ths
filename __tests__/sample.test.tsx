import "@testing-library/jest-dom";

describe("Dummy Test", () => {
  it("checks if true is true", () => {
    expect(true).toBe(true);
  });

  it("adds numbers correctly", () => {
    const sum = 2 + 3;
    expect(sum).toBe(5);
  });

  it("checks an array contains an item", () => {
    const fruits = ["apple", "banana", "orange"];
    expect(fruits).toContain("banana");
  });
});
