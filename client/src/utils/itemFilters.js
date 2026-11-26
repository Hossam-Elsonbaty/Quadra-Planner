function idOfType(type) {
  return String(type?._id || type || "");
}

export function filterOccurrences(
  occurrences,
  { query = "", typeId = "all", completion = "all" } = {}
) {
  const normalizedQuery = query.trim().toLowerCase();

  return occurrences.filter((item) => {
    if (normalizedQuery && !item.title.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (typeId !== "all" && idOfType(item.type) !== typeId) {
      return false;
    }
    if (completion === "open" && item.done) return false;
    if (completion === "done" && !item.done) return false;
    return true;
  });
}
