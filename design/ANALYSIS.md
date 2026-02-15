# Analysis engine design (hybrid: rules + ML)

This document outlines the analysis engine for GridironZero. The engine is hybrid: a rules-based heuristic core for fast, interpretable scoring and an ML augmentation layer for learned adjustments and concept detection.

## Goals
- Recommend best plays given a `FieldState` and `PlayInstance` set.
- Produce interpretable `explanation` traces for each recommendation.
- Learn and surface play `Concept`s (clusters/patterns) over time.

## Inputs
- `FieldState`: down, distance, yard_line, possession, time_remaining, score_diff
- `PlayInstance`: assigned 22 players, per-player `actions` (routes/movements)
- Player `traits`: numeric scores (speed, acceleration, strength, awareness, catching, blocking, tackling)

## Architecture
- Rule Engine (always-on): fast evaluation using domain rules (down/distance heuristics, matchups, mismatch detection, risk/reward)
- Feature Extractor: converts play+players+field into a feature vector used by both rules and ML models.
- ML Layer (optional): a lightweight model (e.g., gradient-boosted tree or small neural net) trained on labeled play outcomes to provide adjustments or probability estimates.
- Concept Detector: generates normalized signatures for plays (route shapes, spacing, timing) and clusters them (e.g., using k-means or HDBSCAN). Stores `Concept` examples and embeddings.

## Rule engine examples
- On 3rd-and-long favor passing concepts; weigh QB accuracy and WR separation.
- On short distance favor runs or quick passes; weigh RB power, OL run-blocking traits, and route depth.
- Defensive analysis: identify weak matchups (e.g., slow CB vs fast WR) and assign negative score to plays that exploit them for the defense, positive for offense.

## Feature examples
- Aggregate player traits by assignment: e.g., receiver_avg_speed, OL_run_blocking_sum
- Route geometry: max_route_depth, avg_route_angle, crossing_count
- Spacing measures: #players in short/intermediate/deep zones
- Situation features: down, distance, yardline, score_diff, time_remaining

## Output
- For each candidate `PlayInstance`: `score` (numeric), `explanation` (ordered rule traces and top features), optional `probabilities` (yards distribution)

## Evaluation & Data
- Track historical `PlayInstance` => outcome mappings in `play_stats` for offline evaluation.
- Use cross-validation to assess ML uplift and calibrate probabilities.

## Roadmap
1. Implement Rule Engine and Feature Extractor (prototype)
2. Add `analyze` API and UI integration
3. Collect labeled outcomes / synthetic sim data
4. Train ML models to augment rule outputs
5. Add concept embeddings and clustering
