/**
 * 12クラス中学校（3学年×4クラス）デモデータ投入スクリプト
 * ソルバー実行は含まない。
 *
 * 使い方: npx tsx prisma/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ── 定数 ────────────────────────────────────────
const CURRICULUM: Record<number, Record<string, number>> = {
  1: { 国語: 4, 社会: 3, 数学: 4, 理科: 3, 英語: 4, 音楽: 1, 美術: 1, 保健体育: 3, "技術・家庭": 2, 道徳: 1, 学活: 1, 総合: 2 },
  2: { 国語: 4, 社会: 3, 数学: 3, 理科: 4, 英語: 4, 音楽: 1, 美術: 1, 保健体育: 3, "技術・家庭": 2, 道徳: 1, 学活: 1, 総合: 2 },
  3: { 国語: 3, 社会: 4, 数学: 4, 理科: 4, 英語: 4, 音楽: 1, 美術: 1, 保健体育: 3, "技術・家庭": 1, 道徳: 1, 学活: 1, 総合: 2 },
}

interface TeacherDef {
  name: string
  mainSubject: string
  assignments: { subject: string; grade: number; classes: number[] }[]
}

const TEACHERS: TeacherDef[] = [
  { name: "田中太郎",   mainSubject: "国語", assignments: [{ subject: "国語", grade: 1, classes: [0, 1] }, { subject: "国語", grade: 3, classes: [0] }] },
  { name: "佐藤花子",   mainSubject: "国語", assignments: [{ subject: "国語", grade: 1, classes: [2, 3] }, { subject: "国語", grade: 3, classes: [1] }] },
  { name: "鈴木一郎",   mainSubject: "国語", assignments: [{ subject: "国語", grade: 2, classes: [0, 1, 2, 3] }] },
  { name: "高橋美咲",   mainSubject: "国語", assignments: [{ subject: "国語", grade: 3, classes: [2, 3] }] },
  { name: "伊藤健太",   mainSubject: "社会", assignments: [{ subject: "社会", grade: 1, classes: [0, 1, 2, 3] }] },
  { name: "渡辺直美",   mainSubject: "社会", assignments: [{ subject: "社会", grade: 2, classes: [0, 1, 2, 3] }] },
  { name: "山本大輔",   mainSubject: "社会", assignments: [{ subject: "社会", grade: 3, classes: [0, 1, 2, 3] }] },
  { name: "小林翔太",   mainSubject: "数学", assignments: [{ subject: "数学", grade: 1, classes: [0, 1] }, { subject: "数学", grade: 2, classes: [0] }] },
  { name: "加藤美優",   mainSubject: "数学", assignments: [{ subject: "数学", grade: 1, classes: [2, 3] }, { subject: "数学", grade: 2, classes: [1] }] },
  { name: "吉田隆",     mainSubject: "数学", assignments: [{ subject: "数学", grade: 2, classes: [2, 3] }, { subject: "数学", grade: 3, classes: [0, 1] }] },
  { name: "山田真紀",   mainSubject: "数学", assignments: [{ subject: "数学", grade: 3, classes: [2, 3] }] },
  { name: "松本拓也",   mainSubject: "理科", assignments: [{ subject: "理科", grade: 1, classes: [0, 1] }, { subject: "理科", grade: 2, classes: [0] }] },
  { name: "井上明日香", mainSubject: "理科", assignments: [{ subject: "理科", grade: 1, classes: [2, 3] }, { subject: "理科", grade: 2, classes: [1] }] },
  { name: "木村達也",   mainSubject: "理科", assignments: [{ subject: "理科", grade: 2, classes: [2, 3] }, { subject: "理科", grade: 3, classes: [0, 1] }] },
  { name: "林友美",     mainSubject: "理科", assignments: [{ subject: "理科", grade: 3, classes: [2, 3] }] },
  { name: "斎藤大地",   mainSubject: "英語", assignments: [{ subject: "英語", grade: 1, classes: [0, 1] }, { subject: "英語", grade: 2, classes: [0, 1] }] },
  { name: "清水彩花",   mainSubject: "英語", assignments: [{ subject: "英語", grade: 1, classes: [2, 3] }, { subject: "英語", grade: 2, classes: [2, 3] }] },
  { name: "山崎健二",   mainSubject: "英語", assignments: [{ subject: "英語", grade: 3, classes: [0, 1, 2, 3] }] },
  { name: "石井博之",   mainSubject: "音楽", assignments: [{ subject: "音楽", grade: 1, classes: [0, 1, 2, 3] }, { subject: "音楽", grade: 2, classes: [0, 1, 2, 3] }, { subject: "音楽", grade: 3, classes: [0, 1, 2, 3] }] },
  { name: "前田真由",   mainSubject: "美術", assignments: [{ subject: "美術", grade: 1, classes: [0, 1, 2, 3] }, { subject: "美術", grade: 2, classes: [0, 1, 2, 3] }, { subject: "美術", grade: 3, classes: [0, 1, 2, 3] }] },
  { name: "藤田剛",     mainSubject: "保健体育", assignments: [{ subject: "保健体育", grade: 1, classes: [0, 1, 2, 3] }, { subject: "保健体育", grade: 2, classes: [0, 1] }] },
  { name: "三浦恵",     mainSubject: "保健体育", assignments: [{ subject: "保健体育", grade: 2, classes: [2, 3] }, { subject: "保健体育", grade: 3, classes: [0, 1, 2, 3] }] },
  { name: "岡田修",     mainSubject: "技術・家庭", assignments: [{ subject: "技術・家庭", grade: 1, classes: [0, 1, 2, 3] }, { subject: "技術・家庭", grade: 3, classes: [0, 1] }] },
  { name: "中村裕子",   mainSubject: "技術・家庭", assignments: [{ subject: "技術・家庭", grade: 2, classes: [0, 1, 2, 3] }, { subject: "技術・家庭", grade: 3, classes: [2, 3] }] },
]

const HOMEROOM: { teacherIndex: number; grade: number; classIndex: number }[] = [
  { teacherIndex: 0,  grade: 1, classIndex: 0 },
  { teacherIndex: 4,  grade: 1, classIndex: 1 },
  { teacherIndex: 7,  grade: 1, classIndex: 2 },
  { teacherIndex: 11, grade: 1, classIndex: 3 },
  { teacherIndex: 15, grade: 2, classIndex: 0 },
  { teacherIndex: 8,  grade: 2, classIndex: 1 },
  { teacherIndex: 12, grade: 2, classIndex: 2 },
  { teacherIndex: 5,  grade: 2, classIndex: 3 },
  { teacherIndex: 9,  grade: 3, classIndex: 0 },
  { teacherIndex: 13, grade: 3, classIndex: 1 },
  { teacherIndex: 17, grade: 3, classIndex: 2 },
  { teacherIndex: 3,  grade: 3, classIndex: 3 },
]

const ROOM_MAP: Record<string, number> = {
  "音楽": 0, "美術": 1, "理科": 2, "保健体育": 3, "技術・家庭": 4,
}

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#EF4444", 社会: "#F59E0B", 数学: "#3B82F6", 理科: "#10B981",
  英語: "#8B5CF6", 音楽: "#EC4899", 美術: "#F97316", 保健体育: "#06B6D4",
  "技術・家庭": "#84CC16", 道徳: "#6B7280", 学活: "#A855F7", 総合: "#14B8A6",
}

// ── メイン ────────────────────────────────────────
async function main() {
  console.log("=== 12クラス中学校デモデータ投入開始 ===\n")

  // 既存データをクリア（逆依存順）
  console.log("既存データをクリア中...")
  await prisma.timetableSlot.deleteMany()
  await prisma.timetablePattern.deleteMany()
  await prisma.perSubjectCondition.deleteMany()
  await prisma.scheduleCondition.deleteMany()
  await prisma.komaRoom.deleteMany()
  await prisma.komaClass.deleteMany()
  await prisma.komaTeacher.deleteMany()
  await prisma.koma.deleteMany()
  await prisma.teacherDuty.deleteMany()
  await prisma.duty.deleteMany()
  await prisma.roomAvailability.deleteMany()
  await prisma.specialRoom.deleteMany()
  await prisma.teacherAvailability.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.class.deleteMany()
  await prisma.grade.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.school.deleteMany()
  console.log("  完了\n")

  // ── 1. 学校基本情報 ──
  console.log("1. 学校基本情報を作成...")
  await prisma.school.create({
    data: {
      name: "テスト中学校",
      academicYear: 2026,
      daysPerWeek: 5,
      maxPeriodsPerDay: 6,
      hasZeroPeriod: false,
      namingConvention: "number",
      periodNamesJson: JSON.stringify(["1限", "2限", "3限", "4限", "5限", "6限"]),
      periodLengthsJson: JSON.stringify([50, 50, 50, 50, 50, 50]),
      lunchAfterPeriod: 4,
      classCountsJson: JSON.stringify({ "1": 4, "2": 4, "3": 4 }),
    },
  })
  console.log("  テスト中学校 (5日制, 6限)\n")

  // ── 2. 教科 ──
  console.log("2. 教科を作成...")
  const subjectNames = ["国語", "社会", "数学", "理科", "英語", "音楽", "美術", "保健体育", "技術・家庭", "道徳", "学活", "総合", "予備", "行事"]
  const subjectMap: Record<string, string> = {}
  for (let i = 0; i < subjectNames.length; i++) {
    const name = subjectNames[i]
    const s = await prisma.subject.create({
      data: {
        name,
        shortName: name.slice(0, 2),
        color: SUBJECT_COLORS[name] ?? "#6B7280",
        category: "general",
        sortOrder: i,
        isDefault: true,
      },
    })
    subjectMap[name] = s.id
  }
  console.log(`  ${subjectNames.length}教科\n`)

  // ── 3. 学年・クラス ──
  console.log("3. 学年・クラスを作成...")
  const gradeIds: string[] = []
  const classIds: string[][] = []

  for (let g = 1; g <= 3; g++) {
    const grade = await prisma.grade.create({
      data: { gradeNum: g, name: `${g}年` },
    })
    gradeIds.push(grade.id)

    const cids: string[] = []
    for (let c = 1; c <= 4; c++) {
      const cls = await prisma.class.create({
        data: { gradeId: grade.id, name: `${c}組`, sortOrder: c },
      })
      cids.push(cls.id)
    }
    classIds.push(cids)
  }
  console.log(`  3学年 × 4クラス = 12クラス\n`)

  // ── 4. 教員 ──
  console.log("4. 教員を登録...")
  const teacherIds: string[] = []
  for (const t of TEACHERS) {
    const teacher = await prisma.teacher.create({
      data: {
        name: t.name,
        nameKana: "",
        mainSubjectId: subjectMap[t.mainSubject] ?? null,
        maxPeriodsPerWeek: 25,
        maxPerDay: 6,
        maxConsecutive: 4,
      },
    })
    teacherIds.push(teacher.id)
  }
  console.log(`  ${teacherIds.length}名\n`)

  // ── 5. 特別教室 ──
  console.log("5. 特別教室を登録...")
  const roomDefs = [
    { name: "音楽室", shortName: "音", capacity: 40 },
    { name: "美術室", shortName: "美", capacity: 40 },
    { name: "理科室", shortName: "理", capacity: 40 },
    { name: "体育館", shortName: "体", capacity: 200 },
    { name: "技術室", shortName: "技", capacity: 40 },
  ]
  const roomIds: string[] = []
  for (const rd of roomDefs) {
    const room = await prisma.specialRoom.create({ data: rd })
    roomIds.push(room.id)
  }
  console.log(`  ${roomIds.length}教室\n`)

  // ── 6. 駒 ──
  console.log("6. 駒を作成...")
  let komaCount = 0

  // 6a. 教科担当の駒
  for (let ti = 0; ti < TEACHERS.length; ti++) {
    const teacherDef = TEACHERS[ti]
    const teacherId = teacherIds[ti]

    for (const assignment of teacherDef.assignments) {
      const subjectId = subjectMap[assignment.subject]
      const gradeIdx = assignment.grade - 1
      const gradeId = gradeIds[gradeIdx]
      const weeklyHours = CURRICULUM[assignment.grade][assignment.subject]

      for (const classIdx of assignment.classes) {
        const classId = classIds[gradeIdx][classIdx]

        const koma = await prisma.koma.create({
          data: {
            subjectId,
            gradeId,
            type: "normal",
            count: weeklyHours,
            priority: 5,
            label: "",
          },
        })

        await prisma.komaTeacher.create({
          data: { komaId: koma.id, teacherId, role: "main" },
        })
        await prisma.komaClass.create({
          data: { komaId: koma.id, classId },
        })

        const roomIndex = ROOM_MAP[assignment.subject]
        if (roomIndex !== undefined) {
          await prisma.komaRoom.create({
            data: { komaId: koma.id, roomId: roomIds[roomIndex] },
          })
        }

        komaCount++
      }
    }
  }

  // 6b. 担任教科（道徳・学活・総合）
  const homeroomSubjects = ["道徳", "学活", "総合"]
  for (const hr of HOMEROOM) {
    const teacherId = teacherIds[hr.teacherIndex]
    const gradeIdx = hr.grade - 1
    const gradeId = gradeIds[gradeIdx]
    const classId = classIds[gradeIdx][hr.classIndex]

    for (const subName of homeroomSubjects) {
      const subjectId = subjectMap[subName]
      const weeklyHours = CURRICULUM[hr.grade][subName]

      const koma = await prisma.koma.create({
        data: {
          subjectId,
          gradeId,
          type: "normal",
          count: weeklyHours,
          priority: 5,
          label: "",
        },
      })

      await prisma.komaTeacher.create({
        data: { komaId: koma.id, teacherId, role: "main" },
      })
      await prisma.komaClass.create({
        data: { komaId: koma.id, classId },
      })

      komaCount++
    }
  }

  const totalSlots = await prisma.koma.aggregate({ _sum: { count: true } })
  console.log(`  駒レコード: ${komaCount}`)
  console.log(`  総配置スロット: ${totalSlots._sum.count}\n`)

  // ── 7. 制約条件 ──
  console.log("7. 制約条件を設定...")
  await prisma.scheduleCondition.create({
    data: {
      teacherAvailability: "forbidden",
      teacherAvailabilityWeight: 100,
      teacherMaxPerDay: "consider",
      teacherMaxPerDayWeight: 80,
      teacherMaxConsecutive: "consider",
      teacherMaxConsecutiveWeight: 80,
      teacherMaxPerWeek: "consider",
      teacherMaxPerWeekWeight: 60,
      classSameSubjectPerDay: "consider",
      classSameSubjectPerDayWeight: 70,
      classConsecutiveSame: "ignore",
      classConsecutiveSameWeight: 50,
      roomConflict: "forbidden",
      roomConflictWeight: 100,
      roomAvailability: "forbidden",
      roomAvailabilityWeight: 100,
      dutyConflict: "forbidden",
      dutyConflictWeight: 100,
      consecutiveKoma: "consider",
      consecutiveKomaWeight: 90,
      dailyBalance: "consider",
      dailyBalanceWeight: 40,
    },
  })
  console.log("  完了\n")

  // ── サマリ ──
  console.log("=== デモデータ投入完了 ===")
  console.log(`  学校: テスト中学校`)
  console.log(`  教科: ${subjectNames.length}`)
  console.log(`  学年: 3 × クラス: 4 = 12クラス`)
  console.log(`  教員: ${teacherIds.length}名`)
  console.log(`  特別教室: ${roomIds.length}`)
  console.log(`  駒: ${komaCount}レコード (${totalSlots._sum.count}スロット)`)
  console.log(`\nアプリを起動して「自動作成」ページからソルバーを実行してください。`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
