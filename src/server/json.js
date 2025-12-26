function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const sorted = {};
    Object.keys(value)
      .sort()
      .forEach((key) => {
        sorted[key] = sortValue(value[key]);
      });
    return sorted;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}
