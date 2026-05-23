#include "MdeExporter.h"
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cmath>
#include <ctime>
#include <map>
#include <regex>

static std::string fmt(double value, int precision) {
    if (!std::isfinite(value)) return "0.0000";
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(precision) << value;
    return oss.str();
}

static std::string toLower(const std::string& s) {
    std::string r = s;
    for (auto& c : r) c = (char)std::tolower((unsigned char)c);
    return r;
}

static const std::map<std::string, std::string> BONE_MAP = {
    {"root", "Bip01"},
    {"pelvis", "Bip01_Pelvis"},
    {"spine", "Bip01_Spine"},
    {"chest", "Bip01_Spine1"},
    {"neck", "Bip01_Neck"},
    {"head", "Bip01_Head"},
    {"larm", "Bip01_L_UpperArm"},
    {"rarm", "Bip01_R_UpperArm"},
    {"lforearm", "Bip01_L_Forearm"},
    {"rforearm", "Bip01_R_Forearm"},
    {"lhand", "Bip01_L_Hand"},
    {"rhand", "Bip01_R_Hand"},
    {"lfoot", "Bip01_L_Foot"},
    {"rfoot", "Bip01_R_Foot"},
    {"lfinger", "Bip01_L_Finger0"},
    {"rfinger", "Bip01_R_Finger0"},
    {"ltoe", "Bip01_L_Toe0"},
    {"rtoe", "Bip01_R_Toe0"},
    {"weapon_l", "Bip01_Weapon_L"},
    {"weapon_r", "Bip01_Weapon_R"},
};

std::string MdeExporter::buildMde(const std::vector<Emitter>& emitters, const MdeExportOptions& opts) {
    auto precision = opts.precision;
    auto effectName = opts.effectName;
    auto effectPath = opts.effectPath;

    auto boneIt = BONE_MAP.find(opts.attachBone);
    auto bone = boneIt != BONE_MAP.end() ? boneIt->second : "Bip01";

    auto now = std::time(nullptr);
    char dateBuf[64];
    struct tm local;
    localtime_s(&local, &now);
    std::strftime(dateBuf, sizeof(dateBuf), "%m/%d/%Y", &local);

    std::string t;
    t += "// Metin2 Effect Studio PRO v3.3 \xe2\x80\x94 CEffectMesh Export (.mde)\n";
    t += "// Workflow: FBX \xe2\x86\x92 GR2 (Granny SDK) \xe2\x86\x92 embed here\n";
    t += "// ";
    t += dateBuf;
    t += "\n\n";
    t += "CEffectMesh\n{\n";
    t += "\tEffectMeshName\t\"" + effectName + "\"\n\n";

    for (size_t idx = 0; idx < emitters.size(); ++idx) {
        const auto& e = emitters[idx];
        auto nameLower = toLower(e.name);
        nameLower = std::regex_replace(nameLower, std::regex("\\s+"), "_");
        auto gr2 = effectPath + "mesh/" + nameLower + ".gr2";

        t += "\t// --- Mesh group: " + e.name + " ---\n";
        t += "\tCMeshGroup\n\t{\n";
        t += "\t\tName\t\t\"" + e.name + "\"\n";
        t += "\t\tMeshFileName\t\"" + gr2 + "\"\n";
        auto texPath = e.texPath.empty() ? effectPath + toLower(effectName) + ".tga" : e.texPath;
        t += "\t\tTextureFileName\t\"" + texPath + "\"\n";
        t += "\t\tBlendType\t" + std::to_string(e.blend == BlendType::Add ? 1 : 0) + "\n";
        t += "\t\tPosition\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\n";
        t += "\t\tScale\t\t" + fmt(e.sizeX, precision) + "\t" +
             fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision) + "\t" +
             fmt(e.sizeX, precision) + "\n";
        t += "\t\tRotation\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\n";
        t += "\t\tLoop\t\t" + std::to_string(e.loop ? 1 : 0) + "\n";
        t += "\t\tLifeCycle\t" + fmt(e.cycle, precision) + "\n";
        t += "\t\tVisible\t\t1\n";
        t += "\t\tParticleEffectFile\t\"" + effectPath + effectName + "_" + std::to_string(idx) + ".mse\"\n";
        t += "\t}\n\n";
    }

    t += "\tAttachBone\t\"" + bone + "\"\n";

    double maxSpeed = 1.0;
    double maxLife = 0.5;
    double maxSize = 0.5;
    for (const auto& e : emitters) {
        auto spd = std::abs(e.speed) + std::abs(e.speedRnd);
        auto lif = std::abs(e.life) + std::abs(e.lifeRnd);
        auto sz = std::max(e.sizeX, e.sizeNonUniform ? e.sizeY : e.sizeX);
        if (spd > maxSpeed) maxSpeed = spd;
        if (lif > maxLife) maxLife = lif;
        if (sz > maxSize) maxSize = sz;
    }
    auto bndR = std::max(1.5, maxSpeed * maxLife * 0.65 + maxSize * 0.5);
    t += "\tBoundingRadius\t" + fmt(bndR, precision) + "\n";
    t += "}\n";

    return t;
}
