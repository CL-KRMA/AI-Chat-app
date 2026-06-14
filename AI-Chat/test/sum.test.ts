function sum(a: number, b: number): number {
  return a + b;
}

test('addition de 2 + 3 = 5', () => {
  expect(sum(2, 3)).toBe(5);
});
