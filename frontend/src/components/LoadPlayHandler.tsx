import React, { useEffect } from 'react'
import type { Slot, RoutePoint } from '../types'
import { DEFAULT_OFFENSE_SLOTS, createSlot } from '../types'

type LoadPlayPayload = {
  field_state?: { down: number; distance: number }
  offense?: Slot[]
  defense?: Slot[]
  actions?: { player_id?: string; player_slot?: string; route?: RoutePoint[] }[]
}

type LoadPlayHandlerProps = {
  setPlaced?: (placed: any) => void
  setRoutes?: (routes: any) => void
  onLoadPlay?: (payload: LoadPlayPayload) => void
}

export default function LoadPlayHandler({ setPlaced, setRoutes, onLoadPlay }: LoadPlayHandlerProps) {
  useEffect(() => {
    function onLoad(e: Event) {
      const play = (e as CustomEvent).detail
      if (!play) return

      if (onLoadPlay) {
        const offense = DEFAULT_OFFENSE_SLOTS.map((d, i) => {
          const a = play.actions?.[i]
          const route = a?.route ?? []
          return createSlot(d, null, null, route)
        })
        onLoadPlay({
          field_state: play.field_state || { down: 1, distance: 10 },
          actions: play.actions,
          offense
        })
      }

      if (setPlaced && setRoutes) {
        const placed: any[] = []
        const routes: Record<string, RoutePoint[]> = {}
        if (play.actions && Array.isArray(play.actions)) {
          for (let i = 0; i < play.actions.length; i++) {
            const a = play.actions[i]
            const pid = a.player_id ?? a.player_slot ?? `p_load_${i}`
            placed.push({
              placementId: `placed_${Date.now()}_${i}`,
              id: pid,
              name: String(pid),
              x: 80 + i * 30,
              y: 80 + i * 20,
              position: 'WR'
            })
            routes[pid] = a.route || []
          }
        }
        setPlaced(placed)
        setRoutes(routes)
      }
    }
    window.addEventListener('load-play', onLoad)
    return () => window.removeEventListener('load-play', onLoad)
  }, [setPlaced, setRoutes, onLoadPlay])
  return null
}
