import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import FootballField from './FootballField'
import AnalysisBar, { type AnalysisResult } from './AnalysisBar'
import LoadPlayHandler from './LoadPlayHandler'
import type { Player, Slot, FieldState, RoutePoint } from '../types'
import {
  DEFAULT_OFFENSE_SLOTS,
  DEFAULT_DEFENSE_SLOTS,
  createSlot
} from '../types'

const FIELD_WIDTH = 1000
const FIELD_HEIGHT = 533

export type FieldCanvasHandle = { assignPlayer: (slotId: string, player: Player) => void }

type FieldCanvasProps = {
  players: Player[]
  selectedSlotId: string | null
  onSelectSlot: (slotId: string | null) => void
  initialWorkspace?: { fieldState?: FieldState; offense?: Slot[]; defense?: Slot[] } | null
  onWorkspaceLoad?: (data: { fieldState: FieldState; offense: Slot[]; defense: Slot[] }) => void
  onWorkspaceChange: (data: { fieldState: FieldState; offense: Slot[]; defense: Slot[] }) => void
}

function initSlots(
  offenseDef: typeof DEFAULT_OFFENSE_SLOTS,
  defenseDef: typeof DEFAULT_DEFENSE_SLOTS,
  saved?: { offense?: Slot[]; defense?: Slot[] }
): { offense: Slot[]; defense: Slot[] } {
  const offense = (saved?.offense ?? offenseDef.map((d) => createSlot(d))).slice(0, 11)
  const defense = (saved?.defense ?? defenseDef.map((d) => createSlot(d))).slice(0, 11)
  while (offense.length < 11) offense.push(createSlot({ slotId: `O${offense.length}`, label: '—', x: 50, y: 70 }))
  while (defense.length < 11) defense.push(createSlot({ slotId: `D${defense.length}`, label: '—', x: 50, y: 30 }))
  return { offense, defense }
}

