#pragma once
#include "core/Types.h"
#include "ParticleSimulation.h"
#include <QOpenGLFunctions>
#include <unordered_map>
#include <vector>
#include <string>

class ParticleRenderer : protected QOpenGLFunctions {
public:
    ParticleRenderer();
    ~ParticleRenderer();
    void initGL();
    void resizeGL(int w, int h);
    void sync(const std::vector<Emitter>& emitters);
    void update(double dt, bool playing, double vpScale = 1.0);
    void render(const MathUtils::Vec3& cameraPos, const MathUtils::Vec3& cameraTarget, double fov, int w, int h);
    void clear();
    bool hasEmitter(uint64_t uid) const;
    int getAliveCount(uint64_t uid) const;
    unsigned int compileShader(unsigned int type, const std::string& source);
    unsigned int linkProgram(unsigned int vs, unsigned int fs);
private:
    struct GpuParticle { float px, py, pz, size, r, g, b, a, frame, rotation; };
    struct VisualRuntime {
        RuntimeEmitter sim;
        unsigned int vao = 0, vbo = 0, textureId = 0;
        int maxCount = 0;
        std::string signature;
        bool needsUpload = true;
        unsigned int shaderProgram = 0;
    };
    std::unordered_map<uint64_t, VisualRuntime> runtimes;
    std::string computeSignature(const Emitter& e);
    void setupShader(VisualRuntime& rt, const Emitter& e);
    void uploadTexture(VisualRuntime& rt, const Emitter& e);
    void writeAttributes(VisualRuntime& rt, const MathUtils::Vec3& cameraPos);
    unsigned int particleShader = 0;
};
