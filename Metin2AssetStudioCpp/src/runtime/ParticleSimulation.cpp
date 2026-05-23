#include "ParticleSimulation.h"
#include "utils/MathUtils.h"
#include "utils/CurveUtils.h"
#include <cmath>
#include <algorithm>
#include <cstdint>

static const double PI = 3.14159265358979323846;

std::vector<Particle> ParticleSimulation::createParticles(int count) {
    std::vector<Particle> p(count);
    for (int i = 0; i < count; ++i) {
        p[i].alive = false;
        p[i].age = 0;
        p[i].life = 1;
        p[i].px = 0; p[i].py = 0; p[i].pz = 0;
        p[i].vx = 0; p[i].vy = 0; p[i].vz = 0;
        p[i].rot = 0;
        p[i].spin = 0;
        p[i].baseSize = 1;
        p[i].col.r = 1; p[i].col.g = 1; p[i].col.b = 1; p[i].col.a = 1;
        p[i].frame = 0;
        p[i].boneOx = 0; p[i].boneOy = 0; p[i].boneOz = 0;
        p[i].stretchRot = 0;
        p[i].stretch = 0;
    }
    return p;
}

void ParticleSimulation::resetRuntime(RuntimeEmitter& runtime) {
    for (auto& p : runtime.particles) {
        p.alive = false;
    }
    runtime.freeSlots.clear();
    for (int i = (int)runtime.particles.size() - 1; i >= 0; --i) {
        runtime.freeSlots.push_back(i);
    }
    runtime.spawnAcc = 0;
    runtime.localTime = 0;
    runtime.rng = SeededRandom(runtime.emitter->uid * 2654435761ULL);
    runtime.dirty = false;
}

RuntimeEmitter ParticleSimulation::createRuntime(Emitter* emitter) {
    RuntimeEmitter rt;
    rt.emitter = emitter;
    rt.particles = createParticles(emitter->maxP);
    resetRuntime(rt);
    return rt;
}

