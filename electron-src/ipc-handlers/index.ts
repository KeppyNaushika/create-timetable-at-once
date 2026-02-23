import { registerCheckHandlers } from "./checkHandlers"
import { registerExportHandlers } from "./exportHandlers"
import { registerClassHandlers } from "./classHandlers"
import { registerConditionHandlers } from "./conditionHandlers"
import { registerDutyHandlers } from "./dutyHandlers"
import { registerGradeHandlers } from "./gradeHandlers"
import { registerKomaHandlers } from "./komaHandlers"
import { registerMiscHandlers } from "./miscHandlers"
import { registerPatternHandlers } from "./patternHandlers"
import { registerRoomHandlers } from "./roomHandlers"
import { registerSchoolHandlers } from "./schoolHandlers"
import { registerSubjectHandlers } from "./subjectHandlers"
import { registerTeacherHandlers } from "./teacherHandlers"
import { registerTimetableHandlers } from "./timetableHandlers"

export function setupAllIPCHandlers() {
  registerSchoolHandlers()
  registerGradeHandlers()
  registerClassHandlers()
  registerTeacherHandlers()
  registerSubjectHandlers()
  registerRoomHandlers()
  registerDutyHandlers()
  registerKomaHandlers()
  registerConditionHandlers()
  registerCheckHandlers()
  registerTimetableHandlers()
  registerPatternHandlers()
  registerMiscHandlers()
  registerExportHandlers()

  console.log("All IPC handlers registered successfully")
}
