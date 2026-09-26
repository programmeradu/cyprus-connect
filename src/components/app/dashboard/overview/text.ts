export const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
