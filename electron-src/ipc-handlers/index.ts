import { registerClassHandlers } from "./classHandlers"
import { registerDutyHandlers } from "./dutyHandlers"
import { registerGradeHandlers } from "./gradeHandlers"
import { registerKomaHandlers } from "./komaHandlers"
import { registerMiscHandlers } from "./miscHandlers"
import { registerRoomHandlers } from "./roomHandlers"
import { registerSchoolHandlers } from "./schoolHandlers"
import { registerSubjectHandlers } from "./subjectHandlers"
import { registerTeacherHandlers } from "./teacherHandlers"

export function setupAllIPCHandlers() {
  registerSchoolHandlers()
  registerGradeHandlers()
  registerClassHandlers()
  registerTeacherHandlers()
  registerSubjectHandlers()
  registerRoomHandlers()
  registerDutyHandlers()
  registerKomaHandlers()
  registerMiscHandlers()

  console.log("All IPC handlers registered successfully")
}
