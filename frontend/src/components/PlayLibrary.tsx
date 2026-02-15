import React, { useEffect, useState } from 'react'

type Play = { id: string; name: string }

type PlayLibraryProps = {
  onLoad: (play: any) => void
  onImport?: (file: File | null, pasteText?: string) => void
}

export default function PlayLibrary({ onLoad, onImport }: PlayLibraryProps) {
  const [plays, setPlays] = useState<Play[]>([])

  const refresh = () => {
    fetch('/api/v1/plays')
      .then((r) => r.json())
      .then((d) => setPlays(d.plays || []))
      .catch(() => setPlays([]))
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const onImported = () => refresh()
    window.addEventListener('plays-imported', onImported)
    return () => window.removeEventListener('plays-imported', onImported)
  }, [])

  return (
    <section className="play-library">
      <h3>Play Library</h3>
      {onImport && (
        <div className="play-library-actions">
          <label className="btn btn--secondary btn--small">
            Import JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
                e.target.value = ''
              }}
              hidden
            />
          </label>
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={() =>
              navigator.clipboard.readText().then((t) => onImport(null, t)).catch(() => alert('Paste failed'))
            }
          >
            Paste
          </button>
        </div>
      )}
      <ul className="play-library-list">
        {plays.map((p) => (
          <li key={p.id} className="play-library-item">
            <span className="play-library-item__name">{p.name}</span>
            <button
              type="button"
              className="btn btn--small"
              onClick={() =>
                fetch(`/api/v1/play/${p.id}`)
                  .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
                  .then((d) => onLoad(d.play))
                  .catch(() => alert('Failed to load play'))
              }
            >
              Load
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
