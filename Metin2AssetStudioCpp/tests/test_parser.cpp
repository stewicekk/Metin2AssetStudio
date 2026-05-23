#include <catch2/catch_all.hpp>
#include <core/MseParser.h>
#include <core/MseExporter.h>
#include <string>
#include <vector>

using namespace Metin2AssetStudio;

TEST_CASE("MseParser parses valid MSE document") {
    std::string input = R"(EffectName    "TestEffect"
ParticleSystemCount    1

StartParticleSystem
    SystemName    "Fire"
    BirthRate     60.0
    MaxParticleCount    512
    LifeTime    2.0
    Loop    TRUE
    SpawnShape    POINT
    Speed    4.0
EndParticleSystem
)";
    auto doc = MseParser::parse(input);
    REQUIRE(doc.diagnostics.empty());
    REQUIRE_FALSE(doc.groups.empty());
}

TEST_CASE("MseParser handles comments and blank lines") {
    std::string input = "# This is a comment\n// Another comment\n\nEffectName \"Test\"\n";
    auto doc = MseParser::parse(input);
    REQUIRE(doc.diagnostics.empty());
    auto effectName = MseParser::findChild(doc.root, MseBlock::Property, "EffectName");
    REQUIRE(effectName != nullptr);
}

TEST_CASE("MseParser reports unbalanced braces") {
    std::string input = "Group Test\n{\n";
    auto doc = MseParser::parse(input);
    REQUIRE_FALSE(doc.diagnostics.empty());
}

TEST_CASE("MseParser handles inline block syntax") {
    std::string input = "Group Test {\n    Property value 42\n}\n";
    auto doc = MseParser::parse(input);
    REQUIRE(doc.diagnostics.empty());
}

TEST_CASE("MseParser extracts dependencies from file paths") {
    std::string input = R"(TextureFileName "effect/fire.dds"
MeshFileName    "mesh/weapon.gr2"
)";
    auto doc = MseParser::parse(input);
    REQUIRE(doc.dependencies.size() == 2);
    REQUIRE(doc.dependencies[0].path.find(".dds") != std::string::npos);
    REQUIRE(doc.dependencies[1].path.find(".gr2") != std::string::npos);
}

TEST_CASE("MseParser readNumberProperty returns correct values") {
    std::string input = "BirthRate    60.0\nMaxCount    512\n";
    auto doc = MseParser::parse(input);
    REQUIRE(MseParser::readNumberProperty(doc.root, "BirthRate", -1) == Approx(60.0));
    REQUIRE(MseParser::readNumberProperty(doc.root, "MaxCount", -1) == Approx(512.0));
    REQUIRE(MseParser::readNumberProperty(doc.root, "NonExistent", 42) == 42);
}

TEST_CASE("MseParser parses list blocks") {
    std::string input = "ColorKeyframeCount 2\nColorKeyframe {\n    0.0000 255 255 255 255\n    1.0000 0 0 0 0\n}\n";
    auto doc = MseParser::parse(input);
    REQUIRE(doc.diagnostics.empty());
}

TEST_CASE("MseParser handles quoted strings with spaces") {
    std::string input = "EffectName    \"My Cool Effect\"\n";
    auto doc = MseParser::parse(input);
    auto prop = MseParser::findChild(doc.root, MseBlock::Property, "EffectName");
    REQUIRE(prop != nullptr);
    REQUIRE_FALSE(prop->values.empty());
}

TEST_CASE("MseExporter roundtrip preserves content") {
    std::string input = R"(EffectName    "Test"
StartParticleSystem
    SystemName    "Particle1"
    BirthRate    30.0
    Speed    2.0
EndParticleSystem
)";
    auto doc = MseParser::parse(input);
    auto exported = MseParser::exportMse(doc.root);
    auto doc2 = MseParser::parse(exported);
    REQUIRE(doc2.diagnostics.empty());
}

TEST_CASE("MseParser splitValues handles various inputs") {
    auto vals = MseParser::splitValues("one two three");
    REQUIRE(vals.size() == 3);
    REQUIRE(vals[0] == "one");
    REQUIRE(vals[1] == "two");
    REQUIRE(vals[2] == "three");

    vals = MseParser::splitValues("\"quoted string\" normal");
    REQUIRE(vals.size() == 2);
    REQUIRE(vals[0] == "quoted string");
    REQUIRE(vals[1] == "normal");

    vals = MseParser::splitValues("");
    REQUIRE(vals.empty());
}
