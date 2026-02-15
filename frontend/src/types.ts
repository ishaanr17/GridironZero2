export type Player = { id: string; name: string; position: string; traits: Record<string, number> }

export type FieldState = { down: number; distance: number; yardLine?: number }

export type RoutePoint = { x: number; y: number }

export type Slot = {
  slotId: string
  label: string
  x: number
  y: number
  playerId: string | null
  player: Player | null
  route: RoutePoint[]
}

export const DEFAULT_OFFENSE_SLOTS: Omit<Slot, 'playerId' | 'player' | 'route'>[] = [
  { slotId: 'QB', label: 'QB', x: 50, y: 78 },
  { slotId: 'C', label: 'C', x: 50, y: 74 },
  { slotId: 'LG', label: 'LG', x: 44, y: 74 },
  { slotId: 'RG', label: 'RG', x: 56, y: 74 },
  { slotId: 'LT', label: 'LT', x: 40, y: 74 },
  { slotId: 'RT', label: 'RT', x: 60, y: 74 },
  { slotId: 'WR1', label: 'WR', x: 28, y: 70 },
  { slotId: 'WR2', label: 'WR', x: 72, y: 70 },
  { slotId: 'TE', label: 'TE', x: 60, y: 72 },
  { slotId: 'RB1', label: 'RB', x: 48, y: 84 },
  { slotId: 'RB2', label: 'RB', x: 52, y: 84 }
]

export const DEFAULT_DEFENSE_SLOTS: Omit<Slot, 'playerId' | 'player' | 'route'>[] = [
  { slotId: 'DE1', label: 'DE', x: 36, y: 44 },
  { slotId: 'DT1', label: 'DT', x: 48, y: 44 },
  { slotId: 'DT2', label: 'DT', x: 52, y: 44 },
  { slotId: 'DE2', label: 'DE', x: 64, y: 44 },
  { slotId: 'LB1', label: 'LB', x: 38, y: 34 },
  { slotId: 'LB2', label: 'LB', x: 50, y: 34 },
  { slotId: 'LB3', label: 'LB', x: 62, y: 34 },
  { slotId: 'CB1', label: 'CB', x: 28, y: 38 },
  { slotId: 'CB2', label: 'CB', x: 72, y: 38 },
  { slotId: 'S1', label: 'S', x: 40, y: 20 },
  { slotId: 'S2', label: 'S', x: 60, y: 20 }
]

export function createSlot(
  def: Omit<Slot, 'playerId' | 'player' | 'route'>,
  playerId?: string | null,
  player?: Player | null,
  route?: RoutePoint[]
): Slot {
  return {
    ...def,
    playerId: playerId ?? null,
    player: player ?? null,
    route: route ?? []
  }
}
