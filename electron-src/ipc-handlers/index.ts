import { registerBackupHandlers } from "./backupHandlers"
import { registerCheckHandlers } from "./checkHandlers"
import { registerClassHandlers } from "./classHandlers"
import { registerConditionHandlers } from "./conditionHandlers"
import { registerDailyScheduleHandlers } from "./dailyScheduleHandlers"
import { registerDutyHandlers } from "./dutyHandlers"
import { registerExamHandlers } from "./examHandlers"
import { registerExportHandlers } from "./exportHandlers"
import { registerGradeHandlers } from "./gradeHandlers"
import { registerKomaHandlers } from "./komaHandlers"
import { registerMiscHandlers } from "./miscHandlers"
import { registerPatternHandlers } from "./patternHandlers"
import { registerRoomHandlers } from "./roomHandlers"
import { registerSchoolEventHandlers } from "./schoolEventHandlers"
import { registerSchoolHandlers } from "./schoolHandlers"
import { registerSettingsHandlers } from "./settingsHandlers"
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
  registerDailyScheduleHandlers()
  registerSchoolEventHandlers()
  registerExamHandlers()
  registerSettingsHandlers()
  registerBackupHandlers()

  console.log("All IPC handlers registered successfully")
}
