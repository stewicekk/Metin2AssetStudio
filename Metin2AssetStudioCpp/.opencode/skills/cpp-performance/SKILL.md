# C++ Performance Optimization Skill

## Profiling
- Use std::chrono::high_resolution_clock for frame timing
- Track FPS via 1-second accumulation window
- Profile in release mode with -O2

## Hot Paths
- ParticleSimulation::updateRuntime: O(n) per frame, n = maxP sum
- writeAttributes: O(alive) alpha sort + VBO upload
- TextureRegistry::getTexture: cached after first generation

## Optimization Techniques
- Pre-allocate vectors to maxP in createParticles
- Free-list slot management (O(1) spawn/despawn)
- Batch VBO upload instead of per-vertex
- GL_POINTS draw call (single draw for all particles)
- sqrt avoidance: compare squared distances
- SeededRandom: integer LCG (no floating ops for state)

## Memory
- Particle struct: 15 doubles + 1 int + 1 bool ≈ 132 bytes
- 2048 max particles per emitter ≈ 264KB per emitter
- Texture cache: ~64KB per unique texture at 64x64 ARGB32
