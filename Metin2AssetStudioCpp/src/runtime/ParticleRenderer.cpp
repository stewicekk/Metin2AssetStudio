#include "ParticleRenderer.h"
#include "TextureRegistry.h"
#include "utils/MathUtils.h"
#include "utils/CurveUtils.h"
#include <QOpenGLFunctions>
#include <QMatrix4x4>
#include <QVector3D>
#include <algorithm>
#include <cmath>
#include <cstring>

static const char* particleVS = R"(
#version 330 core
layout(location=0) in vec3 aPos;
layout(location=1) in float aSize;
layout(location=2) in vec4 aColor;
layout(location=3) in float aFrame;
layout(location=4) in float aRot;
uniform mat4 uMVP;
uniform float uScale;
uniform vec2 uScreenSize;
out vec4 vColor;
out float vFrame;
void main() {
    gl_Position = uMVP * vec4(aPos, 1.0);
    gl_PointSize = max(0.5, aSize * uScale * (420.0 / -gl_Position.z));
    vColor = aColor;
    vFrame = aFrame;
}
)";

static const char* particleFS = R"(
#version 330 core
in vec4 vColor;
in float vFrame;
uniform sampler2D uTex;
uniform float uCols;
uniform float uRows;
out vec4 fragColor;
void main() {
    vec2 uv = gl_PointCoord;
    float col = mod(vFrame, uCols);
    float row = floor(vFrame / uCols);
    uv = (uv + vec2(col, row)) / vec2(uCols, uRows);
    vec4 tex = texture(uTex, uv);
    if (tex.a < 0.008) discard;
    fragColor = tex * vColor;
}
)";

ParticleRenderer::ParticleRenderer() {}
ParticleRenderer::~ParticleRenderer() { clear(); }

void ParticleRenderer::initGL() {
    initializeOpenGLFunctions();
    unsigned int vs = compileShader(GL_VERTEX_SHADER, particleVS);
    unsigned int fs = compileShader(GL_FRAGMENT_SHADER, particleFS);
    particleShader = linkProgram(vs, fs);
    glDeleteShader(vs);
    glDeleteShader(fs);
}

void ParticleRenderer::resizeGL(int w, int h) {
    glViewport(0, 0, w, h);
}

void ParticleRenderer::sync(const std::vector<Emitter>& emitters) {
    std::unordered_set<uint64_t> active;
    for (const auto& e : emitters) {
        active.insert(e.uid);
        auto it = runtimes.find(e.uid);
        if (it == runtimes.end()) {
            VisualRuntime rt;
            rt.sim = ParticleSimulation::createRuntime(const_cast<Emitter*>(&e));
            rt.maxCount = e.maxP;
            rt.signature = computeSignature(e);
            runtimes[e.uid] = rt;
            setupShader(runtimes[e.uid], e);
            uploadTexture(runtimes[e.uid], e);
        } else {
            std::string sig = computeSignature(e);
            if (sig != it->second.signature) {
                it->second.signature = sig;
                it->second.needsUpload = true;
                setupShader(it->second, e);
                uploadTexture(it->second, e);
            }
            if (it->second.maxCount != e.maxP) {
                it->second.maxCount = e.maxP;
                it->second.sim.particles = ParticleSimulation::createParticles(e.maxP);
                ParticleSimulation::resetRuntime(it->second.sim);
            }
            it->second.sim.emitter = const_cast<Emitter*>(&e);
        }
    }
    for (auto it = runtimes.begin(); it != runtimes.end(); ) {
        if (active.find(it->first) == active.end()) {
            if (it->second.vao) glDeleteVertexArrays(1, &it->second.vao);
            if (it->second.vbo) glDeleteBuffers(1, &it->second.vbo);
            if (it->second.textureId) glDeleteTextures(1, &it->second.textureId);
            if (it->second.shaderProgram) glDeleteProgram(it->second.shaderProgram);
            it = runtimes.erase(it);
        } else {
            ++it;
        }
    }
}

void ParticleRenderer::update(double dt, bool playing, double vpScale) {
    for (auto& [uid, rt] : runtimes) {
        rt.sim.dirty = true;
        ParticleSimulation::updateRuntime(rt.sim, dt, playing, vpScale);
    }
}

