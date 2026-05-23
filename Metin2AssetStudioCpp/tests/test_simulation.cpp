#include <catch2/catch_all.hpp>
#include <runtime/SeededRandom.h>
#include <runtime/ParticleSimulation.h>
#include <core/Types.h>
#include <vector>

using namespace Metin2AssetStudio;

TEST_CASE("SeededRandom produces deterministic sequence") {
    SeededRandom rng1(42), rng2(42);
    for (int i = 0; i < 100; i++) {
        REQUIRE(rng1.next() == rng2.next());
    }
}

TEST_CASE("SeededRandom range is within bounds") {
    SeededRandom rng(12345);
    for (int i = 0; i < 1000; i++) {
        double v = rng.range(-5.0, 10.0);
        REQUIRE(v >= -5.0);
        REQUIRE(v <= 10.0);
    }
}

TEST_CASE("SeededRandom centered is symmetric") {
    SeededRandom rng(999);
    double sum = 0;
    int n = 10000;
    for (int i = 0; i < n; i++) {
        sum += rng.centered(5.0);
    }
    double mean = sum / n;
    REQUIRE(mean == Approx(0.0).margin(0.3));
}

TEST_CASE("ParticleSimulation createParticles allocates correctly") {
    auto particles = ParticleSimulation::createParticles(10);
    REQUIRE(particles.size() == 10);
    for (auto& p : particles) {
        REQUIRE_FALSE(p.alive);
    }
}

TEST_CASE("ParticleSimulation resetRuntime resets state") {
    Emitter e;
    e.uid = 1; e.maxP = 50; e.life = 2.0; e.lifeRnd = 0;
    auto runtime = ParticleSimulation::createRuntime(&e);
    REQUIRE(runtime.aliveCount == 0);
    REQUIRE(runtime.freeSlots.size() == 50);
    REQUIRE(runtime.spawnAcc == 0);
    REQUIRE(runtime.localTime == 0);
}

TEST_CASE("ParticleSimulation spawnParticle creates particle") {
    Emitter e;
    e.uid = 1; e.maxP = 50; e.life = 2.0; e.lifeRnd = 0;
    e.speed = 5.0; e.speedRnd = 0;
    e.dirYaw = 0; e.dirPitch = 90;
    e.spread = 0;
    e.sizeX = 1.0; e.sizeRnd = 0;
    e.colorKeys = {{0, 1,1,1,1}};
    e.shape = ShapeType::Point;
    e.rotType = RotType::None;
    e.uvAnim = UVAnimType::Loop;

    auto runtime = ParticleSimulation::createRuntime(&e);
    ParticleSimulation::spawnParticle(runtime);
    REQUIRE(runtime.aliveCount == 1);
    REQUIRE(runtime.freeSlots.size() == 49);

    auto& p = runtime.particles[0];
    REQUIRE(p.alive);
    REQUIRE(p.life == Approx(2.0));
    REQUIRE(p.age == 0);
}

TEST_CASE("ParticleSimulation updateRuntime ages particles") {
    Emitter e;
    e.uid = 1; e.maxP = 10; e.life = 1.0; e.lifeRnd = 0;
    e.rate = 0;
    e.speed = 0; e.gravity = 0;
    e.colorKeys = {{0, 1,1,1,1}};
    e.sizeCurve = {{0,1}, {1,1}};
    e.alphaCurve = {{0,1}, {1,1}};
    e.speedCurve = {{0,1}, {1,1}};
    e.spinCurve = {{0,1}, {1,1}};

    auto runtime = ParticleSimulation::createRuntime(&e);
    runtime.particles[0].alive = true;
    runtime.particles[0].life = 1.0;
    runtime.particles[0].age = 0;
    runtime.aliveCount = 1;
    runtime.freeSlots.pop_back();

    int alive = ParticleSimulation::updateRuntime(runtime, 0.5, false);
    REQUIRE(alive == 1);
    REQUIRE(runtime.particles[0].age == Approx(0.5));

    alive = ParticleSimulation::updateRuntime(runtime, 0.6, false);
    REQUIRE(alive == 0);
    REQUIRE_FALSE(runtime.particles[0].alive);
}

TEST_CASE("ParticleSimulation respects max particle limit") {
    Emitter e;
    e.uid = 1; e.maxP = 5; e.life = 10.0; e.lifeRnd = 0;
    e.rate = 1000; e.loop = 1; e.cycle = 100;
    e.speed = 0; e.gravity = 0;
    e.colorKeys = {{0, 1,1,1,1}};

    auto runtime = ParticleSimulation::createRuntime(&e);
    ParticleSimulation::updateRuntime(runtime, 0.1, true);

    REQUIRE(runtime.aliveCount <= 5);
}
