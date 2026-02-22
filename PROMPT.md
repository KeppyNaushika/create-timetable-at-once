# 中学校時間割作成ソフトウェア「一括時間割作成」開発プロンプト

## 概要

中学校向けの時間割自動作成デスクトップアプリケーション「一括時間割作成」を開発する。
中学校の時間割作成業務に必要な全機能を備え、最新のUI/UXデザインとアルゴリズムで構築する。

---

## 技術スタック

| レイヤー         | 技術                                       |
| ---------------- | ------------------------------------------ |
| デスクトップ     | Electron + Electron Forge                  |
| フロントエンド   | Next.js (App Router) + React + TypeScript  |
| UIフレームワーク | Tailwind CSS + shadcn/ui (Radix UI)        |
| ORM / DB         | Prisma + SQLite (ファイルベース)           |
| 状態管理         | React hooks + Context（必要最小限）        |
| PDF出力          | @react-pdf/renderer または pdf-lib         |
| Excel出力        | exceljs                                    |
| プロセス間通信   | Electron IPC (メインプロセス ↔ レンダラー) |
| E2Eテスト        | Playwright (Electron サポート)             |

> **注**: 既存プロジェクト `score-at-once-electron` と同一の技術選定・アーキテクチャパターンに従うこと。Electron Forge によるビルド、Prisma の IPC 経由アクセス、shadcn/ui コンポーネント体系を踏襲する。

---

## プロジェクト構造

```
timetable-creator/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # ダッシュボード（メインメニュー）
│   ├── /setup/                   # 初期設定
│   │   ├── /school/              # 学校基本設定
│   │   ├── /subjects/            # 科目の設定
│   │   └── /timetable-frame/    # 基本時間割枠（A表/B表）
│   ├── /data/                    # データ入力
│   │   ├── /teachers/            # 先生の設定
│   │   ├── /classes/             # クラスの設定
│   │   ├── /rooms/               # 特別教室の設定
│   │   ├── /duties/              # 校務の設定
│   │   ├── /electives/           # フリー時間・選択・その他
│   │   └── /koma/                # 駒の設定・一括生成
│   ├── /scheduler/               # 駒埋め（時間割作成）
│   │   ├── /conditions/          # 処理条件の設定（重み付き制約管理）
│   │   ├── /manual/              # 手動駒埋め（Violations Pane付き）
│   │   ├── /auto/                # 自動作成（ハイブリッドCSPソルバー）
│   │   ├── /check/               # 駒のチェック（Advisor事前チェック）
│   │   └── /patterns/            # 複数パターン比較・選択
│   ├── /daily/                   # 日課管理（2層スケジューリング）
│   │   ├── /calendar/            # カレンダー表示
│   │   ├── /changes/             # 臨時時間割変更
│   │   ├── /substitute/          # 代替教員管理
│   │   └── /count/               # 授業時数集計
│   ├── /exam/                    # 試験監督割当
│   │   ├── /schedule/            # 試験日程設定
│   │   └── /assignment/          # 監督教員割当
│   ├── /elective-optimizer/      # 選択科目最適化
│   ├── /review/                  # 確認
│   │   ├── /overview/            # 全体表
│   │   ├── /individual/          # 個別表
│   │   └── /diagnosis/           # 統合型診断ツール
│   ├── /print/                   # 印刷・出力
│   │   ├── /teacher-all/         # 先生全体表
│   │   ├── /class-all/           # クラス全体表
│   │   ├── /teacher-schedule/    # 先生用時間割
│   │   ├── /class-schedule/      # クラス用時間割
│   │   ├── /room-schedule/       # 特別教室用時間割
│   │   ├── /duty-list/           # 校務一覧表
│   │   ├── /teacher-list/        # 先生一覧表
│   │   ├── /koma-list/           # 駒一覧
│   │   └── /remaining-koma/      # 残り駒一覧
│   ├── /count/                   # 授業数カウント機能
│   └── /settings/                # アプリ設定
├── components/
│   ├── /ui/                      # shadcn/ui コンポーネント
│   ├── /common/                  # 共通コンポーネント
│   ├── /timetable/               # 時間割表示コンポーネント
│   ├── /scheduler/               # 駒埋め関連コンポーネント
│   └── /print/                   # 印刷レイアウトコンポーネント
├── hooks/                        # カスタムフック
├── lib/                          # ユーティリティ・アルゴリズム
│   ├── solver/                   # 時間割ソルバー（自動作成エンジン）
│   └── validators/               # バリデーション
├── electron-src/
│   ├── index.ts                  # メインプロセス
│   ├── preload.ts
│   ├── menu.ts
│   ├── ipc-handlers/             # IPC ハンドラ群
│   └── lib/
├── e2e/                          # E2Eテスト（Playwright）
│   ├── helpers/                  # テストヘルパー（Electron起動・終了）
│   └── *.spec.ts                 # テストスペック
├── prisma/
│   └── schema.prisma
├── public/
│   └── holidays.json             # 祝日マスターデータ
├── playwright.config.ts          # Playwright設定
├── forge.config.js
├── package.json
└── tsconfig.json
```

---

## データモデル（Prisma Schema）

### 学校基本情報

```prisma
model School {
  id            String   @id @default(cuid())
  name          String   // 学校名
  year          Int      // 年度
  weeksType     Int      @default(1) // 1:1週間制, 2:2週間制
  weekAName     String   @default("A表") // 1週目の名称
  weekBName     String   @default("B表") // 2週目の名称
  periodsPerDay Int      @default(6) // 1日の最大時限数
  useZeroPeriod Boolean  @default(false) // 0時限目の使用
  lunchAfter    Int      @default(4) // 昼休みの位置（何時限目の後か）
  bandLength    Int      @default(35) // 帯の長さ（時限数）
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  grades        Grade[]
  teachers      Teacher[]
  rooms         SpecialRoom[]
  duties        Duty[]
  subjects      Subject[]
  komas         Koma[]
  conditions      ScheduleCondition?
  timetableSlots  TimetableSlot[]
  patterns        TimetablePattern[]
  dailySchedules  DailySchedule[]
  examSchedules   ExamSchedule[]
}

model Grade {
  id        String  @id @default(cuid())
  schoolId  String
  school    School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  gradeNum  Int     // 学年 (1, 2, 3)
  classCount Int    // 学級数
  classes   Class[]
}

model Class {
  id            String  @id @default(cuid())
  gradeId       String
  grade         Grade   @relation(fields: [gradeId], references: [id], onDelete: Cascade)
  name          String  // クラス名 ("1-1", "2-A" 等)
  shortName     String  // 略名
  displayOrder  Int     // 表示順

  komaClasses   KomaClass[]
  timetableSlots TimetableSlot[]
}
```

### 先生

