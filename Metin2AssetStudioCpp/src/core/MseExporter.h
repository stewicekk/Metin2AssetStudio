#pragma once
#include "Types.h"
#include <string>
#include <vector>

struct MseExportOptions {
    int precision = 4;
    std::string effectName = "MyEffect";
};

class MseExporter {
public:
    static std::string buildMse(const std::vector<Emitter>& emitters, const MseExportOptions& opts = {});
    static std::string shapeCode(const std::string& shape);
};