void ParticleSimulation::spawnParticle(RuntimeEmitter& runtime) {
    if (runtime.freeSlots.empty()) return;
    int idx = runtime.freeSlots.back();
    runtime.freeSlots.pop_back();
    Particle& p = runtime.particles[idx];
    p.alive = true;
    p.age = 0;
    Emitter& e = *runtime.emitter;
    SeededRandom& rng = runtime.rng;

    p.life = std::max(0.01, e.life + rng.centered(e.lifeRnd));

    double radius = e.shapeRadius;
    double r = radius;
    switch (e.shape) {
    case ShapeType::Point:
        p.px = 0; p.py = 0; p.pz = 0;
        break;
    case ShapeType::Box:
        p.px = rng.centered(r * 0.7);
        p.py = rng.centered(r * 0.7);
        p.pz = rng.centered(r * 0.7);
        break;
    case ShapeType::Sphere:
    case ShapeType::SphereVol: {
        double theta = rng.next() * 2.0 * PI;
        double phi = std::acos(2.0 * rng.next() - 1.0);
        double dist = (e.shape == ShapeType::SphereVol) ? std::cbrt(rng.next()) * r : r;
        p.px = dist * std::sin(phi) * std::cos(theta);
        p.py = dist * std::cos(phi);
        p.pz = dist * std::sin(phi) * std::sin(theta);
        break;
    }
    case ShapeType::Ring:
    case ShapeType::Disc:
    case ShapeType::Cone: {
        double angle = rng.next() * 2.0 * PI;
        double dist = (e.shape == ShapeType::Point || e.shape == ShapeType::Ring) ? r : std::sqrt(rng.next()) * r;
        if (e.shape == ShapeType::Ring) dist = r;
        double height = (e.shape == ShapeType::Cone) ? rng.next() * r : 0;
        p.px = dist * std::cos(angle);
        p.py = height;
        p.pz = dist * std::sin(angle);
        break;
    }
    }

    double dirYawRad = MathUtils::degToRad(e.dirYaw + 90.0);
    double dirPitchRad = MathUtils::degToRad(e.dirPitch);
    double cx = std::sin(dirYawRad) * std::cos(-dirPitchRad);
    double cy = std::sin(-dirPitchRad);
    double cz = std::cos(dirYawRad) * std::cos(-dirPitchRad);
    MathUtils::Vec3 dir(cx, cy, cz);
    dir.normalize();

    double spreadRad = MathUtils::degToRad(e.spread);
    if (spreadRad > 0.001) {
        double theta = rng.next() * 2.0 * PI;
        double phi = rng.next() * spreadRad;
        double sx = std::sin(theta) * std::sin(phi);
        double sy = std::cos(theta) * std::sin(phi);
        double sz = std::cos(phi);
        MathUtils::Vec3 axis(rng.centered(1), rng.centered(1), rng.centered(1));
        axis.normalize();
        double c = sz;
        double s = std::sin(phi);
        double oneC = 1.0 - c;
        double m00 = oneC * axis.x * axis.x + c;
        double m01 = oneC * axis.x * axis.y - axis.z * s;
        double m02 = oneC * axis.x * axis.z + axis.y * s;
        double m10 = oneC * axis.x * axis.y + axis.z * s;
        double m11 = oneC * axis.y * axis.y + c;
        double m12 = oneC * axis.y * axis.z - axis.x * s;
        double m20 = oneC * axis.x * axis.z - axis.y * s;
        double m21 = oneC * axis.y * axis.z + axis.x * s;
        double m22 = oneC * axis.z * axis.z + c;
        double dx = m00 * dir.x + m01 * dir.y + m02 * dir.z;
        double dy = m10 * dir.x + m11 * dir.y + m12 * dir.z;
        double dz = m20 * dir.x + m21 * dir.y + m22 * dir.z;
        dir = MathUtils::Vec3(dx, dy, dz);
        dir.normalize();
    }

    double spd = e.speed + rng.centered(e.speedRnd);
    p.vx = dir.x * spd;
    p.vy = dir.y * spd;
    p.vz = dir.z * spd;

    switch (e.rotType) {
    case RotType::None:
        p.rot = 0;
        break;
    case RotType::Random:
        p.rot = rng.next() * 2.0 * PI;
        break;
    case RotType::Spin:
        p.rot = MathUtils::degToRad(e.initRot + rng.centered(e.initRotRnd));
        break;
    }
    p.spin = MathUtils::degToRad(e.spin);

    p.baseSize = e.sizeX + rng.centered(e.sizeRnd);

    p.col.r = 1; p.col.g = 1; p.col.b = 1; p.col.a = 1;
    if (!e.colorKeys.empty()) {
        ColorKey ck = CurveUtils::sampleColor(e.colorKeys, 0);
        p.col.r = ck.r;
        p.col.g = ck.g;
        p.col.b = ck.b;
        p.col.a = ck.a;
    }

    if (e.uvAnim == UVAnimType::Rand) {
        p.frame = (int)(rng.next() * (e.sheetCols * e.sheetRows));
    } else {
        p.frame = 0;
    }

    ++runtime.aliveCount;
}

