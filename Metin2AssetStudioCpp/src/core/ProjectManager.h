#pragma once
#include "Types.h"
#include <string>
#include <vector>

class ProjectManager {
public:
    static std::string exportToJson(const std::vector<Emitter>& emitters, const AppSettings& settings, const std::string& name);
    static bool importFromJson(const std::string& json, std::vector<Emitter>& emitters, AppSettings& settings, std::string& name);
    static bool autoSave(const std::vector<Emitter>& emitters, const AppSettings& settings, const std::string& name);
    static bool loadAutoSave(std::vector<Emitter>& emitters, AppSettings& settings, std::string& name);
};