void ParticleRenderer::render(const MathUtils::Vec3& cameraPos, const MathUtils::Vec3& cameraTarget, double fov, int w, int h) {
    glEnable(GL_BLEND);
    glDepthMask(GL_FALSE);
    glEnable(GL_PROGRAM_POINT_SIZE);

    QMatrix4x4 view;
    QVector3D eye(cameraPos.x, cameraPos.y, cameraPos.z);
    QVector3D center(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    QVector3D up(0, 1, 0);
    view.lookAt(eye, center, up);

    QMatrix4x4 proj;
    proj.perspective(fov, (double)w / (double)h, 0.1, 500.0);

    QMatrix4x4 mvp = proj * view;

    for (auto& [uid, rt] : runtimes) {
        if (rt.sim.aliveCount == 0) continue;
        if (rt.sim.emitter && !rt.sim.emitter->visible) continue;

        glUseProgram(rt.shaderProgram);

        float mvpData[16];
        for (int i = 0; i < 16; ++i) mvpData[i] = (float)mvp.constData()[i];
        glUniformMatrix4fv(glGetUniformLocation(rt.shaderProgram, "uMVP"), 1, GL_FALSE, mvpData);
        glUniform1f(glGetUniformLocation(rt.shaderProgram, "uScale"), 1.0f);
        glUniform2f(glGetUniformLocation(rt.shaderProgram, "uScreenSize"), (float)w, (float)h);
        glUniform1f(glGetUniformLocation(rt.shaderProgram, "uCols"), (float)(rt.sim.emitter ? rt.sim.emitter->sheetCols : 1));
        glUniform1f(glGetUniformLocation(rt.shaderProgram, "uRows"), (float)(rt.sim.emitter ? rt.sim.emitter->sheetRows : 1));

        GLenum blendMode = GL_ONE;
        if (rt.sim.emitter) {
            switch (rt.sim.emitter->blend) {
            case BlendType::Alpha: blendMode = GL_ONE_MINUS_SRC_ALPHA; break;
            case BlendType::Add: blendMode = GL_ONE; break;
            case BlendType::Modulate: blendMode = GL_ZERO; break;
            }
        }
        glBlendFunc(GL_SRC_ALPHA, blendMode);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, rt.textureId);
        glUniform1i(glGetUniformLocation(rt.shaderProgram, "uTex"), 0);

        writeAttributes(rt, cameraPos);

        glBindVertexArray(rt.vao);
        glDrawArrays(GL_POINTS, 0, rt.sim.aliveCount);
        glBindVertexArray(0);
    }

    glDisable(GL_BLEND);
    glDepthMask(GL_TRUE);
    glDisable(GL_PROGRAM_POINT_SIZE);
}

void ParticleRenderer::clear() {
    for (auto& [uid, rt] : runtimes) {
        if (rt.vao) glDeleteVertexArrays(1, &rt.vao);
        if (rt.vbo) glDeleteBuffers(1, &rt.vbo);
        if (rt.textureId) glDeleteTextures(1, &rt.textureId);
        if (rt.shaderProgram) glDeleteProgram(rt.shaderProgram);
    }
    runtimes.clear();
    if (particleShader) glDeleteProgram(particleShader);
}

bool ParticleRenderer::hasEmitter(uint64_t uid) const {
    return runtimes.find(uid) != runtimes.end();
}

int ParticleRenderer::getAliveCount(uint64_t uid) const {
    auto it = runtimes.find(uid);
    return (it != runtimes.end()) ? it->second.sim.aliveCount : 0;
}

unsigned int ParticleRenderer::compileShader(unsigned int type, const std::string& source) {
    unsigned int shader = glCreateShader(type);
    const char* src = source.c_str();
    glShaderSource(shader, 1, &src, nullptr);
    glCompileShader(shader);
    GLint success;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        char infoLog[512];
        glGetShaderInfoLog(shader, 512, nullptr, infoLog);
        glDeleteShader(shader);
        return 0;
    }
    return shader;
}

unsigned int ParticleRenderer::linkProgram(unsigned int vs, unsigned int fs) {
    unsigned int program = glCreateProgram();
    glAttachShader(program, vs);
    glAttachShader(program, fs);
    glLinkProgram(program);
    GLint success;
    glGetProgramiv(program, GL_LINK_STATUS, &success);
    if (!success) {
        char infoLog[512];
        glGetProgramInfoLog(program, 512, nullptr, infoLog);
        glDeleteProgram(program);
        return 0;
    }
    return program;
}