```prisma
model Teacher {
  id              String  @id @default(cuid())
  schoolId        String
  school          School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  fullName        String  // 氏名
  shortName       String  // 略名
  homeroomClassId String? // 担任クラスID（nullable）
  subjectArea     String? // 担当教科
  maxConsecutive  Int     @default(6) // 連続授業の最大数
  maxPerDay       Int     @default(6) // 1日の最大授業数
  maxPerWeek      Int     @default(25) // 1週間の最大授業数
  displayOrder    Int     // 表示順

  availabilities  TeacherAvailability[]
  teacherDuties   TeacherDuty[]
  komaTeachers    KomaTeacher[]
  timetableSlots  TimetableSlot[]
}

model TeacherAvailability {
  id        String @id @default(cuid())
  teacherId String
  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  dayIndex  Int    // 曜日 (0=月, 1=火, ...)
  period    Int    // 時限
  weekType  Int    @default(0) // 0:A表, 1:B表
  status    String // "available" | "unavailable" | "preferred_not"
  // status: 出勤可 / 出勤不可 / なるべく避けたい
}
```

### 科目・教科

```prisma
model Subject {
  id           String  @id @default(cuid())
  schoolId     String
  school       School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  name         String  // 科目名（国語, 数学, ...）
  shortName    String  // 略名
  category     String  // "general" | "moral" | "homeroom" | "free" | "integrated_a" | "integrated_b" | "reserve" | "duty"
  subjectGroup String  // 教科グループ名
  colorCode    String? // 表示色（UI用）
  displayOrder Int

  komas        Koma[]
}
```

### 特別教室

```prisma
model SpecialRoom {
  id             String  @id @default(cuid())
  schoolId       String
  school         School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  name           String  // 教室名
  shortName      String  // 略名
  maxConcurrent  Int     @default(1) // 同時利用可能数

  availabilities RoomAvailability[]
  komaRooms      KomaRoom[]
}

model RoomAvailability {
  id       String      @id @default(cuid())
  roomId   String
  room     SpecialRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  dayIndex Int
  period   Int
  weekType Int         @default(0)
  status   String      // "available" | "unavailable"
}
```

### 校務

```prisma
model Duty {
  id        String  @id @default(cuid())
  schoolId  String
  school    School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  name      String  // 校務名（職員会議, 教科会, ...）
  shortName String  // 略名
  dayIndex  Int     // 開催曜日
  period    Int     // 開催時限
  weekType  Int     @default(0) // A表/B表

  teacherDuties TeacherDuty[]
}

model TeacherDuty {
  id        String  @id @default(cuid())
  teacherId String
  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  dutyId    String
  duty      Duty    @relation(fields: [dutyId], references: [id], onDelete: Cascade)

  @@unique([teacherId, dutyId])
}
```

### 駒（授業コマ）

```prisma
model Koma {
  id           String  @id @default(cuid())
  schoolId     String
  school       School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  subjectId    String
  subject      Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  komaType     String  // "normal" | "consecutive" | "25min_pair"
  // normal: 普通授業, consecutive: 連続授業, 25min_pair: 25分×2
  komaCount    Int     @default(1)  // 週あたり駒数
  priority     Int     @default(5)  // 優先順 (0-9)
  isFixed      Boolean @default(false) // 固定フラグ
  weekType     Int     @default(0) // 0:A表, 1:B表
  pairedKomaId String? // 25分ペアの相手駒ID
  label        String? // 表示ラベル（カスタム）

  komaTeachers KomaTeacher[]
  komaClasses  KomaClass[]
  komaRooms    KomaRoom[]
  timetableSlots TimetableSlot[]
}

model KomaTeacher {
  id        String  @id @default(cuid())
  komaId    String
  koma      Koma    @relation(fields: [komaId], references: [id], onDelete: Cascade)
  teacherId String
  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  role      String  @default("main") // "main" | "sub" (TT後見)

  @@unique([komaId, teacherId])
}

model KomaClass {
  id      String @id @default(cuid())
  komaId  String
  koma    Koma   @relation(fields: [komaId], references: [id], onDelete: Cascade)
  classId String
  class   Class  @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([komaId, classId])
}

model KomaRoom {
  id     String      @id @default(cuid())
  komaId String
  koma   Koma        @relation(fields: [komaId], references: [id], onDelete: Cascade)
  roomId String
  room   SpecialRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@unique([komaId, roomId])
}
```

### 時間割スロット（作成結果）

```prisma
model TimetableSlot {
  id         String  @id @default(cuid())
  schoolId   String
  school     School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  patternId  String?
  pattern    TimetablePattern? @relation(fields: [patternId], references: [id], onDelete: Cascade)
  komaId     String
  koma       Koma    @relation(fields: [komaId], references: [id], onDelete: Cascade)
  classId    String
  class      Class   @relation(fields: [classId], references: [id], onDelete: Cascade)
  teacherId  String
  teacher    Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  dayIndex   Int     // 曜日 (0-6)
  period     Int     // 時限 (0-6, 0=0時限目)
  weekType   Int     @default(0)  // 0:A表, 1:B表
  isFixed    Boolean @default(false) // 固定されているか

  @@unique([classId, dayIndex, period, weekType, patternId])
  @@index([teacherId, dayIndex, period, weekType])
  @@index([patternId])
}
```

### 時間割パターン（複数パターン生成用）

```prisma
model TimetablePattern {
  id          String   @id @default(cuid())
  schoolId    String
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  name        String   // パターン名（"パターン1", "パターン2" 等）
  score       Float    // ソルバーによる品質スコア（低いほど良い）
  isSelected  Boolean  @default(false) // 採用パターンかどうか
  violations  Int      @default(0) // 制約違反数
  placedCount Int      @default(0) // 配置済み駒数
  totalCount  Int      @default(0) // 全駒数
  createdAt   DateTime @default(now())

  slots       TimetableSlot[]
}
```

### 日課管理（臨時時間割・授業振替）

```prisma
model DailySchedule {
  id          String   @id @default(cuid())
  schoolId    String
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  date        DateTime // 対象日
  reason      String   // 変更理由（"出張", "学校行事", "台風", "体調不良" 等）
  createdAt   DateTime @default(now())

  changes     DailyChange[]
}

model DailyChange {
  id              String        @id @default(cuid())
  dailyScheduleId String
  dailySchedule   DailySchedule @relation(fields: [dailyScheduleId], references: [id], onDelete: Cascade)
  classId         String        // 対象クラス
  period          Int           // 対象時限
  changeType      String        // "cancel" | "substitute" | "swap" | "special"
  // cancel: 授業取消, substitute: 代替教員, swap: 授業入替, special: 特別授業

  originalKomaId    String?   // 元の駒
  originalTeacherId String?   // 元の先生
  newKomaId         String?   // 新しい駒（swapの場合）
  newTeacherId      String?   // 代替先生（substituteの場合）
  note              String?   // 備考
}
```

### 試験監督割当

```prisma
model ExamSchedule {
  id          String   @id @default(cuid())
  schoolId    String
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  name        String   // 試験名（"1学期中間テスト" 等）
  startDate   DateTime
  endDate     DateTime

  assignments ExamAssignment[]
}

model ExamAssignment {
  id             String       @id @default(cuid())
  examScheduleId String
  examSchedule   ExamSchedule @relation(fields: [examScheduleId], references: [id], onDelete: Cascade)
  classId        String       // 対象クラス
  period         Int          // 時限
  dayOffset      Int          // 試験開始日からの日数オフセット
  subjectId      String       // 試験科目
  teacherId      String       // 監督教員
  roomId         String?      // 試験教室（nullの場合は普通教室）

  @@unique([examScheduleId, classId, period, dayOffset])
}
```

