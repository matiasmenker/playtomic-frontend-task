import { Match } from "@/lib/api-types";

/**
 * Compares two items in descending order by the specified key.
 *
 * @template T
 * @param {T} a - The first item to compare.
 * @param {T} b - The second item to compare.
 * @param {keyof T} orderBy - The key to compare by.
 * @returns {number} - A comparison result (-1, 0, or 1).
 */
const descendingComparator = <T>(a: T, b: T, orderBy: keyof T): number => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

/**
 * Returns a comparator function for sorting items in ascending or descending order.
 *
 * @template T
 * @param {Order} order - The sorting order ("asc" or "desc").
 * @param {keyof T} orderBy - The key to sort by.
 * @returns {(a: T, b: T) => number} - A comparator function.
 */
const getComparator = <T>(
  order: "asc" | "desc",
  orderBy: keyof T
): ((a: T, b: T) => number) =>
  order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);

/**
 * Converts match data into a CSV string.
 *
 * @param {Match[]} data - An array of matches to convert.
 * @returns {string} - The generated CSV string.
 */
const convertToCSV = (data: Match[]): string => {
  const headers = [
    "Match",
    "Court",
    "Venue",
    "Sport",
    "Date",
    "Start",
    "End",
    "Players",
  ];

  const rows = data.map((match) => {
    const startDate = match.startDate.substring(0, 10);
    const startTime = match.startDate.substring(11, 16);
    const endTime = match.endDate.substring(11, 16);
    const players = match.teams
      .flatMap((team) => team.players)
      .map((player) => player.displayName)
      .join("; ");

    return [
      match.matchId,
      match.courtId,
      match.venueId,
      match.sport,
      startDate,
      startTime,
      endTime,
      players,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csvContent;
};

/**
 * Triggers a download of a CSV file.
 *
 * @param {string} csvContent - The CSV content as a string.
 * @param {string} filename - The name of the file to download.
 */
const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export { getComparator, descendingComparator, convertToCSV, downloadCSV };
