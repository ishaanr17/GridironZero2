# Data model for GridironZero

This document describes the core PostgreSQL data model for the American-football "Stockfish" system.

## Core entities

- Player
  - id (uuid, PK)
  - name (text)
  - dob (date)
  - height_cm (int)
  - weight_kg (int)
  - team_id (uuid, FK -> team.id)
  - primary_position_id (uuid, FK -> position.id)
  - traits (jsonb) -- key/value trait map (speed, acceleration, strength, awareness,...)
  - meta (jsonb) -- arbitrary metadata (college, experience, notes)

- Team
  - id (uuid, PK)
  - name (text)
  - abbrev (text)

- Position
  - id (uuid, PK)
  - code (text) e.g., QB, RB, WR, LT, CB
  - role (text) e.g., offense/defense/special

- Roster
  - id (uuid, PK)
  - team_id (uuid, FK)
  - season (int)
  - name (text)

- RosterEntry
  - id (uuid, PK)
  - roster_id (uuid, FK)
  - player_id (uuid, FK)
  - jersey_number (int)
  - slot (text) -- e.g., "starting", "bench"

- Formation
  - id (uuid, PK)
  - name (text)
  - side (text) offense|defense
  - canonical_layout (jsonb) -- coordinates for players on field
  - tags (text[])

- Play
  - id (uuid, PK)
  - formation_id (uuid, FK)
  - name (text)
  - side (text) offense|defense
  - description (text)
  - actions (jsonb) -- per-player route/movement description
  - success_metrics (jsonb) -- historical aggregated metrics

- PlayInstance (a placed play: specific 22 players + assignments)
  - id (uuid, PK)
  - play_id (uuid, FK)
  - roster_id (uuid, FK)
  - assignments (jsonb) -- mapping of player_id -> role/route
  - created_by (uuid) user id optional

- FieldState / Situation
  - id (uuid, PK)
  - down (int)
  - distance (int)
  - yard_line (int) -- 0-100 or use side/possession
  - possession_team_id (uuid)
  - time_remaining (int seconds)
  - score_diff (int)

- AnalysisResult
  - id (uuid, PK)
  - play_instance_id (uuid, FK)
  - field_state_id (uuid, FK)
  - score (numeric) -- higher = better
  - features (jsonb) -- features used for scoring
  - explanation (jsonb) -- rule traces / model attribution

- Concept (learned play concept)
  - id (uuid)
  - name (text)
  - signature (jsonb) -- normalized route patterns / embeddings
  - examples (jsonb) -- references to PlayInstance ids

## Notes / design choices
- Use `jsonb` for flexible traits, actions, and assignments; this enables iteration without DB migrations.
- Normalize players, rosters, formations and plays but index JSONB fields used in queries (GIN indexes).
- Use UUID PKs for easy merging and cloud sync.
- Consider a materialized `play_stats` table storing historical success rates for quick lookup.

## Example SQL snippet

CREATE TABLE player (
  id uuid primary key,
  name text not null,
  dob date,
  height_cm int,
  weight_kg int,
  team_id uuid references team(id),
  primary_position_id uuid references position(id),
  traits jsonb default '{}',
  meta jsonb default '{}'
);

CREATE INDEX idx_player_traits_gin ON player USING gin (traits jsonb_path_ops);