int ParticleSimulation::updateRuntime(RuntimeEmitter& runtime, double dt, bool playing, double lodFactor) {
    SeededRandom& rng = runtime.rng;
    Emitter& e = *runtime.emitter;
    double effectiveDt = dt;
    bool firstFrame = false;

    if (!playing) {
        return runtime.aliveCount;
    }

    if (runtime.localTime == 0) {
        firstFrame = true;
    }

    if (e.delay > 0 && runtime.localTime < e.delay) {
        double newTime = runtime.localTime + effectiveDt;
        if (newTime >= e.delay) {
            effectiveDt = newTime - e.delay;
        } else {
            runtime.localTime = newTime;
            return runtime.aliveCount;
        }
    }

    runtime.localTime += effectiveDt;

    double cycleDur = e.cycle;
    if (e.loop && cycleDur > 0) {
        if (runtime.localTime >= cycleDur) {
            runtime.localTime = std::fmod(runtime.localTime, cycleDur);
            for (auto& p : runtime.particles) {
                if (p.alive) {
                    p.alive = false;
                    runtime.freeSlots.push_back((int)(&p - &runtime.particles[0]));
                    --runtime.aliveCount;
                }
            }
            runtime.spawnAcc = 0;
        }
    }

    if (firstFrame || (e.burst > 0 && runtime.localTime < dt * 2)) {
        int burstCount = e.burst;
        for (int i = 0; i < burstCount; ++i) {
            spawnParticle(runtime);
        }
    }

    if (e.rate > 0) {
        runtime.spawnAcc += effectiveDt * e.rate * lodFactor;
        while (runtime.spawnAcc >= 1.0) {
            spawnParticle(runtime);
            runtime.spawnAcc -= 1.0;
        }
    }

    double dtFactor = 1.0;
    for (auto& p : runtime.particles) {
        if (!p.alive) continue;
        p.age += effectiveDt * dtFactor;

        if (p.age >= p.life) {
            p.alive = false;
            runtime.freeSlots.push_back((int)(&p - &runtime.particles[0]));
            --runtime.aliveCount;
            continue;
        }

        double t = std::min(1.0, p.age / p.life);

        double speedFac = CurveUtils::sampleCurve(e.speedCurve, t);
        double spdX = p.vx * speedFac;
        double spdY = p.vy * speedFac;
        double spdZ = p.vz * speedFac;

        spdY += e.gravity * effectiveDt;

        spdX += e.windX * effectiveDt;
        spdZ += e.windZ * effectiveDt;

        if (e.drag > 0) {
            double dragFac = 1.0 / (1.0 + e.drag * effectiveDt);
            spdX *= dragFac;
            spdY *= dragFac;
            spdZ *= dragFac;
        }

        if (e.turb > 0) {
            double freq = e.turbFreq > 0 ? e.turbFreq : 1.0;
            double phaseX = p.px * freq + p.age * 2.0;
            double phaseY = p.py * freq + p.age * 1.7;
            double phaseZ = p.pz * freq + p.age * 2.3;
            double turbStr = e.turb * effectiveDt;
            spdX += std::sin(phaseX) * turbStr;
            spdY += std::sin(phaseY) * turbStr;
            spdZ += std::cos(phaseZ) * turbStr;
        }

        if (e.attractorStr != 0) {
            double ax = -p.px * e.attractorStr * effectiveDt;
            double ay = (e.attractorY - p.py) * e.attractorStr * effectiveDt;
            double az = -p.pz * e.attractorStr * effectiveDt;
            spdX += ax;
            spdY += ay;
            spdZ += az;
        }

        p.vx = spdX;
        p.vy = spdY;
        p.vz = spdZ;

        p.px += p.vx * effectiveDt;
        p.py += p.vy * effectiveDt;
        p.pz += p.vz * effectiveDt;

        if (e.groundBounce && p.py <= 0) {
            p.py = 0;
            p.vy = -p.vy * e.bounceFac;
        }

        if (e.rotType == RotType::Spin) {
            double spinFac = CurveUtils::sampleCurve(e.spinCurve, t);
            p.rot += p.spin * spinFac * effectiveDt;
        }

        ColorKey ck = CurveUtils::sampleColor(e.colorKeys, t);
        p.col.r = ck.r;
        p.col.g = ck.g;
        p.col.b = ck.b;
        p.col.a = ck.a;

        double alphaFac = CurveUtils::sampleCurve(e.alphaCurve, t);
        p.col.a *= alphaFac;

        double szFac = CurveUtils::sampleCurve(e.sizeCurve, t);
        double sz = p.baseSize * szFac;
        if (e.sizeNonUniform) {
            double szY = (e.sizeY + rng.centered(e.sizeRnd)) * szFac;
            p.boneOy = szY;
        } else {
            p.boneOy = sz;
        }
        p.boneOx = sz;
        p.boneOz = sz;

        if (e.velStretch > 0) {
            double velMag = std::sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
            double stretch = velMag * e.velStretch * effectiveDt;
            p.stretch = stretch;
            if (velMag > 0.001) {
                p.stretchRot = std::atan2(p.vz, p.vx);
            }
        }

        if (e.uvAnim != UVAnimType::Rand && e.uvAnim != UVAnimType::None) {
            int totalFrames = e.sheetCols * e.sheetRows;
            if (totalFrames > 1) {
                switch (e.uvAnim) {
                case UVAnimType::Loop:
                    p.frame = (int)((p.age * e.animFPS) / 1.0) % totalFrames;
                    break;
                case UVAnimType::Once: {
                    int f = (int)((p.age / p.life) * totalFrames);
                    p.frame = std::min(f, totalFrames - 1);
                    break;
                }
                case UVAnimType::Life:
                    p.frame = (int)((p.age / p.life) * totalFrames) % totalFrames;
                    break;
                default:
                    break;
                }
            }
        }
    }

    return runtime.aliveCount;
}