### 処理条件

```prisma
model ScheduleCondition {
  id                          String @id @default(cuid())
  schoolId                    String @unique
  school                      School @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // 連続時間の定義（帯時間割用）
  consecutiveHours            Int    @default(6) // 6, 5, 4

  // --- 制約条件 ---
  // 各値: "ignore" | "consider" | "manual_only" | "prohibit" | "per_subject"
  // ignore=無視, consider=考慮, manual_only=手動のみ可, prohibit=禁止, per_subject=教科指定
  // 各制約に重み(weight: 0-100)を設定可能。prohibit=100, consider=50がデフォルト。
  // 重み0は無視と同等。重みにより制約の優先度を細かく制御できる。

  sameSubjectGroupDiffSubject String @default("consider")
  sameSubjectGroupDiffSubjectWeight Int @default(50)
  // 同一教科の異なる科目の連続時間実施

  sameSubjectDiffKoma         String @default("prohibit")
  sameSubjectDiffKomaWeight   Int    @default(100)
  // 同一科目（別の駒）の同日実施

  sameKomaSameDay             String @default("prohibit")
  sameKomaSameDayWeight       Int    @default(100)
  // 同じ駒の同日実施

  sameKomaConsecutiveDay      String @default("prohibit")
  sameKomaConsecutiveDayWeight Int   @default(100)
  // 同じ駒の2日連続同時限実施

  sameTeacherDiffSubject      String @default("ignore")
  sameTeacherDiffSubjectWeight Int   @default(0)
  // 同じ先生の異なる教科の駒（はなす/まとめる）

  consecutiveAcrossLunch      String @default("prohibit")
  consecutiveAcrossLunchWeight Int   @default(100)
  // 連続授業が昼休みをはさむこと

  teacherUnavailable          String @default("consider")
  teacherUnavailableWeight    Int    @default(50)
  // 先生の都合が悪い時間の扱い

  roomUnavailable             String @default("consider")
  roomUnavailableWeight       Int    @default(50)
  // 特別教室の都合が悪い時間の扱い

  evenPeriodStart             String @default("prohibit")
  evenPeriodStartWeight       Int    @default(100)
  // 連続授業の偶数時限からの実施

  allowOddDayStart            Boolean @default(true)
  // 1日が偶数番号で始まることを認めるか

  // 追加制約
  teacherMaxConsecutive       String @default("consider")
  teacherMaxConsecutiveWeight Int    @default(70)
  // 先生の連続授業数の上限遵守

  subjectSpreadInWeek         String @default("consider")
  subjectSpreadInWeekWeight   Int    @default(40)
  // 同一科目の週内均等配分（月曜に偏らない等）

  teacherDailyLoadBalance     String @default("consider")
  teacherDailyLoadBalanceWeight Int  @default(30)
  // 先生の1日の授業数バランス（曜日間の偏り軽減）

  studentGapMinimize          String @default("consider")
  studentGapMinimizeWeight    Int    @default(60)
  // クラスの空き時間（ギャップ）の最小化

  // 教科別の個別設定（per_subject 用）
  perSubjectConditions        PerSubjectCondition[]
}

model PerSubjectCondition {
  id           String            @id @default(cuid())
  conditionId  String
  condition    ScheduleCondition @relation(fields: [conditionId], references: [id], onDelete: Cascade)
  subjectGroup String            // 教科グループ名
  field        String            // どの条件フィールドか
  value        String            // その教科に対する設定値
  weight       Int               @default(50) // 教科別の重み設定

  @@unique([conditionId, subjectGroup, field])
}
```

---

## 主要機能の詳細仕様

### 1. ダッシュボード（メインメニュー）

メインメニューを現代的なカード型UIで構成する。

```
┌─────────────────────────────────────────────────┐
│  一括時間割作成 - ○○中学校 令和○年度                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 初期設定  │ │  データ  │ │ 駒埋め   │           │
│  │ ✓ 完了   │ │ 3/6項目 │ │ 未着手   │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  確認    │ │  印刷   │ │ 授業数   │           │
│  │          │ │         │ │ カウント  │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│                                                 │
│  進捗: ████████░░░░░░ 60%  残り駒: 12           │
└─────────────────────────────────────────────────┘
```

- 各カードにステータスバッジ（未着手/進行中/完了）を表示
- 全体の進捗率と残り駒数をリアルタイム表示
- ワークフローの依存関係を視覚的に示すステッパー表示

### 2. 初期設定モジュール

#### 2-1. 学校基本設定

- 学校名、年度
- 各学年の学級数（スピナー入力）
- 学級名の命名規則（数字 / アルファベット / 詳細設定）
- 先生の初期値（連続授業の最大数、1日の最大数、1週間の最大数）
- 担任名の管理

#### 2-2. 科目の設定

タブ切替UI:

- **一般タブ**: 国語/社会/数学/理科/英語/音楽/美術/保体/技家 + 道徳/学活/フリー/総合A/総合B
  - 各教科: 科目名一覧と各学年の週時間数を表形式で入力
- **予備タブ**: 予備1〜5（カスタム教科の追加用）
- **校務タブ**: 校務・会議の科目設定
- 教科ごとに表示色をカラーピッカーで設定可能（時間割の視認性向上）

#### 2-3. 基本時間割枠

- A表 / B表 の名称設定
- 時間割の長さ（1週間 / 2週間）
- 帯の長さ設定（スピナー）
- 昼休みの位置設定
- 0時限目の使用有無
- 時間割枠の交換機能（A表→B表の枠対応付け）

### 3. データ入力モジュール

#### 3-1. 先生の設定

3つのタブ構成:

**情報タブ:**

- 氏名、略名
- 担任クラス（ドロップダウン）
- 担当教科（ドロップダウン）
- 携わる校務（マルチセレクト、チェックボックスリスト）
- 授業の最大数: 連続 / 1日 / 1週間（各スピナー）
- テキストファイルからの先生名一括読み込み機能

**都合タブ:**

- 曜日×時限のマトリクスグリッド
- セルクリックで「出勤可/出勤不可/なるべく避けたい」をトグル
- 色分け表示: 緑=可, 赤=不可, 黄=避けたい

**持ち駒タブ:**

- この先生に割り当てられた駒の一覧表示（読み取り専用）
- 駒数の集計表示

ナビゲーション: 「前の先生」「次の先生」ボタン + リスト選択

#### 3-2. クラスの設定

- クラス別のタブまたはリスト
- 各クラスの特記事項

#### 3-3. 特別教室の設定

- 教室名、略名
- 同時利用可能数（スピナー）
- 都合マトリクス（先生と同様の曜日×時限グリッド）
- 前/次の教室ナビゲーション

#### 3-4. 校務の設定

- 校務名、略名
- 開催曜日・時限の設定
- 携わる先生の選択（チェックボックスリスト）
- 前/次の校務ナビゲーション

#### 3-5. フリー時間・その他の設定

- 選択授業の設定
- ティームティーチング（TT）の設定
- 習熟度別学習の設定
- 総合的な学習の時間の設定

#### 3-6. 駒の設定

**駒の一括生成機能:**

