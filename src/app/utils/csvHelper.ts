/**
 * Escapes a single cell according to RFC 4180 CSV standard.
 */
export const escapeCsvCell = (cell: any): string => {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Builds a valid CSV string from headers and rows with UTF-8 BOM for Excel compatibility.
 */
export const buildCsv = (headers: string[], rows: any[][]): string => {
  const BOM = "\uFEFF"; // Byte Order Mark so Microsoft Excel opens UTF-8 properly
  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return BOM + [headerLine, ...rowLines].join("\r\n");
};
