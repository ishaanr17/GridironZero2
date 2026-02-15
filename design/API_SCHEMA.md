# API schema for GridironZero (REST)

Base path: `/api/v1`

## Players
- `GET /players` — list players, supports query params (team, position, trait filters)
- `GET /players/:id` — player detail
- `POST /players` — create player (body: name, dob, traits, meta)
- `PUT /players/:id` — update
- `DELETE /players/:id` — remove

## Rosters
- `GET /rosters` — list rosters
- `POST /rosters` — create roster with entries
- `GET /rosters/:id` — include `entries` array

## Formations & Plays
- `GET /formations` — list formations
- `POST /formations` — create formation (name, canonical_layout)
- `GET /plays` — list plays
- `POST /plays` — create play (formation_id, actions JSON)

## PlayInstance / Simulation
- `POST /analyze` — core analysis endpoint
  - body: {
      "field_state": {down,distance,yard_line,possession_team_id,time_remaining,score_diff},
      "roster_id": uuid,
      "play_instances": [ {play_id:, assignments: {player_id->role}}, ... ]
    }
  - response: [{play_instance_id, score, explanation, features}, ...]

- `POST /simulate` — optional full simulator that returns probabilistic distributions (yards gained, turnovers)

## Concepts & Library
- `GET /concepts` — list learned concepts
- `POST /concepts/identify` — send a `play_instance` and get back matching concepts or a new concept suggestion

## Import / Export
- `POST /import/players` — bulk import CSV/JSON
- `POST /import/plays` — import plays/formations (JSON)
- `GET /export/play/:id` — export play JSON

## Auth & Users
- Keep endpoints behind simple API key or JWT for multi-user. Include `created_by` on user-editable resources.

## Notes on payloads
- Use compact JSON for `actions` and `assignments` (arrays of objects with `player_slot`, `route`, `start_xy`, `end_xy`).
- Analysis responses include both a numeric `score` and an `explanation` (trace of heuristics and model attributions) to keep results interpretable.
