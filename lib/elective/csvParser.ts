import type { ElectiveStudent } from "@/types/exam.types"

/**
 * Generate a simple unique ID.
 */
function generateId(): string {
  return `stu_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Detect delimiter: comma or tab.
 */
function detectDelimiter(line: string): string {
  const tabCount = (line.match(/\t/g) ?? []).length
  const commaCount = (line.match(/,/g) ?? []).length
  return tabCount > commaCount ? "\t" : ","
}

/**
 * Parse CSV/TSV text containing elective student data.
 *
 * Expected format:
 * - First row is header (名前, 第1希望, 第2希望, ...)
 * - Each subsequent row: student name, choice1, choice2, ...
 * - Handles both comma and tab delimiters
 * - Generates unique IDs for each student
 *
 * @param csvText - raw CSV/TSV text
 * @returns parsed ElectiveStudent array
 */
export function parseElectiveCsv(csvText: string): ElectiveStudent[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) return [] // need at least header + 1 data row

  const delimiter = detectDelimiter(lines[0])

  // Skip header (first line)
  const dataLines = lines.slice(1)

  const students: ElectiveStudent[] = []

  for (const line of dataLines) {
    const cells = line.split(delimiter).map((cell) => cell.trim())

    if (cells.length < 1) continue

    const name = cells[0]
    if (!name) continue

    // Remaining cells are choices, filter out empty
    const choices = cells.slice(1).filter((c) => c.length > 0)

    students.push({
      id: generateId(),
      name,
      choices,
    })
  }

  return students
}
