#pragma once
#include "core/Types.h"
#include "SeededRandom.h"
#include <vector>
#include <cstdint>

struct RuntimeEmitter {
    Emitter* emitter = nullptr;
    std::vector<Particle> particles;
    std::vector<int> freeSlots;
    int aliveCount = 0;
    double spawnAcc = 0;
    double localTime = 0;
    SeededRandom rng{0};
    bool dirty = false;
};

class ParticleSimulation {
public:
    static std::vector<Particle> createParticles(int count);
    static void resetRuntime(RuntimeEmitter& runtime);
    static void spawnParticle(RuntimeEmitter& runtime);
    static int updateRuntime(RuntimeEmitter& runtime, double dt, bool playing, double lodFactor = 1.0);
    static RuntimeEmitter createRuntime(Emitter* emitter);
};
