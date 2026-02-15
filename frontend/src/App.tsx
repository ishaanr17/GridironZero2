import React, { useEffect, useState, useRef, useCallback } from 'react'
import FieldCanvas, { type FieldCanvasHandle } from './components/FieldCanvas'
import PlayLibrary from './components/PlayLibrary'
import type { Player, Slot, FieldState } from './types'

export default function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [playersError, setPlayersError] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<{
    fieldState?: FieldState
    offense?: Slot[]
    defense?: Slot[]
  } | null>(null)
  const fieldRef = useRef<FieldCanvasHandle>(null)

  const loadPlayers = useCallback(() => {
    fetch('/api/v1/players')
      .then((r) => {
        if (!r.ok) throw new Error(`Backend returned ${r.status}`)
        return r.json()
      })
      .then((data) => setPlayers(data.players || []))
      .catch(() => {
        setPlayers([])
        setPlayersError('Could not reach the backend. Is it running on port 4000?')
      })
      .finally(() => setPlayersLoading(false))
  }, [])

  useEffect(() => {
    setPlayersLoading(true)
    setPlayersError(null)
    loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    fetch('/api/v1/workspace')
      .then((r) => r.json())
      .then((data) => setWorkspace(data.workspace || null))
      .catch(() => setWorkspace(null))
  }, [])

  const saveWorkspace = useCallback((data: { fieldState: FieldState; offense: Slot[]; defense: Slot[] }) => {
    fetch('/api/v1/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {})
  }, [])

  function handleImportPlayers(file: File | null, pasteText?: string) {
    const parse = (text: string) => {
      const data = JSON.parse(text)
      const list = Array.isArray(data) ? data : data.players || []
      if (list.length === 0) return
      fetch('/api/v1/players/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: list })
      })
        .then((r) => r.json())
        .then(() => loadPlayers())
        .catch(() => alert('Import failed'))
    }
    if (file) {
      const reader = new FileReader()
      reader.onload = () => parse(String(reader.result))
      reader.readAsText(file)
    } else if (pasteText) parse(pasteText)
  }

  function handleImportPlays(file: File | null, pasteText?: string) {
    const parse = (text: string) => {
      const data = JSON.parse(text)
      const list = Array.isArray(data) ? data : data.plays || []
      if (list.length === 0) return
      fetch('/api/v1/plays/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plays: list })
      })
        .then(() => window.dispatchEvent(new CustomEvent('plays-imported')))
        .catch(() => alert('Import failed'))
    }
    if (file) {
      const reader = new FileReader()
      reader.onload = () => parse(String(reader.result))
      reader.readAsText(file)
    } else if (pasteText) parse(pasteText)
  }

  function handleAssignPlayer(player: Player) {
    if (selectedSlotId) fieldRef.current?.assignPlayer(selectedSlotId, player)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>GridironZero</h1>
        <span className="app-header__tagline">Play design & analysis</span>
      </header>
      {playersError && (
        <div className="app-error" role="alert">
          {playersError} Start the backend with: <code>cd backend && npm run dev</code>
        </div>
      )}
      <div className="content">
        <aside className="roster-panel">
          <section className="roster-section">
            <h2>Roster</h2>
            <div className="roster-actions">
              <label className="btn btn--secondary btn--small">
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImportPlayers(f)
                    e.target.value = ''
                  }}
                  hidden
                />
              </label>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => {
                  navigator.clipboard.readText().then(handleImportPlayers.bind(null, null)).catch(() => alert('Paste failed'))
                }}
              >
                Paste
              </button>
            </div>
            {playersLoading && !playersError ? <p className="loading">Loading…</p> : null}
            <ul className="roster-list">
              {players.map((p) => (
                <li
                  key={p.id}
                  className="roster-item"
                  onClick={() => handleAssignPlayer(p)}
                  title={selectedSlotId ? `Assign to slot` : undefined}
                >
                  <strong>{p.name}</strong>
                  <span className="pos">{p.position}</span>
                </li>
              ))}
            </ul>
          </section>
          <PlayLibrary onImport={handleImportPlays} onLoad={(play) => window.dispatchEvent(new CustomEvent('load-play', { detail: play }))} />
        </aside>
        <main className="field-area">
          <FieldCanvas
            ref={fieldRef}
            players={players}
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
            initialWorkspace={workspace}
            onWorkspaceChange={saveWorkspace}
          />
        </main>
      </div>
    </div>
  )
}
