"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  title: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`${this.props.title} crashed`, error, info)
    }
  }

  private retry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-lg items-center justify-center px-4 py-16">
        <div className="w-full rounded-[2rem] border border-white/10 bg-card/80 p-6 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl drift-gradient opacity-90" />
          <h2 className="text-xl font-semibold text-foreground">{this.props.title} needs a refresh</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            Something didn&apos;t load right. Try again and we&apos;ll reload this section.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}
