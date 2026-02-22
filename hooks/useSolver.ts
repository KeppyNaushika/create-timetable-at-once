"use client"

import { useCallback, useRef, useState } from "react"

import type {
  SolverConfig,
  SolverInput,
  SolverProgress,
  SolverResult,
  WorkerResponse,
  DEFAULT_SOLVER_CONFIG,
} from "@/lib/solver/types"
import { DEFAULT_SOLVER_CONFIG as DEFAULTS } from "@/lib/solver/types"

export function useSolver() {
  const workerRef = useRef<Worker | null>(null)
  const [progress, setProgress] = useState<SolverProgress | null>(null)
  const [result, setResult] = useState<SolverResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(
    (input: SolverInput, config: SolverConfig = DEFAULTS) => {
      // Cleanup previous worker
      if (workerRef.current) {
        workerRef.current.terminate()
      }

      setIsRunning(true)
      setError(null)
      setResult(null)
      setProgress(null)

      try {
        const worker = new Worker(
          new URL("../lib/solver/solver.worker.ts", import.meta.url)
        )

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const msg = event.data

          switch (msg.type) {
            case "progress":
              setProgress(msg.data)
              break
            case "result":
              setResult(msg.data)
              setIsRunning(false)
              worker.terminate()
              workerRef.current = null
              break
            case "error":
              setError(msg.message)
              setIsRunning(false)
              worker.terminate()
              workerRef.current = null
              break
          }
        }

        worker.onerror = (event) => {
          setError(event.message ?? "Worker error")
          setIsRunning(false)
          worker.terminate()
          workerRef.current = null
        }

        workerRef.current = worker
        worker.postMessage({ type: "start", input, config })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "ソルバーの起動に失敗しました"
        )
        setIsRunning(false)
      }
    },
    []
  )

  const abort = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
      setIsRunning(false)
      setError("中断されました")
    }
  }, [])

  return {
    start,
    abort,
    progress,
    result,
    isRunning,
    error,
  }
}
