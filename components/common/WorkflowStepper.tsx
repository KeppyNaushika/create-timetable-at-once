"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface Step {
  label: string
  description?: string
  href: string
  completed?: boolean
}

interface WorkflowStepperProps {
  steps: Step[]
  currentStep: number
}

export function WorkflowStepper({ steps, currentStep }: WorkflowStepperProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                index < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : index === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                "text-sm",
                index <= currentStep
                  ? "text-foreground font-medium"
                  : "text-muted-foreground/50"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-3 h-px w-8",
                index < currentStep ? "bg-primary" : "bg-muted-foreground/20"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