- 学年ごとの教科×週時間数のマトリクスから自動生成
- 学習指導要領の標準時間数をプリセット
- 5教科: 「1先生×1クラス×普通授業」で自動駒生成
- 美術: 「1先生×1クラス×連続授業 or 普通授業」
- 技家/保体: 「2先生×2(or3)クラス×連続授業 or 普通授業」
- 道徳/学活: 作成単位（全校/学年/クラス）を選択

**個別駒設定画面:**

- 学年、科目、種類（普通/連続/25分ペア）
- 駒数（0-10, スピナー）
- 優先順（0-9, スピナー）
- 先生の割当（メイン先生 + TT後見、複数選択可）
- クラスの割当（複数選択可）
- 教室の割当
- コピー / 挿入 / 削除ボタン
- 前/次の駒ナビゲーション

### 4. 駒埋め（時間割作成エンジン）

#### 4-1. 処理条件の設定

条件テーブル形式のUI（重み付き制約管理）:

| 条件項目                            | 設定値     | 重み         |
| ----------------------------------- | ---------- | ------------ |
| 同一教科の異なる科目の連続N時間実施 | 考慮する ▾ | ████░░░░ 50  |
| 同一科目（別の駒）の同日実施        | 禁止する ▾ | ████████ 100 |
| 同じ駒の同日実施                    | 禁止する ▾ | ████████ 100 |
| 同じ駒の2日連続同時限実施           | 禁止する ▾ | ████████ 100 |
| 同じ先生の異なる教科の駒            | 無視する ▾ | ░░░░░░░░ 0   |
| 連続授業が昼休みをはさむこと        | 禁止する ▾ | ████████ 100 |
| 先生の都合が悪い時間                | 考慮する ▾ | ████░░░░ 50  |
| 特別教室の都合が悪い時間            | 考慮する ▾ | ████░░░░ 50  |
| 連続授業の偶数時限からの実施        | 禁止する ▾ | ████████ 100 |
| 先生の連続授業数上限                | 考慮する ▾ | █████░░░ 70  |
| 同一科目の週内均等配分              | 考慮する ▾ | ███░░░░░ 40  |
| 先生の曜日間授業数バランス          | 考慮する ▾ | ██░░░░░░ 30  |
| クラスの空き時間最小化              | 考慮する ▾ | █████░░░ 60  |

各行のドロップダウン: 禁止する / 考慮する / 無視する / 手動のみ可 / 教科指定
「教科指定」選択時は教科別の詳細設定ダイアログを表示（教科別に重みも設定可能）

**重みスライダー（0-100）**: 各制約の右にスライダーを配置。重みにより制約の優先度を細かく制御。

- 100: 必ず守る（ハード制約）
- 50-99: できるだけ守る（ソフト制約・高優先度）
- 1-49: 可能なら守る（ソフト制約・低優先度）
- 0: 無視

**制約リラックスモード**: 有効時、自動作成で全制約を満たせない場合に重みの低い制約から自動緩和。緩和された制約をユーザーに報告。

連続時間数の設定: 6時間 / 5時間 / 4時間（ラジオボタン）

#### 4-2. 駒のチェック

自動作成前の事前チェック機能:

**持ち駒数のチェック:**

- 先生別: 割当駒数 vs 空き時間数
- クラス別: 割当駒数 vs 時間割枠数
- 教室別: 同時利用数の超過チェック
- 異常のある項目を赤色ハイライト

**時限数のチェック:**

- 曜日×時限ごとの以下を一覧表示:
  1. 空いているクラス数
  2. 空いている先生数
  3. 授業のできる先生数
  4. 開催される校務数
  5. 校務に携わる先生数
- 詳細ボタンで各項目の内訳を表示

#### 4-3. 手動駒埋め

**メイン画面構成:**

```
┌──────────────────────────────────────────────────────┐
│ ツールバー: メニュー | 先生自動 | クラス自動 |         │
│             一括固定 | 駒の取外し | まとめて閉じる      │
├────────────────────────────┬─────────────────────────┤
│                            │                         │
│    全体表（先生 or クラス）   │    個別表               │
│    マトリクスグリッド         │    選択中の先生/クラス    │
│                            │    の時間割              │
│    ドラッグ&ドロップで       │                         │
│    駒を配置                 │                         │
│                            │                         │
├────────────────────────────┼─────────────────────────┤
│ 情報パネル                  │ 残り駒リスト             │
│ - 来る駒（配置候補）         │ - 未配置の駒一覧         │
│ - 駒の行き先               │ - フィルタ・ソート        │
│   （選択駒の配置可能場所）   │                         │
└────────────────────────────┴─────────────────────────┘
```

**操作:**

- 残り駒リストから駒を選択 → 全体表で配置可能なセルがハイライト
- ドラッグ&ドロップで駒を時間割に配置
- **シャドウ表示**: ドラッグ中に関連する先生・教室の使用状況をリアルタイムでシャドウ表示し、衝突を即座に視覚化
- 右クリックコンテキストメニュー: 駒を外す / 駒を固定 / 固定を解除 / **振替提案を表示** / **赤駒自動修正**
- 全体表の表示切替: 先生 / クラス / **教室**、大 / 中 / 小
- 条件違反がある場合はセルに警告アイコン表示（**赤=禁止違反, 黄=考慮違反, 重み表示**）

**Violations Pane（制約違反パネル）:**

- 画面下部に折りたたみ可能なパネルとして常時表示
- 現在の時間割の全制約違反をリアルタイムでリスト表示
- 各違反項目: 違反種類、対象駒、対象先生/クラス、制約の重み、影響度
- 違反をクリックで該当箇所にジャンプ&ハイライト
- 違反数のサマリーバッジをツールバーに表示
- フィルタ: 重み順 / 種類別 / 先生別 / クラス別

**「来る駒」パネル:**

- 選択したセル（曜日×時限）に配置可能な駒の一覧
- 条件適合度でソート

**「駒の行き先」パネル:**

- 選択した駒が配置可能な曜日×時限の一覧
- 条件適合度でソート

#### 4-4. 自動作成エンジン

**UI:**

- 「駒を外して試行」/「駒を残して試行」ラジオボタン
- 「処理条件の考慮を重視」チェックボックス
- 「長時間試行する」チェックボックス
- 「乱数を使用する」チェックボックス
- 「複数パターン生成」チェックボックス（有効時: 生成数スピナー, デフォルト3）
- 実行ボタン / 中止ボタン（ESCキー対応）
- リアルタイム進捗表示（先生×時間のマトリクスをアニメーション表示）
- 残り駒数 / 進捗率のプログレスバー
- **Violations Pane（制約違反パネル）**: 自動作成中・作成後に未充足の制約をリアルタイム一覧表示。違反種類・対象駒・重み・影響度をリスト化し、クリックで該当箇所にジャンプ

**アルゴリズム（ハイブリッドCSPソルバー）:**

実績ある段階的探索と、現代のCSP技法・メタヒューリスティクスを融合したハイブリッドアルゴリズムを実装する。

