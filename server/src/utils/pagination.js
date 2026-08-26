const buildCursorQuery = (baseQuery, options) => {
  const { cursor, sortBy, sortOrder } = options;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortDirection, _id: sortDirection };

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString());
      const op = sortOrder === 'desc' ? '$lt' : '$gt';
      const cursorCondition = {
        $or: [
          { [sortBy]: { [op]: decoded.value } },
          { [sortBy]: decoded.value, _id: { [op]: decoded.id } },
        ],
      };
      return { query: { ...baseQuery, ...cursorCondition }, sort };
    } catch { return { query: baseQuery, sort }; }
  }
  return { query: baseQuery, sort };
};

const encodeCursor = (sortValue, id) =>
  Buffer.from(JSON.stringify({ value: sortValue, id })).toString('base64url');

module.exports = { buildCursorQuery, encodeCursor };
