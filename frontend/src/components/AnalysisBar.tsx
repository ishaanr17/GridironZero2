import React from 'react'

export type AnalysisResult = {
  play_instance_id: string
  score: number
  raw_score: number
  explanation: string[]
} | null

type AnalysisBarProps = {
  results: AnalysisResult[] | null
  loading: boolean
  error: string | null
}

export default function AnalysisBar({ results, loading, error }: AnalysisBarProps) {
  if (loading) {
    return (
      <div className="analysis-bar analysis-bar--loading">
        <span className="analysis-bar__label">Analysis</span>
        <span className="analysis-bar__value">Running…</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="analysis-bar analysis-bar--error">
        <span className="analysis-bar__label">Analysis</span>
        <span className="analysis-bar__value">{error}</span>
      </div>
    )
  }
  if (!results || results.length === 0) {
    return (
      <div className="analysis-bar">
        <span className="analysis-bar__label">Analysis</span>
        <span className="analysis-bar__value">Run Analyze to see scores and explanation.</span>
      </div>
    )
  }
  const best = results[0]
  if (!best || typeof best !== 'object') {
    return (
      <div className="analysis-bar">
        <span className="analysis-bar__label">Analysis</span>
        <span className="analysis-bar__value">No results</span>
      </div>
    )
  }
  const explanation = (best.explanation || []).join(' · ')
  return (
    <div className="analysis-bar analysis-bar--has-results">
      <span className="analysis-bar__label">Score</span>
      <span className="analysis-bar__score">{best.score.toFixed(1)}</span>
      <span className="analysis-bar__divider">|</span>
      <span className="analysis-bar__label">Explanation</span>
      <span className="analysis-bar__value">{explanation || '—'}</span>
    </div>
  )
}
