#pragma once
#include "Types.h"
#include <string>
#include <vector>
#include <memory>
#include <optional>

struct MseBlock {
    enum Type { Root, Group, List, Property, Row, Comment, Blank };
    Type type = Root;
    std::string name;
    std::string value;
    std::vector<std::string> values;
    std::vector<MseBlock> children;
    int line = 0;
    std::string id;
    int spanStart = 0;
    int spanEnd = 0;
    std::string raw;
};

struct MseDocument {
    MseBlock root;
    std::vector<MseBlock> groups;
    std::vector<Dependency> dependencies;
    std::vector<std::string> diagnostics;
    std::string raw;
};

class MseParser {
public:
    static MseDocument parse(const std::string& text);
    static std::string exportMse(const MseBlock& node, const std::string& indent = "");
    static const MseBlock* findChild(const MseBlock& node, MseBlock::Type type, const std::string& name);
    static double readNumberProperty(const MseBlock& node, const std::string& name, double fallback);
    static double readListNumber(const MseBlock& node, const std::string& listName, double fallback);
    static std::vector<std::string> splitValues(const std::string& text);
};
