type FieldState = any;
type PlayInstance = any;

// Simple heuristic analyzer: scores plays by summing offensive trait advantages
export function analyzePlays(payload: { field_state: FieldState; roster_id?: string; play_instances: PlayInstance[] }) {
  const { field_state, play_instances } = payload;
  const results = play_instances.map((pi, idx) => {
    // pi.assignments: [{ player_id, role, traits? }]
    const assignments = pi.assignments || [];

    // Basic scoring: sum receivers' speed * route_depth factor + OL run-blocking for runs
    let score = 0;
    const trace: string[] = [];

    // Detect is_pass vs is_run from actions/routes
    const is_pass = (pi.play_type || '').toLowerCase() === 'pass' || (pi.actions && pi.actions.some((a: any) => a.type === 'route'));

    let receiver_speed = 0;
    let receiver_count = 0;
    let ol_run_block = 0;
    assignments.forEach((a: any) => {
      const traits = a.traits || {};
      const pos = (a.position || '').toLowerCase();
      if (pos.startsWith('wr') || pos === 'wr' || pos === 'te') {
        receiver_speed += (traits.speed || 50);
        receiver_count += 1;
      }
      if (pos.startsWith('ol') || pos === 'lg' || pos === 'rg' || pos === 'c' || pos === 'lt' || pos === 'rt') {
        ol_run_block += (traits.run_block || 50);
      }
      if (pos === 'rb') {
        // RB contributes to both run and checkdown
        receiver_speed += (traits.speed || 50) * 0.5;
        receiver_count += 0.5;
      }
    });

    if (is_pass) {
      const avg_speed = receiver_count ? receiver_speed / receiver_count : 50;
      score += avg_speed * 1.2; // favor faster receivers
      trace.push(`pass: avg_receiver_speed=${avg_speed.toFixed(1)}`);
    } else {
      const run_strength = ol_run_block / (assignments.length || 1);
      score += run_strength;
      trace.push(`run: ol_run_block_avg=${run_strength.toFixed(1)}`);
    }

    // situational adjustments
    if (field_state) {
      const { down, distance } = field_state;
      if (down === 3 && distance >= 8) {
        // penalize short-run plays on long 3rd downs
        if (!is_pass) {
          score -= 20;
          trace.push('3rd-and-long: penalize run');
        }
      }
      if (down === 4) {
        score -= 10; // overall risk for 4th downs unless modeled specially
        trace.push('4th down: apply caution');
      }
    }

    // Normalize and return
    const normalized = Math.round(score * 10) / 10;
    return {
      play_instance_id: pi.id || `pi_${idx}`,
      score: normalized,
      raw_score: score,
      explanation: trace
    };
  });

  // sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results;
}
