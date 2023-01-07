import { pathJoin } from '../src/content/utils'

describe('pathJoin function', () => {
  test('joins an array of strings into a path', () => {
    expect(pathJoin(['path', 'to', 'file'])).toBe('path/to/file');
    expect(pathJoin(['path', 'to', 'file'], '/')).toBe('path/to/file');
    expect(pathJoin(['path', 'to', 'file'], '\\')).toBe('path\\to\\file');
  });

  test('replaces multiple separators with a single separator', () => {
    expect(pathJoin(['path//to', 'file'])).toBe('path/to/file');
    expect(pathJoin(['path\\\\to', 'file'], '\\')).toBe('path\\to\\file');
  });

  test('uses the default separator if none is provided', () => {
    expect(pathJoin(['path', 'to', 'file'])).toBe('path/to/file');
  });
});