```typescript
// lib/solver/types.ts
interface SolverConfig {
  respectConsideration: boolean // 「考慮」を重視
  longSearch: boolean // 長時間試行
  useRandom: boolean // 乱数使用
  keepExisting: boolean // 既存の駒を残す
  multiPattern: boolean // 複数パターン生成
  patternCount: number // 生成パターン数（デフォルト3）
  relaxMode: boolean // 制約リラックスモード
}

interface Constraint {
  type: ConstraintType
  level: "prohibit" | "consider" | "ignore" | "manual_only"
  weight: number // 重み 0-100（デフォルト: prohibit=100, consider=50）
  subjectGroup?: string // 教科指定の場合
}

interface SolverResult {
  success: boolean
  placements: Placement[]
  remainingKomas: Koma[]
  violations: Violation[] // 制約違反一覧（重み・種類付き）
  score: number // 解の総合スコア（低いほど良い）
  stats: SolverStats
  relaxedConstraints?: Constraint[] // リラックスされた制約一覧
}

interface SolverProgress {
  phase: "preprocessing" | "construction" | "improvement" | "complete"
  placedCount: number
  totalCount: number
  currentDepth: number
  bestScore: number
  elapsedMs: number
  currentAssignment: Map<string, SlotPosition> // リアルタイム配置状態
  violationCount: number
  patternIndex?: number // 複数パターン時の現在パターン番号
}
```

**ハイブリッドアルゴリズム: 4フェーズ構成**

```
Phase 1: 前処理・制約伝播
    ↓
Phase 2: 段階的深化バックトラッキング構築
    ↓
Phase 3: 焼きなまし法 + 反復局所探索による改善
    ↓
Phase 4: FIT連鎖探索による残り駒解消
```

**Phase 1: 前処理・制約伝播**

- 各駒の配置可能ドメイン（曜日×時限の組合せ）を計算
- Arc Consistency (AC-3) による初期ドメイン削減
- 制約グラフの構築と制約間の依存関係分析
- 「禁止」制約（weight=100）は即座にドメインから除外
- **Advisor事前チェック**: 制約の矛盾検出・データ不整合の警告
  - 配置不可能な駒の早期検出
  - 過剰な制約の組合せの警告
  - 先生の空き時間不足の警告

**Phase 2: 段階的深化バックトラッキング構築**
実績ある段階的探索を、現代のCSPヒューリスティクスで強化する。

- **変数選択ヒューリスティクス**:
  - MRV (Minimum Remaining Values) — 配置可能な場所が最も少ない駒を優先
  - 駒の優先度（priority 0-9）で同順位を解決
  - 連続授業・TT・選択授業など複雑な駒を先に配置
- **値選択ヒューリスティクス**:
  - LCV (Least Constraining Value) — 他の駒への影響が最も小さい場所から
  - 「考慮」制約の重み付きコストが最小の場所を優先
- **制約伝播**:
  - Forward Checking + MAC (Maintaining Arc Consistency)
  - 配置のたびに関連する駒のドメインを更新
- **段階的深化**:
  - 通常モード: 4段階の探索深度（各段階で打ち切り回数を増加）
  - 長時間モード: 6段階の探索深度
  - 各段階で解が見つからなければ、深度を増して再試行
- **制約レベルの適用**:
  - weight=100 (prohibit): ハード制約として厳密適用
  - weight=1-99 (consider): コスト関数で重み付き評価
  - weight=0 (ignore): 無視
- **制約リラックスモード**:
  - 全制約を満たせない場合、weight の低い制約から順に自動緩和
  - 緩和した制約を `relaxedConstraints` として結果に報告
  - ユーザーにどの制約が緩和されたかを明示

**Phase 3: 焼きなまし法 + 反復局所探索による改善**
初期解が得られた後、メタヒューリスティクスで解の品質を改善する。

- **焼きなまし法 (Simulated Annealing)**:
  - 初期温度から段階的に冷却
  - 近傍操作: 2駒のスワップ、1駒の移動、連続授業ブロックの移動
  - 受理関数: exp(-ΔE/T) で改悪も確率的に受理
  - 「考慮」制約の違反数 × 重みを最小化
  - 駒のバラツキ均一化（同一教科の曜日分散）
  - 先生の負荷バランス（1日の授業数の偏り軽減）
- **反復局所探索 (Iterated Local Search)**:
  - SA で得られた局所最適解を摂動（perturbation）で脱出
  - 摂動: ランダムに3-5駒を外して再配置
  - 複数回の SA + 摂動サイクルで大域的探索
- **「乱数使用」オプション**:
  - 有効時: 初期解のランダム化 + SA の初期温度を高く設定
  - 複数回実行で異なるパターンを生成

**Phase 4: FIT連鎖探索による残り駒解消**
Phase 2-3 で配置できなかった残り駒に対して、連鎖的な駒の入れ替えを探索する。

- **再帰的スワッピング**:
  - 未配置の駒Aを配置するために、既配置の駒Bを外す
  - 外した駒Bの代替配置場所を探索
  - 駒Bも配置できない場合、さらに駒Cを外して…と再帰的に探索
  - 探索深度の上限を設定（デフォルト: 5段階）
- **連鎖入れ替え候補の提示**:
  - 入れ替え候補を交換駒数の少ない順にリスト化
  - ユーザーが候補を選択して適用可能
- **学習型探索**:
  - 前回の試行で失敗したパターンを記録
  - 次回の試行では異なるアプローチを優先
  - 残り駒をゼロに近づけるまで反復試行

**複数パターン生成:**

- `multiPattern: true` の場合、異なる乱数シードで `patternCount` 回の探索を実行
- 各パターンのスコア（制約違反の重み付き合計）を計算
- パターン比較画面でユーザーが最適なパターンを選択
- パターン間の差異をハイライト表示

**Web Worker 並列実行:**

- 自動作成エンジンは Web Worker で実行（UIスレッドをブロックしない）
- 長時間モードでは複数 Worker で並列探索
- Worker からメインスレッドへ `SolverProgress` を定期通知（100ms間隔）
- ユーザーによる中断（ESCキー / 中止ボタン）に即座に応答
- 複数パターン生成時は各パターンを独立 Worker で並列実行