const FieldCanvas = forwardRef<FieldCanvasHandle, FieldCanvasProps>(function FieldCanvas({
  players,
  selectedSlotId: selectedSlotIdProp,
  onSelectSlot,
  initialWorkspace,
  onWorkspaceLoad,
  onWorkspaceChange
}, ref) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const { offense: initO, defense: initD } = initSlots(
    DEFAULT_OFFENSE_SLOTS,
    DEFAULT_DEFENSE_SLOTS,
    initialWorkspace
  )
  const [fieldState, setFieldState] = useState<FieldState>(
    initialWorkspace?.fieldState ?? { down: 1, distance: 10 }
  )
  const [offense, setOffense] = useState<Slot[]>(initO)
  const [defense, setDefense] = useState<Slot[]>(initD)
  const [selectedSlotIdState, setSelectedSlotIdState] = useState<string | null>(null)
  const selectedSlotId = selectedSlotIdProp ?? selectedSlotIdState
  const setSelectedSlotId = useCallback(
    (id: string | null) => {
      setSelectedSlotIdState(id)
      onSelectSlot?.(id)
    },
    [onSelectSlot]
  )
  const [mode, setMode] = useState<'move' | 'draw' | 'assign'>('move')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback(() => {
    onWorkspaceChange({ fieldState, offense, defense })
  }, [fieldState, offense, defense, onWorkspaceChange])

  const appliedInitial = useRef(false)
  useEffect(() => {
    if (initialWorkspace && !appliedInitial.current) {
      appliedInitial.current = true
      if (initialWorkspace.fieldState) setFieldState(initialWorkspace.fieldState)
      if (initialWorkspace.offense?.length) setOffense(initialWorkspace.offense.slice(0, 11))
      if (initialWorkspace.defense?.length) setDefense(initialWorkspace.defense.slice(0, 11))
    }
  }, [initialWorkspace])
  useEffect(() => {
    onWorkspaceLoad?.({ fieldState, offense, defense })
  }, [])

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(persist, 800)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [fieldState, offense, defense, persist])

  function handleLoadPlay(loaded: { field_state?: FieldState; fieldState?: FieldState; offense?: Slot[]; defense?: Slot[]; actions?: any[] }) {
    const fs = loaded.field_state ?? loaded.fieldState
    if (fs) setFieldState(fs)
    const toPercent = (route: RoutePoint[]) =>
      route.map((p) => ({ x: (p.x / FIELD_WIDTH) * 100, y: (p.y / fieldH) * 100 }))
    if (loaded.offense?.length) {
      setOffense(
        loaded.offense.slice(0, 11).map((s) => ({ ...s, route: s.route?.length ? toPercent(s.route) : [] }))
      )
    }
    if (loaded.defense?.length) setDefense(loaded.defense.slice(0, 11))
    if (loaded.actions?.length && !loaded.offense?.length) {
      setOffense((prev) =>
        prev.map((s, i) => {
          const a = loaded.actions![i]
          if (!a?.route?.length) return s
          return { ...s, route: toPercent(a.route) }
        })
      )
    }
  }

  const endZoneH = FIELD_HEIGHT * 0.08
  const fieldH = FIELD_HEIGHT - endZoneH * 2

  function moveSlot(side: 'offense' | 'defense', slotId: string, dx: number, dy: number) {
    const setter = side === 'offense' ? setOffense : setDefense
    setter((prev) =>
      prev.map((s) => {
        if (s.slotId !== slotId) return s
        return {
          ...s,
          x: Math.max(2, Math.min(98, s.x + (dx / FIELD_WIDTH) * 100)),
          y: Math.max(2, Math.min(98, s.y + (dy / fieldH) * 100))
        }
      })
    )
  }

  const assignPlayer = useCallback((slotId: string, player: Player) => {
    setOffense((prev) =>
      prev.some((s) => s.slotId === slotId)
        ? prev.map((s) => (s.slotId === slotId ? { ...s, playerId: player.id, player } : s))
        : prev
    )
    setDefense((prev) =>
      prev.some((s) => s.slotId === slotId)
        ? prev.map((s) => (s.slotId === slotId ? { ...s, playerId: player.id, player } : s))
        : prev
    )
  }, [])

  useImperativeHandle(ref, () => ({ assignPlayer }), [assignPlayer])

  function addRoutePoint(slotId: string, clientX: number, clientY: number) {
    if (!fieldRef.current) return
    const rect = fieldRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top - endZoneH) / (rect.height - endZoneH * 2)) * 100
    setOffense((prev) =>
      prev.map((s) => {
        if (s.slotId !== slotId) return s
        return { ...s, route: [...s.route, { x, y }] }
      })
    )
  }

  function handleFieldClick(e: React.MouseEvent) {
    if (mode !== 'draw' || !selectedSlotId) return
    const target = e.target as HTMLElement
    if (target.closest('.slot-chip')) return
    addRoutePoint(selectedSlotId, e.clientX, e.clientY)
  }

  async function runAnalysis() {
    setAnalysisLoading(true)
    setAnalysisError(null)
    const play_instance = {
      id: `pi_${Date.now()}`,
      assignments: offense
        .filter((s) => s.player)
        .map((s) => ({
          player_id: s.playerId,
          position: s.label,
          role: s.slotId,
          traits: s.player?.traits || {}
        })),
      actions: offense.map((s) => ({
        player_id: s.slotId,
        route: s.route.map((p) => ({ x: (p.x / 100) * FIELD_WIDTH, y: (p.y / 100) * fieldH }))
      }))
    }
    try {
      const res = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_state: fieldState,
          roster_id: null,
          play_instances: [play_instance]
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analyze failed')
      setAnalysisResults(data.results || [])
    } catch (err: any) {
      setAnalysisError(err?.message || 'Analysis failed')
      setAnalysisResults(null)
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function savePlay() {
    const actions = offense.map((s) => ({ player_id: s.slotId, player_slot: s.slotId, route: s.route }))
    const play = {
      id: `play_${Date.now()}`,
      name: `Play ${fieldState.down}&${fieldState.distance} – ${new Date().toLocaleTimeString()}`,
      side: 'offense',
      formation: 'Custom',
      field_state: fieldState,
      actions,
      created_at: new Date().toISOString()
    }
    try {
      const res = await fetch('/api/v1/plays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(play)
      })
      if (!res.ok) throw new Error('Save failed')
      persist()
    } catch (err) {
      console.error(err)
      setAnalysisError('Failed to save play')
    }
  }

  const allSlots = [...offense, ...defense]

  return (
    <div className="field-canvas-wrapper">
      <div className="field-toolbar">
        <div className="field-toolbar__group">
          <label>Down</label>
          <select
            value={fieldState.down}
            onChange={(e) => setFieldState((s) => ({ ...s, down: Number(e.target.value) }))}
          >
            {[1, 2, 3, 4].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="field-toolbar__group">
          <label>Distance</label>
          <select
            value={fieldState.distance}
            onChange={(e) => setFieldState((s) => ({ ...s, distance: Number(e.target.value) }))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="field-toolbar__group field-toolbar__mode">
          <button
            className={mode === 'move' ? 'active' : ''}
            onClick={() => setMode('move')}
            title="Drag players to reposition"
          >
            Move
          </button>
          <button
            className={mode === 'draw' ? 'active' : ''}
            onClick={() => setMode('draw')}
            title="Click a slot, then click on the field to draw its route"
          >
            Draw routes
          </button>
          <button
            className={mode === 'assign' ? 'active' : ''}
            onClick={() => setMode('assign')}
            title="Click a slot, then click a player in the roster to assign"
          >
            Assign
          </button>
        </div>
        <button className="field-toolbar__btn field-toolbar__btn--primary" onClick={runAnalysis}>
          Analyze
        </button>
        <button className="field-toolbar__btn" onClick={savePlay}>
          Save play
        </button>
      </div>

      <div ref={fieldRef} className="field-canvas-container">
        <LoadPlayHandler
          setPlaced={() => {}}
          setRoutes={() => {}}
          onLoadPlay={handleLoadPlay}
        />
        <FootballField width={FIELD_WIDTH} height={FIELD_HEIGHT}>
          {/* Routes (offense only) */}
          <svg className="routes-layer" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
            {offense.map((s) =>
              s.route.length > 0 ? (
                <polyline
                  key={s.slotId}
                  points={s.route.map((p) => `${(p.x / 100) * FIELD_WIDTH},${(p.y / 100) * fieldH}`).join(' ')}
                  fill="none"
                  stroke={selectedSlotId === s.slotId ? '#facc15' : 'rgba(255,255,255,0.9)'}
                  strokeWidth={2}
                />
              ) : null
            )}
          </svg>
          {allSlots.map((slot) => (
            <SlotChip
              key={slot.slotId}
              slot={slot}
              mode={mode}
              isOffense={offense.some((s) => s.slotId === slot.slotId)}
              selected={selectedSlotId === slot.slotId}
              fieldWidth={FIELD_WIDTH}
              fieldHeight={fieldH}
              endZoneH={endZoneH}
              onSelect={() => setSelectedSlotId(slot.slotId)}
              onMove={(dx, dy) =>
                moveSlot(offense.some((s) => s.slotId === slot.slotId) ? 'offense' : 'defense', slot.slotId, dx, dy)
              }
            />
          ))}
        </FootballField>
        <div
          className="field-click-layer"
          style={{ position: 'absolute', left: 0, right: 0, top: endZoneH, height: fieldH, pointerEvents: mode === 'draw' ? 'auto' : 'none' }}
          onClick={handleFieldClick}
        />
      </div>

      <AnalysisBar
        results={analysisResults}
        loading={analysisLoading}
        error={analysisError}
      />
    </div>
  )
})

export default FieldCanvas

type SlotChipProps = {
  slot: Slot
  mode: 'move' | 'draw' | 'assign'
  isOffense: boolean
  selected: boolean
  fieldWidth: number
  fieldHeight: number
  endZoneH: number
  onSelect: () => void
  onMove: (dx: number, dy: number) => void
}

function SlotChip({
  slot,
  mode,
  isOffense,
  selected,
  fieldWidth,
  fieldHeight,
  endZoneH,
  onSelect,
  onMove
}: SlotChipProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    onSelect()
    if (mode === 'move') dragStart.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (mode !== 'move' || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    dragStart.current = { x: e.clientX, y: e.clientY }
    onMove(dx, dy)
  }
  function onPointerUp(e: React.PointerEvent) {
    dragStart.current = null
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  return (
    <div
      ref={ref}
      className={`slot-chip slot-chip--${isOffense ? 'offense' : 'defense'} ${selected ? 'selected' : ''}`}
      style={{
        left: `${(slot.x / 100) * 100}%`,
        top: `${(slot.y / 100) * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <span className="slot-chip__label">{slot.label}</span>
      <span className="slot-chip__name">{slot.player ? slot.player.name.split(' ')[0] : '—'}</span>
    </div>
  )
}
