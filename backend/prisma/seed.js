const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const players = [
    { name: 'Patrick Mahomes', traits: { position: 'QB', speed: 82, acceleration: 80, awareness: 96, throwing: 99 } },
    { name: 'Derrick Henry', traits: { position: 'RB', speed: 79, acceleration: 78, strength: 96, tackling: 30 } },
    { name: 'Tyreek Hill', traits: { position: 'WR', speed: 99, acceleration: 98, catching: 90, awareness: 85 } },
    { name: 'Travis Kelce', traits: { position: 'TE', speed: 82, catching: 95, blocking: 70, awareness: 92 } },
    { name: 'Aaron Donald', traits: { position: 'DL', speed: 85, strength: 99, tackling: 94, awareness: 93 } },
    { name: 'Jalen Ramsey', traits: { position: 'CB', speed: 90, acceleration: 88, coverage: 96, tackling: 85 } },
    { name: 'Myles Garrett', traits: { position: 'DE', speed: 88, strength: 95, tackling: 90, awareness: 88 } },
    { name: 'Lamar Jackson', traits: { position: 'QB', speed: 95, acceleration: 94, throwing: 88, awareness: 90 } },
    { name: 'Nick Chubb', traits: { position: 'RB', speed: 88, acceleration: 86, strength: 90, tackling: 35 } },
    { name: 'Stefon Diggs', traits: { position: 'WR', speed: 92, acceleration: 90, catching: 94, awareness: 88 } }
  ];

  // delete existing sample players with same names
  const names = players.map(p => p.name);
  await prisma.player.deleteMany({ where: { name: { in: names } } });

  // create
  for (const p of players) {
    await prisma.player.create({ data: { name: p.name, traits: p.traits } });
    console.log('Created player', p.name);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
