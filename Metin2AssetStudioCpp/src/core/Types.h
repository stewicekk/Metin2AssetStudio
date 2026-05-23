#pragma once

#include <string>
#include <vector>
#include <optional>
#include <cstdint>

enum class BlendType { Alpha, Add, Modulate };
enum class ShapeType { Point, Cone, Box, Sphere, SphereVol, Ring, Disc };
enum class UVAnimType { Loop, Once, Rand, Life };
enum class CoordType { World, Local };
enum class RotType { None, Random, Spin };
enum class EmitterSurfaceType { None, Surface, Edge };
enum class ColorModType { Multiply, Add };
enum class CurveInterpolationType { Linear, Smooth };

struct CurvePoint {
    double t = 0.0;
    double v = 0.0;
};

struct ColorKey {
    double t = 0.0;
    double r = 1.0;
    double g = 1.0;
    double b = 1.0;
    double a = 1.0;
};

struct Particle {
    bool alive = false;
    double age = 0.0;
    double life = 1.0;
    double px = 0.0; double py = 0.0; double pz = 0.0;
    double vx = 0.0; double vy = 0.0; double vz = 0.0;
    double rot = 0.0;
    double spin = 0.0;
    double baseSize = 1.0;
    struct { double r = 1.0; double g = 1.0; double b = 1.0; double a = 1.0; } col;
    int frame = 0;
    double boneOx = 0.0; double boneOy = 0.0; double boneOz = 0.0;
    double stretchRot = 0.0;
    double stretch = 0.0;
};

struct Emitter {
    std::uint64_t uid = 0;
    std::string name;
    std::string group;
    bool visible = true;
    std::string color = "#4fc3f7";
    double posX = 0.0, posY = 0.0, posZ = 0.0;

    BlendType blend = BlendType::Alpha;
    ShapeType shape = ShapeType::Point;

    double rate = 10.0;
    int burst = 0;
    double life = 1.5;
    double lifeRnd = 0.3;
    int maxP = 50;
    bool loop = true;
    double cycle = 0.0;
    double delay = 0.0;

    double speed = 150.0;
    double speedRnd = 50.0;
    double spread = 0.0;
    double dirYaw = 0.0;
    double dirPitch = 0.0;

    double gravity = 0.0;
    double windX = 0.0; double windZ = 0.0;
    double drag = 0.0;
    double turb = 0.0;
    double turbFreq = 0.0;

    double sizeX = 8.0;
    double sizeRnd = 0.0;
    double sizeY = 8.0;
    bool sizeNonUniform = false;

    double spin = 0.0;
    double spinRnd = 0.0;
    double initRot = 0.0;
    double initRotRnd = 0.0;

    double velStretch = 0.0;

    std::string builtinTex;
    std::optional<std::string> texFile;
    std::optional<std::string> texDataUrl;
    std::string texPath;

    int sheetCols = 1;
    int sheetRows = 1;
    UVAnimType uvAnim = UVAnimType::Loop;
    double animFPS = 30.0;

    CoordType coordType = CoordType::World;
    RotType rotType = RotType::Random;
    double uvScrollX = 0.0; double uvScrollY = 0.0;
    double shapeRadius = 0.35;
    bool groundBounce = false;
    double bounceFac = 0.4;
    double attractorStr = 0.0;
    double attractorY = 0.5;
    EmitterSurfaceType emitSurface = EmitterSurfaceType::None;
    ColorModType colorMod = ColorModType::Multiply;

    std::vector<CurvePoint> sizeCurve;
    std::vector<CurvePoint> alphaCurve;
    std::vector<CurvePoint> speedCurve;
    std::vector<CurvePoint> spinCurve;
    std::vector<ColorKey> colorKeys;
};

struct Dependency {
    std::string path;
    std::string type;
    bool resolved = false;
};

struct AppSettings {
    std::string theme = "dark";
    bool showPerf = false;
    bool showDebug = false;
    bool particleDebug = false;
    bool autoPlay = true;
    bool hiPrec = false;
    int exportPrec = 4;
    std::string language = "en";
};

struct ProjectData {
    std::string version = "2.0.0";
    std::string name;
    std::uint64_t timestamp = 0;
    AppSettings settings;
    std::vector<Emitter> emitters;
    std::vector<Dependency> dependencies;
};
