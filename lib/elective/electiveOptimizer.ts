import type {
  ElectiveGroup,
  ElectiveResult,
  ElectiveStudent,
} from "@/types/exam.types"

interface ElectiveInput {
  students: ElectiveStudent[]
  maxGroupSize: number
  availablePeriods: number
}

/**
 * Optimize elective subject group assignments.
 *
 * Algorithm:
 * 1. Count popularity of each subject
 * 2. Determine number of groups needed per subject
 * 3. Use greedy assignment: for each student, assign to their top-choice
 *    group that has space
 * 4. Handle conflicts (student can't be in two groups at same period)
 * 5. Return groups, unassigned students, and overall score
 */
export function optimizeElectives(input: ElectiveInput): ElectiveResult {
  const { students, maxGroupSize, availablePeriods } = input

  // 1. Count popularity of each subject
  const subjectPopularity = new Map<string, number>()
  for (const student of students) {
    for (const choice of student.choices) {
      subjectPopularity.set(choice, (subjectPopularity.get(choice) ?? 0) + 1)
    }
  }

  // 2. Determine number of groups needed per subject
  //    and create group slots
  const subjectGroups = new Map<string, ElectiveGroup[]>()

  // Sort subjects by popularity descending for better period allocation
  const sortedSubjects = Array.from(subjectPopularity.entries()).sort(
    (a, b) => b[1] - a[1]
  )

  let nextPeriod = 1
  for (const [subjectName, count] of sortedSubjects) {
    const groupsNeeded = Math.ceil(count / maxGroupSize)
    const groups: ElectiveGroup[] = []

    for (let i = 0; i < groupsNeeded; i++) {
      // Assign periods round-robin across available periods
      const period = ((nextPeriod - 1) % availablePeriods) + 1
      nextPeriod++

      groups.push({
        subjectName,
        students: [],
        period,
      })
    }

    subjectGroups.set(subjectName, groups)
  }

  // 3. Greedy assignment: for each student, try top choice first
  const studentPeriods = new Map<string, Set<number>>() // studentId -> assigned periods
  const unassigned: string[] = []
  let totalAssigned = 0
  let totalChoices = 0

  for (const student of students) {
    let assigned = false
    totalChoices++

    for (const choice of student.choices) {
      const groups = subjectGroups.get(choice)
      if (!groups) continue

      // Find a group with space and no period conflict for this student
      const assignedPeriods = studentPeriods.get(student.id) ?? new Set()

      // Try each group for this subject
      let foundGroup = false
      for (const group of groups) {
        // 4. Check period conflict
        if (assignedPeriods.has(group.period)) continue

        // Check group capacity
        if (group.students.length >= maxGroupSize) continue

        // Assign student to this group
        group.students.push(student.id)
        assignedPeriods.add(group.period)
        studentPeriods.set(student.id, assignedPeriods)
        foundGroup = true
        assigned = true
        totalAssigned++
        break
      }

      if (foundGroup) break
    }

    if (!assigned) {
      unassigned.push(student.id)
    }
  }

  // Collect all groups
  const allGroups: ElectiveGroup[] = []
  for (const groups of subjectGroups.values()) {
    for (const group of groups) {
      // Only include groups that have students
      if (group.students.length > 0) {
        allGroups.push(group)
      }
    }
  }

  // 5. Calculate score (percentage of students successfully assigned)
  const score =
    totalChoices > 0 ? Math.round((totalAssigned / totalChoices) * 100) : 100

  return {
    groups: allGroups,
    unassigned,
    score,
  }
}
