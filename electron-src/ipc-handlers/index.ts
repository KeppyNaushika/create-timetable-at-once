import { registerClassHandlers } from "./classHandlers"
import { registerGradeHandlers } from "./gradeHandlers"
import { registerMiscHandlers } from "./miscHandlers"
import { registerSchoolHandlers } from "./schoolHandlers"
import { registerSubjectHandlers } from "./subjectHandlers"
import { registerTeacherHandlers } from "./teacherHandlers"

export function setupAllIPCHandlers() {
  registerSchoolHandlers()
  registerGradeHandlers()
  registerClassHandlers()
  registerTeacherHandlers()
  registerSubjectHandlers()
  registerMiscHandlers()

  console.log("All IPC handlers registered successfully")
}
