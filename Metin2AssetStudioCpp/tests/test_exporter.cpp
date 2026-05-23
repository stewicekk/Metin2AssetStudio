#include <catch2/catch_all.hpp>
#include <core/Types.h>
#include <core/MseParser.h>
#include <core/MseExporter.h>
#include <core/EffExporter.h>
#include <core/MdeExporter.h>
#include <core/ProjectManager.h>
#include <string>
#include <vector>

using namespace Metin2AssetStudio;

TEST_CASE("MseExporter builds valid MSE output") {
    std::vector<Emitter> emitters;
    Emitter e;
    e.uid = 1;
    e.name = "Fire";
    e.rate = 60;
    e.life = 2.0;
    e.maxP = 512;
    e.blend = BlendType::Add;
    e.shape = ShapeType::Cone;
    e.speed = 4.0;
    e.gravity = -6.0;
    e.sizeX = 1.0;
    e.loop = 1;
    e.cycle = 2.0;
    e.dirPitch = 80;
    e.spread = 20;
    e.colorKeys = {{0.0, 1,1,1,1}, {1.0, 0.2,0.1,0.05,0}};
    e.sizeCurve = {{0,1}, {0.5,1}, {1,0.2}};
    e.alphaCurve = {{0,1}, {0.8,0.9}, {1,0}};
    e.speedCurve = {{0,1}, {1,1}};
    e.spinCurve = {{0,1}, {1,1}};
    emitters.push_back(e);

    auto result = MseExporter::buildMse(emitters, {4, "TestEffect"});
    REQUIRE_FALSE(result.empty());
    REQUIRE(result.find("TestEffect") != std::string::npos);
    REQUIRE(result.find("Fire") != std::string::npos);
    REQUIRE(result.find("BirthRate") != std::string::npos);

    auto doc = MseParser::parse(result);
    REQUIRE(doc.diagnostics.empty());
}

TEST_CASE("MseExporter shape codes are correct") {
    REQUIRE(MseExporter::shapeCode("point") == "POINT");
    REQUIRE(MseExporter::shapeCode("cone") == "CONE");
    REQUIRE(MseExporter::shapeCode("box") == "BOX");
    REQUIRE(MseExporter::shapeCode("sphere") == "SPHERE");
    REQUIRE(MseExporter::shapeCode("ring") == "DISC");
    REQUIRE(MseExporter::shapeCode("disc") == "DISC");
    REQUIRE(MseExporter::shapeCode("unknown") == "POINT");
}

TEST_CASE("MseExporter handles color keys correctly") {
    Emitter e; e.uid = 1; e.name = "Test";
    e.colorKeys = {{0.0, 1.0, 0.5, 0.2, 1.0}, {1.0, 0.0, 0.0, 0.0, 0.0}};
    std::vector<Emitter> emitters = {e};
    auto result = MseExporter::buildMse(emitters);
    REQUIRE(result.find("255") != std::string::npos);
    REQUIRE(result.find("128") != std::string::npos);
    REQUIRE(result.find("51") != std::string::npos);
}

TEST_CASE("EffExporter builds valid CEffectData") {
    std::vector<Emitter> emitters;
    Emitter e;
    e.uid = 1; e.name = "Fire";
    e.blend = BlendType::Add;
    e.loop = 1;
    e.rate = 60; e.life = 2.0; e.maxP = 512;
    e.speed = 4; e.gravity = -6;
    e.spread = 20; e.dirPitch = 80;
    e.colorKeys = {{0.0, 1,1,1,1}, {1.0, 0,0,0,0}};
    emitters.push_back(e);

    auto result = EffExporter::buildEff(emitters);
    REQUIRE_FALSE(result.empty());
    REQUIRE(result.find("CEffectData") != std::string::npos);
    REQUIRE(result.find("CParticleSystemData") != std::string::npos);
    REQUIRE(result.find("Fire") != std::string::npos);
    REQUIRE(result.find("BlendType") != std::string::npos);
}

TEST_CASE("EffExporter builds valid MDE") {
    std::vector<Emitter> emitters;
    Emitter e;
    e.uid = 1; e.name = "Explosion";
    e.speed = 5; e.speedRnd = 2;
    e.life = 1.5; e.lifeRnd = 0.5;
    e.sizeX = 2.0;
    emitters.push_back(e);

    auto result = EffExporter::buildMde(emitters);
    REQUIRE_FALSE(result.empty());
    REQUIRE(result.find("CEffectMesh") != std::string::npos);
    REQUIRE(result.find("CMeshGroup") != std::string::npos);
    REQUIRE(result.find("Bip01") != std::string::npos);
    REQUIRE(result.find("BoundingRadius") != std::string::npos);
}

TEST_CASE("ProjectManager serializes and deserializes emitters") {
    std::vector<Emitter> emitters;
    Emitter e;
    e.uid = 1; e.name = "TestParticle";
    e.rate = 60; e.life = 2.0; e.maxP = 512;
    e.sizeX = 1.5; e.blend = BlendType::Alpha;
    e.shape = ShapeType::Sphere;
    e.colorKeys = {{0,1,1,1,1}, {1,0,0,0,0}};
    e.sizeCurve = {{0,1}, {1,0.5}};
    emitters.push_back(e);

    AppSettings settings;
    std::string name;

    auto json = ProjectManager::exportToJson(emitters, settings, "TestProject");
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("TestProject") != std::string::npos);

    std::vector<Emitter> loaded;
    AppSettings loadedSettings;
    std::string loadedName;
    auto ok = ProjectManager::importFromJson(json, loaded, loadedSettings, loadedName);
    REQUIRE(ok);
    REQUIRE(loadedName == "TestProject");
    REQUIRE(loaded.size() == 1);
    REQUIRE(loaded[0].uid == 1);
    REQUIRE(loaded[0].name == "TestParticle");
    REQUIRE(loaded[0].rate == Approx(60.0));
    REQUIRE(loaded[0].life == Approx(2.0));
    REQUIRE(loaded[0].sizeX == Approx(1.5));
}

TEST_CASE("ProjectManager handles invalid JSON gracefully") {
    std::vector<Emitter> emitters;
    AppSettings settings;
    std::string name;
    auto ok = ProjectManager::importFromJson("not valid json", emitters, settings, name);
    REQUIRE_FALSE(ok);
}