```typescript
// lib/solver/scheduler.ts（概要）
class TimetableScheduler {
  private constraints: Constraint[];
  private komas: Koma[];
  private slots: Slot[];

  async *solve(config: SolverConfig): AsyncGenerator<SolverProgress, SolverResult[]> {
    const results: SolverResult[] = [];
    const patternCount = config.multiPattern ? config.patternCount : 1;

    for (let i = 0; i < patternCount; i++) {
      const seed = config.useRandom ? Date.now() + i : i;

      // Phase 1: 前処理・制約伝播
      const domains = this.initializeDomains();
      const advisor = this.runAdvisorCheck(domains);
      if (advisor.hasErrors) yield { phase: "preprocessing", ...advisor };
      this.propagateConstraints(domains); // AC-3

      // Phase 2: 段階的深化バックトラッキング構築
      const maxStages = config.longSearch ? 6 : 4;
      let solution: Assignment | null = null;
      for (let stage = 1; stage <= maxStages; stage++) {
        solution = await this.backtrackWithDepthLimit(domains, config, stage, seed);
        yield { phase: "construction", stage, ... };
        if (solution && solution.remainingCount === 0) break;
      }

      // Phase 3: SA + ILS 改善
      if (solution) {
        solution = await this.improveWithSA_ILS(solution, config);
        yield { phase: "improvement", ... };
      }

      // Phase 4: FIT連鎖探索（残り駒がある場合）
      if (solution && solution.remainingCount > 0) {
        solution = await this.fitChainSwap(solution, config);
      }

      results.push(this.buildResult(solution, config));
      yield { phase: "complete", patternIndex: i, ... };
    }

    return results;
  }

  // MRV + 優先度: 最も制約の厳しい駒を選択
  private selectVariable(domains: DomainMap): Koma { ... }

  // LCV + 重み: 最も影響の少ない配置場所を選択
  private orderValues(koma: Koma, domain: Slot[]): Slot[] { ... }

  // 制約チェック（weight考慮）
  private isConsistent(assignment: Assignment, koma: Koma, slot: Slot): ConsistencyResult { ... }

  // コスト評価（weight付き制約違反スコア）
  private evaluateCost(assignment: Assignment): number { ... }

  // 焼きなまし法 + 反復局所探索
  private async improveWithSA_ILS(solution: Assignment, config: SolverConfig): Promise<Assignment> { ... }

  // FIT連鎖入れ替え探索
  private async fitChainSwap(solution: Assignment, config: SolverConfig): Promise<Assignment> { ... }

  // Advisor事前チェック
  private runAdvisorCheck(domains: DomainMap): AdvisorResult { ... }

  // 制約リラックス
  private relaxConstraints(constraints: Constraint[], failedKoma: Koma): Constraint[] { ... }
}
```

#### 4-5. 振替提案機能

手動駒埋めにおいて、駒の配置が困難な場合に連鎖的な入れ替え候補を提示する。

**機能:**

- 選択した駒に対して、配置可能にするための入れ替え案を自動探索
- 連鎖入れ替え（駒A→駒B→駒C...）をグラフィカルに矢印で表示
- 入れ替え駒数の少ない順にソートして候補リスト表示（最大20件）
- 候補選択でプレビュー表示 → 確定ボタンで一括適用
- 対象範囲: 同一先生内、同一クラス内、全体から選択可能

#### 4-6. 赤駒自動修正

制約違反のある駒（赤色表示）を自動的に修正する機能。

**機能:**

- 条件違反のある駒を検出し、一覧表示
- 「自動修正」ボタンで違反駒の代替配置場所を探索
- 修正候補を提示し、ユーザーが確認してから適用
- 修正不可能な場合はその理由を表示

#### 4-7. 複数パターン比較画面

自動作成で複数パターンを生成した場合の比較・選択画面。

**UI:**

```
┌──────────────────────────────────────────────────────────────────┐
│ パターン比較                                                       │
├──────────┬──────────┬──────────┬──────────────────────────────────┤
│ パターン1  │ パターン2  │ パターン3  │ 比較サマリー                     │
│ スコア: 45 │ スコア: 52 │ スコア: 38 │                                │
│ 違反: 3    │ 違反: 5    │ 違反: 2    │ ★パターン3を推奨               │
│ 配置率:    │ 配置率:    │ 配置率:    │ - 違反数最少                    │
│  100%     │  98.5%    │  100%     │ - スコア最低                    │
│ [先生表示] │ [先生表示] │ [先生表示] │                                │
│ [クラス表示]│ [クラス表示]│ [クラス表示]│ [差異のみ表示]                 │
│            │            │            │                                │
│ [採用]     │ [採用]     │ [採用]     │                                │
└──────────┴──────────┴──────────┴──────────────────────────────────┘
```

- パターン間の差異をハイライト表示（異なる配置箇所を色分け）
- 各パターンの制約違反詳細を比較表示
- 先生/クラスごとの負荷バランスをレーダーチャートで比較
- 「採用」ボタンで選択したパターンを確定（他のパターンは削除可能）

### 5. 日課管理モジュール（2層スケジューリング）

計画済みの週間時間割（基本時間割）に対して、日々の臨時変更を管理する機能。
「計画版」と「日常変更版」の2レイヤー時間割管理を実装。

#### 5-1. 臨時時間割作成

- カレンダーから対象日を選択
- 基本時間割を元にした当日の時間割を表示
- 変更理由の入力（出張、病欠、学校行事、天候等）
- 変更種類の選択:
  - **授業取消**: 特定時限の授業をキャンセル（自習に変更）
  - **代替教員**: 欠勤教員の代わりに他の教員を割当
  - **授業入替**: 2つの授業を入れ替え
  - **特別授業**: 通常と異なる授業を配置

#### 5-2. 代替教員の自動提案

- 欠勤教員の担当授業を一覧表示
- 各時限について、代替可能な教員を自動検索:
  - 当該時限に空きがある教員
  - 科目の専門性（同一教科の教員を優先）
  - 当日の授業数バランス（負荷が少ない教員を優先）
  - 過去の代替回数（公平性を考慮）
- 推奨度順に候補をリスト表示
- ワンクリックで代替を確定

#### 5-3. 授業振替提案

- 行事等で授業が減少する場合、振替先の候補を自動提案
- 影響を受ける駒の一覧と、振替可能な日時のマトリクスを表示

#### 5-4. 授業時数集計

- 日課変更を反映した実施済み授業時数の自動集計
- 計画時数 vs 実績時数の差分表示
- 教科別・クラス別・先生別の集計表
- 不足時数の警告表示

### 6. 試験監督自動割当モジュール

定期テスト等の試験監督を自動的に割り当てる機能。

#### 6-1. 試験スケジュールの設定

- 試験名、期間（開始日～終了日）の設定
- 日程×時限の試験科目マトリクスの入力
- クラスごとの試験科目の割当

#### 6-2. 監督教員の自動割当

- 以下の条件で最適な監督教員を自動割当:
  - 当該科目の担当教員を優先（質問対応のため）
  - 担当教員が不可の場合は空き教員から選択
  - 1日の監督回数のバランス
  - 試験期間全体での負荷バランス
- 手動での変更・修正も可能
- 割当結果の一覧表を印刷/PDF出力

### 7. 選択科目最適化モジュール

選択授業の組み合わせを最適化し、全生徒の希望を最大限に満たすパターンを計算する。

#### 7-1. 選択希望の入力

- 生徒の選択科目希望をクラス単位で入力（CSVインポート対応）
- 各選択科目の開講条件（最小人数/最大人数）の設定
- 同時開講可能なクラスター（ライン）の設定

#### 7-2. 最適化計算

- 生徒全員の希望を最大限満たす同時開講パターンを自動計算
- 希望充足率の表示
- 開講できない科目・希望が叶わない生徒の一覧
- 複数の代替パターンの提示

### 8. 確認モジュール

#### 8-1. 全体表

- **先生全体表**: 先生（行）× 曜日・時限（列）のマトリクス
- **クラス全体表**: クラス（行）× 曜日・時限（列）のマトリクス
- 注目機能: 最大4つの教科/科目をハイライト表示（カラーオーバーレイ）
- 表示切替: 先生表示 / クラス表示
- フィルタ: 学年、教科で絞り込み

#### 8-2. 個別表

