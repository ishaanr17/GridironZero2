import React from 'react'

type FootballFieldProps = {
  width: number
  height: number
  children: React.ReactNode
}

export default function FootballField({ width, height, children }: FootballFieldProps) {
  const endZoneH = height * 0.08
  const fieldH = height - endZoneH * 2
  const yardLineCount = 11 // 0 to 100 yards = 11 lines

  return (
    <div className="football-field-wrap" style={{ width, height }}>
      {/* End zone - defense */}
      <div className="endzone endzone--defense" style={{ height: endZoneH, width }} />
      {/* Main field */}
      <div className="football-field" style={{ width, height: fieldH }}>
        <svg className="field-lines" width={width} height={fieldH}>
          <defs>
            <linearGradient id="field-grass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a472a" />
              <stop offset="50%" stopColor="#0d2818" />
              <stop offset="100%" stopColor="#1a472a" />
            </linearGradient>
          </defs>
          <rect width={width} height={fieldH} fill="url(#field-grass)" />
          {/* Yard lines */}
          {Array.from({ length: yardLineCount }, (_, i) => {
            const x = (i / (yardLineCount - 1)) * width
            return (
              <line
                key={i}
                x1={x}
                y1={0}
                x2={x}
                y2={fieldH}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={i === 0 || i === yardLineCount - 1 ? 3 : 1}
              />
            )
          })}
          {/* Hash marks (small ticks) */}
          {Array.from({ length: 9 }, (_, i) => {
            const y = ((i + 1) / 10) * fieldH
            return (
              <React.Fragment key={`h-${i}`}>
                <line x1={width * 0.15} y1={y} x2={width * 0.18} y2={y} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                <line x1={width * 0.82} y1={y} x2={width * 0.85} y2={y} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
              </React.Fragment>
            )
          })}
        </svg>
        <div className="field-slots-layer" style={{ width, height: fieldH }}>
          {children}
        </div>
      </div>
      {/* End zone - offense */}
      <div className="endzone endzone--offense" style={{ height: endZoneH, width }} />
    </div>
  )
}
