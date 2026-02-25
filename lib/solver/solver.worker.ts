import { TimetableScheduler } from "./scheduler"
import type {
  SolverProgress,
  SolverResult,
  WorkerMessage,
  WorkerResponse,
} from "./types"

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data

  if (msg.type === "start") {
    try {
      const scheduler = new TimetableScheduler(msg.input, msg.config)

      // BT/SA の同期処理中でも進捗を直接メインスレッドへ送る
      scheduler.setProgressCallback((progress: SolverProgress) => {
        const response: WorkerResponse = {
          type: "progress",
          data: progress,
        }
        self.postMessage(response)
      })

      const generator = scheduler.solve()

      let result: IteratorResult<SolverProgress, SolverResult>

      do {
        result = await generator.next()

        if (!result.done) {
          const response: WorkerResponse = {
            type: "progress",
            data: result.value,
          }
          self.postMessage(response)
        }
      } while (!result.done)

      const response: WorkerResponse = {
        type: "result",
        data: result.value,
      }
      self.postMessage(response)
    } catch (error) {
      const response: WorkerResponse = {
        type: "error",
        message: error instanceof Error ? error.message : "ソルバーエラー",
      }
      self.postMessage(response)
    }
  }
}
