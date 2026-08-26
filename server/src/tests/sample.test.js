import { describe, it, expect } from 'vitest';

describe('Sample Test Suite', () => {
  it('should pass this basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify array methods', () => {
    const arr = [1, 2, 3];
    arr.push(4);
    expect(arr).toHaveLength(4);
    expect(arr).toContain(4);
  });
});
