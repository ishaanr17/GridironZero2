import { analyzePlays } from './analyzer'

async function main() {
  const sampleField = { down: 2, distance: 6 }
  const samplePlayInstances = [
    {
      id: 'test_pi_1',
      play_type: 'pass',
      assignments: [
        { player_id: 'p3', position: 'WR', traits: { speed: 99 } },
        { player_id: 'p4', position: 'TE', traits: { catching: 95 } }
      ],
      actions: [ { type: 'route' } ]
    }
  ]

  const results = analyzePlays({ field_state: sampleField, play_instances: samplePlayInstances })
  console.log('Analyzer results:', results)
}

main()
