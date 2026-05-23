#pragma once
#include "Types.h"
#include <string>
#include <vector>

struct MdeExportOptions {
    int precision = 4;
    std::string effectName = "MyEffect";
    std::string effectPath = "effect/skill/";
    std::string attachBone = "root";
};

class MdeExporter {
public:
    static std::string buildMde(const std::vector<Emitter>& emitters, const MdeExportOptions& opts = {});
};