- 先生別 or クラス別の時間割カード表示
- 前/次のナビゲーション
- 注目ハイライト（全体表と同様）
- 時間数の集計表示

#### 8-3. 統合型診断ツール

- 完成した時間割の品質を総合診断
- チェック項目:
  - 制約違反の一覧（重み付き）
  - 先生の負荷バランス（曜日別授業数の偏り）
  - クラスの空き時間（ギャップ）分析
  - 教室の稼働率
  - 同一教科の曜日分散度
- 診断結果をスコアカード形式で表示（A～Eの5段階評価）
- 改善提案の自動生成

### 9. 印刷・出力モジュール

9種類の帳票:

| 帳票             | 説明                                |
| ---------------- | ----------------------------------- |
| 先生全体表       | 全先生の時間割を1枚のマトリクスで   |
| クラス全体表     | 全クラスの時間割を1枚のマトリクスで |
| 先生用時間割     | 先生個人別の時間割カード            |
| クラス用時間割   | クラス別の時間割カード              |
| 特別教室用時間割 | 教室別の利用スケジュール            |
| 校務一覧表       | 校務と参加者の一覧                  |
| 先生一覧表       | 先生名と基本情報                    |
| 駒一覧           | 全駒の詳細情報                      |
| 残り駒一覧       | 未配置の駒                          |

各帳票の共通設定:

- 出力範囲の選択（先生/クラス/教室を個別選択）
- 罫線の種類設定（外枠/中枠/日ごと/週ごと × なし/細線/太線/二重線/点線）
- 出力順序（教科順/担任順/入力順）
- 印刷サイズ（B4横/A4横(80%縮小)/A3横）
- フッター設定

出力形式:

- **PDF出力**（@react-pdf/renderer）
- **Excel出力**（exceljs）: 従来のテキストファイル出力の代替
- **印刷プレビュー**

### 10. 授業数カウント機能

授業数カウント機能を統合:

- 年間行事予定との連携
- 休業日の設定
- 行事名の登録
- 時間割を適用した授業時数の自動計算
- 全体行事表の印刷

### 11. 祝日・休日マスターデータ

`public/holidays.json` に日本の祝日データを搭載:

- 2020年〜2030年の祝日を網羅
- 振替休日の自動計算
- 天皇誕生日（2/23）、山の日、スポーツの日等、最新の祝日に対応
- ユーザーによる追加休日の登録機能

---

## UI/UXデザイン方針

### 全体方針

- **shadcn/ui のデザインシステム**に統一
- ダークモード / ライトモード対応
- レスポンシブ（ただしデスクトップファーストで最低1280px幅を想定）
- 日本語UIに最適化（MSゴシック/Noto Sans JP等の等幅フォント対応）
- キーボードショートカット対応（Ctrl+S で保存、Ctrl+Z で元に戻す等）
- Undo/Redo 機能（手動駒埋め操作）

### コンポーネント設計

**時間割グリッド（TimetableGrid）** — 最重要コンポーネント:

- 曜日（列）× 時限（行）のマトリクス
- 各セルに駒のカード表示（科目名、先生名、教室名）
- 教科別の色分け（カスタムカラー設定と連動）
- ドラッグ&ドロップ対応
- セルホバー時のツールチップ（駒の詳細情報）
- 条件違反セルの警告表示（赤枠/アイコン）
- 固定駒のロックアイコン表示
- A表/B表の切替タブ

**都合マトリクス（AvailabilityGrid）**:

- 曜日×時限のセルをクリックで3状態トグル
- 色分け: 緑(可)/赤(不可)/黄(避けたい)
- ドラッグで連続セルの一括設定

**駒カード（KomaCard）**:

- コンパクトなカード形式
- 科目色のアクセントバー
- ドラッグハンドル
- 右クリックメニュー

**進捗ステッパー（WorkflowStepper）**:

- 初期設定 → データ → 駒作成 → 駒埋め → 確認 → 印刷
- 各ステップの完了状態を視覚的に表示
- クリックで該当ステップにジャンプ

### カラーパレット（教科デフォルト色）

| 教科 | 色                     |
| ---- | ---------------------- |
| 国語 | #EF4444 (赤)           |
| 社会 | #F97316 (オレンジ)     |
| 数学 | #3B82F6 (青)           |
| 理科 | #22C55E (緑)           |
| 英語 | #A855F7 (紫)           |
| 音楽 | #EC4899 (ピンク)       |
| 美術 | #F59E0B (黄)           |
| 保体 | #14B8A6 (ティール)     |
| 技家 | #8B5CF6 (インディゴ)   |
| 道徳 | #6B7280 (グレー)       |
| 学活 | #64748B (スレート)     |
| 総合 | #0EA5E9 (スカイ)       |
| 校務 | #DC2626 (ダークレッド) |

---

## Electron IPC ハンドラ設計

`score-at-once-electron` と同様のパターンで、以下のハンドラを実装:

```
electron-src/ipc-handlers/
├── schoolHandlers.ts       # 学校基本設定CRUD
├── teacherHandlers.ts      # 先生CRUD + インポート
├── classHandlers.ts        # クラスCRUD
├── subjectHandlers.ts      # 科目CRUD
├── roomHandlers.ts         # 特別教室CRUD
├── dutyHandlers.ts         # 校務CRUD
├── komaHandlers.ts         # 駒CRUD + 一括生成
├── conditionHandlers.ts    # 処理条件CRUD（重み付き制約管理）
├── schedulerHandlers.ts    # 自動作成エンジン（Worker起動・複数パターン）
├── swapProposalHandlers.ts # 振替提案・FIT連鎖探索
├── timetableHandlers.ts    # 時間割スロットCRUD
├── patternHandlers.ts      # 複数パターン管理・比較
├── checkHandlers.ts        # 駒チェック・Advisor事前チェック
├── diagnosisHandlers.ts    # 統合型診断ツール
├── dailyHandlers.ts        # 日課管理・臨時時間割
├── substituteHandlers.ts   # 代替教員管理・自動提案
├── examHandlers.ts         # 試験監督自動割当
├── electiveHandlers.ts     # 選択科目最適化
├── exportHandlers.ts       # PDF/Excel出力
├── printHandlers.ts        # 印刷関連
├── countHandlers.ts        # 授業数カウント
├── fileHandlers.ts         # ファイル保存/読込
├── holidayHandlers.ts      # 祝日マスタ管理
└── backupHandlers.ts       # 自動バックアップ
```

---

## 自動バックアップ

- 設定でON/OFF切替可能
- 操作ごとに自動保存（デバウンス付き）
- バックアップファイルのローテーション（最大10世代）
- SQLiteファイルのコピーによる実装

---

## ファイル管理

- 1つの時間割プロジェクト = 1つのSQLiteファイル
- 「新規作成」「開く」「名前を付けて保存」の標準ファイル操作
- 最近使ったファイルの履歴（最大16件）
- ファイルにコメントと使用開始日を付与可能

---

## 開発の優先順位

### Phase 1: 基盤（MVP）

1. プロジェクト初期構築（Electron + Next.js + Prisma + SQLite）
2. データモデル定義・マイグレーション
3. 学校基本設定画面
4. 科目の設定画面
5. 先生の設定画面
6. クラスの設定画面