std::string ParticleRenderer::computeSignature(const Emitter& e) {
    return std::to_string((int)e.blend) + "_" +
           std::to_string(e.sheetCols) + "x" + std::to_string(e.sheetRows) + "_" +
           e.builtinTex + "_" + e.texPath;
}

void ParticleRenderer::setupShader(VisualRuntime& rt, const Emitter& e) {
    if (rt.shaderProgram) glDeleteProgram(rt.shaderProgram);
    rt.shaderProgram = particleShader;
}

void ParticleRenderer::uploadTexture(VisualRuntime& rt, const Emitter& e) {
    if (rt.textureId) glDeleteTextures(1, &rt.textureId);

    QImage texImage;
    if (!e.builtinTex.empty()) {
        texImage = TextureRegistry::instance().getTexture(e.builtinTex);
    } else {
        texImage = TextureRegistry::instance().getTexture("circle");
    }

    glGenTextures(1, &rt.textureId);
    glBindTexture(GL_TEXTURE_2D, rt.textureId);
    texImage = texImage.convertToFormat(QImage::Format_RGBA8888);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, texImage.width(), texImage.height(),
                 0, GL_RGBA, GL_UNSIGNED_BYTE, texImage.constBits());
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    rt.needsUpload = false;
}

void ParticleRenderer::writeAttributes(VisualRuntime& rt, const MathUtils::Vec3& cameraPos) {
    auto& particles = rt.sim.particles;
    int alive = rt.sim.aliveCount;
    if (alive == 0) return;

    std::vector<int> indices;
    indices.reserve(alive);
    for (int i = 0; i < (int)particles.size(); ++i) {
        if (particles[i].alive) indices.push_back(i);
    }

    std::sort(indices.begin(), indices.end(), [&](int a, int b) {
        const auto& pa = particles[a];
        const auto& pb = particles[b];
        double da = (pa.px - cameraPos.x) * (pa.px - cameraPos.x) +
                    (pa.py - cameraPos.y) * (pa.py - cameraPos.y) +
                    (pa.pz - cameraPos.z) * (pa.pz - cameraPos.z);
        double db = (pb.px - cameraPos.x) * (pb.px - cameraPos.x) +
                    (pb.py - cameraPos.y) * (pb.py - cameraPos.y) +
                    (pb.pz - cameraPos.z) * (pb.pz - cameraPos.z);
        return da > db;
    });

    std::vector<GpuParticle> gpu(indices.size());
    for (size_t i = 0; i < indices.size(); ++i) {
        const auto& p = particles[indices[i]];
        gpu[i].px = (float)p.px;
        gpu[i].py = (float)p.py;
        gpu[i].pz = (float)p.pz;
        gpu[i].size = (float)(p.boneOx);
        gpu[i].r = (float)p.col.r;
        gpu[i].g = (float)p.col.g;
        gpu[i].b = (float)p.col.b;
        gpu[i].a = (float)p.col.a;
        gpu[i].frame = (float)p.frame;
        gpu[i].rotation = (float)p.rot;
    }

    if (!rt.vao) glGenVertexArrays(1, &rt.vao);
    if (!rt.vbo) glGenBuffers(1, &rt.vbo);

    glBindVertexArray(rt.vao);
    glBindBuffer(GL_ARRAY_BUFFER, rt.vbo);
    glBufferData(GL_ARRAY_BUFFER, gpu.size() * sizeof(GpuParticle), gpu.data(), GL_DYNAMIC_DRAW);

    size_t stride = sizeof(GpuParticle);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 1, GL_FLOAT, GL_FALSE, stride, (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(2, 4, GL_FLOAT, GL_FALSE, stride, (void*)(4 * sizeof(float)));
    glEnableVertexAttribArray(2);
    glVertexAttribPointer(3, 1, GL_FLOAT, GL_FALSE, stride, (void*)(8 * sizeof(float)));
    glEnableVertexAttribArray(3);
    glVertexAttribPointer(4, 1, GL_FLOAT, GL_FALSE, stride, (void*)(9 * sizeof(float)));
    glEnableVertexAttribArray(4);

    glBindVertexArray(0);
}
