#pragma once
#include "Types.h"
#include <string>
#include <vector>

struct ExportOptions {
    int precision = 4;
    std::string effectName = "MyEffect";
    std::string effectPath = "effect/skill/";
    std::string attachBone = "root";
};

class EffExporter {
public:
    static std::string buildEff(const std::vector<Emitter>& emitters, const ExportOptions& opts = {});
    static std::string buildMde(const std::vector<Emitter>& emitters, const ExportOptions& opts = {});
};
