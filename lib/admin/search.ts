export function matchesSearchQuery(
  query: string,
  values: Array<string | number | boolean | null | undefined>
) {
  const term = query.trim().toLowerCase()
  if (!term) return true

  return values.some((value) =>
    value === null || value === undefined
      ? false
      : String(value).toLowerCase().includes(term)
  )
}
