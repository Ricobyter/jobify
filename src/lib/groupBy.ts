export function groupBy<T>(items: readonly T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item)
    const currentGroup = groups[key]

    if (currentGroup == null) {
      groups[key] = [item]
      return groups
    }

    currentGroup.push(item)
    return groups
  }, {})
}