### Phase 2: データ入力

7. 特別教室の設定画面
8. 校務の設定画面
9. 駒の設定画面
10. 駒の一括生成機能

### Phase 3: 時間割作成（コア機能）

11. 処理条件設定画面（重み付き制約管理UI）
12. 駒のチェック機能（Advisor事前チェック強化）
13. 手動駒埋め画面（D&D + Violations Pane + シャドウ表示）
14. ハイブリッドCSPソルバー（4フェーズアルゴリズム）
15. 来る駒/駒の行き先パネル
16. 振替提案機能（FIT連鎖探索）
17. 赤駒自動修正
18. 複数パターン生成・比較画面

### Phase 4: 確認・出力

19. 全体表・個別表の確認画面
20. 統合型診断ツール
21. PDF出力（9種類の帳票）
22. Excel出力
23. 印刷プレビュー

### Phase 5: 日課管理・運用支援

24. 日課管理モジュール（臨時時間割・2層スケジューリング）
25. 代替教員の自動提案
26. 授業振替提案
27. 授業時数集計（日課変更反映）

### Phase 6: 拡張機能

28. 試験監督自動割当
29. 選択科目最適化
30. 授業数カウント機能（年間行事連携）
31. 自動バックアップ
32. Undo/Redo
33. ダークモード
34. キーボードショートカット最適化

---

## 機能一覧

### 基本機能（従来ソフト継承）

| 機能カテゴリ               | 実装方法                          |
| -------------------------- | --------------------------------- |
| 1週間/2週間制              | A表/B表タブ切替                   |
| 帯の時間割                 | 帯モード対応                      |
| 校務の設定                 | 校務モジュール                    |
| 特別教室の設定             | 教室モジュール                    |
| 先生の都合                 | 都合マトリクス（3状態）           |
| 駒の一括生成               | 一括生成ウィザード                |
| 処理条件（5段階+教科指定） | 条件テーブル + 教科別ダイアログ   |
| 手動駒埋め                 | D&Dグリッド + 来る駒/行き先パネル |
| 全体表（先生/クラス）      | マトリクスビュー + ハイライト     |
| 個別表                     | カードビュー                      |
| 9種類の帳票印刷            | PDF/Excel/印刷プレビュー          |
| データ出力                 | Excel出力                         |
| 祝日データ                 | holidays.json + API自動更新       |
| 授業数カウント             | 統合モジュール                    |
| プロジェクトファイル       | .sqlite ファイル                  |

### 拡張機能

| 機能カテゴリ                      | 実装方法                                                      |
| --------------------------------- | ------------------------------------------------------------- |
| ハイブリッドCSPソルバー           | 4フェーズ: 制約伝播→段階的BT→SA+ILS→FIT連鎖（Web Worker並列） |
| 制約の重み付け（0-100）           | 各制約にスライダーで重みを設定、コスト関数で重み付き評価      |
| 制約リラックスモード              | 全制約を満たせない場合、低重み制約を自動緩和して報告          |
| 複数パターン生成・比較            | 異なる乱数シードで複数解を生成、差異ハイライト付き比較画面    |
| 振替提案機能（FIT連鎖探索）       | 配置困難な駒に対して連鎖入れ替え候補をグラフィカルに表示      |
| 赤駒自動修正                      | 制約違反駒の代替配置を自動探索、候補提示後に適用              |
| Violations Pane（制約違反パネル） | 制約違反のリアルタイム一覧表示、クリックでジャンプ            |
| Advisor事前チェック               | 自動作成前にデータ矛盾・制約過剰を自動検出して警告            |
| シャドウ表示                      | ドラッグ中に先生・教室の使用状況をリアルタイム表示            |
| 統合型診断ツール                  | 完成時間割の品質を多角的に診断、A～Eの5段階評価               |
| 日課管理（2層スケジューリング）   | 基本時間割＋日々の臨時変更の2レイヤー管理                     |
| 代替教員の自動提案                | 欠勤時に空き・専門性・負荷バランスから最適代替を自動提案      |
| 授業振替提案                      | 行事等での授業減少時に振替先候補を自動提示                    |
| 授業時数集計（日課変更反映）      | 計画vs実績の差分表示、不足時数警告                            |
| 試験監督自動割当                  | 科目適性・負荷バランスで監督教員を自動割当                    |
| 選択科目最適化                    | 生徒の選択希望を最大限満たすパターンを自動計算                |
| 作成過程表示                      | リアルタイムアニメーション + 進捗バー                         |

---

## 非機能要件

- **パフォーマンス**:
  - 自動作成（通常モード）: 30先生×20クラスの規模で60秒以内に初期解を返すこと
  - 自動作成（長時間モード）: 同規模で10分以内に最適化済みの解を返すこと
  - 複数パターン生成: 3パターンを5分以内に生成（Web Worker並列実行）
  - 振替提案: 選択した駒に対して3秒以内に候補を提示
  - 代替教員提案: 1秒以内に候補リストを生成
  - 配置率目標: 平均99%以上
- **メモリ**: Electronアプリとして500MB以下のメモリ使用量
- **起動時間**: 5秒以内にメイン画面を表示
- **ファイルサイズ**: SQLiteファイルは10MB以下（通常の学校規模）
- **対応OS**: Windows 10/11, macOS 12+, Ubuntu 22.04+
- **日本語対応**: UIテキストはすべて日本語、帳票出力も日本語フォント対応
- **アクセシビリティ**: キーボード操作のみで全操作が可能、色覚多様性への配慮（色だけでなくアイコン・パターンでも情報を伝達）

---

## E2Eテスト

Playwright の Electron サポートを使い、全スタック（UI → IPC → Prisma → SQLite）を検証する E2E テストを実装済み。

### テスト構成（38テスト）

| ファイル                     | テスト内容                               | テスト数 |
| ---------------------------- | ---------------------------------------- | -------- |
| `e2e/dashboard.spec.ts`      | ダッシュボード表示・ナビカード遷移       | 5        |
| `e2e/setup-school.spec.ts`   | 学校基本設定CRUD・永続化                 | 5        |
| `e2e/setup-subjects.spec.ts` | 科目設定・デフォルト科目・CRUD・タブ切替 | 6        |
| `e2e/teachers.spec.ts`       | 先生設定CRUD・都合・持ち駒タブ           | 7        |
| `e2e/rooms.spec.ts`          | 特別教室CRUD・使用可能時間               | 5        |
| `e2e/duties.spec.ts`         | 校務CRUD・担当先生割当                   | 5        |
| `e2e/koma.spec.ts`           | 駒設定・一括生成・学年タブ               | 5        |

### テスト用DB分離

- 環境変数 `TIMETABLE_DATA_DIR` でテスト専用の一時ディレクトリを指定
- 環境変数 `NEXT_SERVER_PORT` でポート衝突を回避（テスト時: 3100）
- 各テストスイートで独立した DB を使用し、終了時にクリーンアップ

### 実行コマンド

```bash
npm run test:e2e          # ビルド + 全テスト実行
npm run test:e2e:headed   # ビルド + ブラウザ表示付き実行
npx playwright test       # ビルド済みの場合のテスト実行のみ
```
