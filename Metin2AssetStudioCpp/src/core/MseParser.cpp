#include "MseParser.h"
#include <regex>
#include <sstream>
#include <algorithm>
#include <cctype>
#include <set>
#include <cmath>

struct RefExt {
    const char* ext;
    const char* type;
};

static const RefExt referenceExtensions[] = {
    {".mde", "mesh"},
    {".gr2", "mesh"},
    {".dds", "texture"},
    {".tga", "texture"},
    {".bmp", "texture"},
    {".png", "texture"},
    {".jpg", "texture"},
    {".jpeg", "texture"},
};

static std::string toLower(const std::string& s) {
    std::string r = s;
    for (auto& c : r) c = (char)std::tolower((unsigned char)c);
    return r;
}

static std::string trim(const std::string& s) {
    auto start = s.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) return "";
    auto end = s.find_last_not_of(" \t\r\n");
    return s.substr(start, end - start + 1);
}

static std::string trimLeft(const std::string& s) {
    auto start = s.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) return "";
    return s.substr(start);
}

static MseBlock createNode(MseBlock::Type type, const std::string& name, int line, const std::string& value, const std::string& raw) {
    MseBlock node;
    node.type = type;
    node.name = name;
    node.line = line;
    node.value = value;
    if (!value.empty()) {
        node.values = MseParser::splitValues(value);
    }
    node.raw = raw;
    return node;
}

static void collectGroups(const MseBlock& node, std::vector<MseBlock>& groups) {
    if (node.type == MseBlock::Group) groups.push_back(node);
    for (const auto& child : node.children) {
        collectGroups(child, groups);
    }
}

static void collectDependencies(const MseBlock& node, std::vector<Dependency>& deps) {
    auto vals = node.values;
    if (vals.empty() && !node.value.empty()) {
        vals = MseParser::splitValues(node.value);
    }
    for (const auto& v : vals) {
        auto lower = toLower(v);
        for (const auto& ref : referenceExtensions) {
            if (lower.size() >= strlen(ref.ext) &&
                lower.compare(lower.size() - strlen(ref.ext), strlen(ref.ext), ref.ext) == 0) {
                Dependency dep;
                dep.path = v;
                dep.type = ref.type;
                deps.push_back(dep);
                break;
            }
        }
    }
    for (const auto& child : node.children) {
        collectDependencies(child, deps);
    }
}

static std::vector<Dependency> dedupeDependencies(const std::vector<Dependency>& deps) {
    std::set<std::string> seen;
    std::vector<Dependency> result;
    for (const auto& d : deps) {
        auto key = d.type + ":" + toLower(d.path);
        if (seen.find(key) != seen.end()) continue;
        seen.insert(key);
        result.push_back(d);
    }
    return result;
}

static void assignStableIds(MseBlock& node, const std::string& path) {
    for (size_t i = 0; i < node.children.size(); ++i) {
        auto& child = node.children[i];
        child.id = path + "/" + child.typeName() + ":" + child.name + ":" + std::to_string(i);
        child.spanStart = child.line;
        if (!child.children.empty()) {
            child.spanEnd = child.children.back().spanEnd;
        } else {
            child.spanEnd = child.line;
        }
        assignStableIds(child, child.id);
    }
}

std::vector<std::string> MseParser::splitValues(const std::string& text) {
    std::vector<std::string> result;
    std::string remaining = text;
    while (!remaining.empty()) {
        remaining = trimLeft(remaining);
        if (remaining.empty()) break;

        if (remaining[0] == '"') {
            auto end = remaining.find('"', 1);
            if (end == std::string::npos) {
                result.push_back(remaining.substr(1));
                break;
            }
            result.push_back(remaining.substr(1, end - 1));
            remaining = remaining.substr(end + 1);
        } else {
            auto end = remaining.find_first_of(" \t");
            if (end == std::string::npos) {
                result.push_back(remaining);
                break;
            }
            result.push_back(remaining.substr(0, end));
            remaining = remaining.substr(end);
        }
    }
    return result;
}

const MseBlock* MseParser::findChild(const MseBlock& node, MseBlock::Type type, const std::string& name) {
    auto lower = toLower(name);
    for (const auto& child : node.children) {
        if (child.type == type && toLower(child.name) == lower) {
            return &child;
        }
    }
    return nullptr;
}

double MseParser::readNumberProperty(const MseBlock& node, const std::string& name, double fallback) {
    auto found = findChild(node, MseBlock::Property, name);
    if (!found || found->values.empty()) return fallback;
    try {
        double val = std::stod(found->values[0]);
        if (std::isfinite(val)) return val;
    } catch (...) {}
    return fallback;
}

double MseParser::readListNumber(const MseBlock& node, const std::string& listName, double fallback) {
    auto list = findChild(node, MseBlock::List, listName);
    if (!list) return fallback;
    for (const auto& child : list->children) {
        if (child.type == MseBlock::Row && !child.values.empty()) {
            auto last = child.values.back();
            try {
                double val = std::stod(last);
                if (std::isfinite(val)) return val;
            } catch (...) {}
        }
    }
    return fallback;
}

MseDocument MseParser::parse(const std::string& text) {
    MseDocument doc;
    doc.raw = text;

    MseBlock root;
    root.type = MseBlock::Group;
    root.name = "root";
    root.line = 0;

    std::vector<MseBlock*> stack;
    stack.push_back(&root);
    MseBlock* pendingBlock = nullptr;

    std::regex blockHeaderRe("^(Group|List)\\s+(.+)$", std::regex::icase);
    std::regex inlineBlockRe("^(Group|List)\\s+(.+?)\\s*\\{$", std::regex::icase);

    std::istringstream stream(text);
    std::string sourceLine;
    int lineNumber = 0;

    while (std::getline(stream, sourceLine)) {
        ++lineNumber;
        auto trimmed = trim(sourceLine);

        if (trimmed.empty()) {
            stack.back()->children.push_back(createNode(MseBlock::Blank, "blank", lineNumber, "", sourceLine));
            continue;
        }

        if (trimmed.size() >= 2 && trimmed[0] == '/' && trimmed[1] == '/') {
            stack.back()->children.push_back(createNode(MseBlock::Comment, "comment", lineNumber, trimmed, sourceLine));
            continue;
        }
        if (!trimmed.empty() && trimmed[0] == '#') {
            stack.back()->children.push_back(createNode(MseBlock::Comment, "comment", lineNumber, trimmed, sourceLine));
            continue;
        }

        auto withoutComment = trim(sourceLine.substr(0, sourceLine.find("//")));
        if (withoutComment.empty()) continue;

        if (withoutComment == "{") {
            if (pendingBlock) {
                stack.back()->children.push_back(*pendingBlock);
                stack.push_back(&stack.back()->children.back());
                pendingBlock = nullptr;
            }
            continue;
        }

        if (withoutComment == "}") {
            if (stack.size() > 1) {
                auto* closed = stack.back();
                closed->spanEnd = lineNumber;
                stack.pop_back();
            } else {
                doc.diagnostics.push_back("Unexpected closing brace at line " + std::to_string(lineNumber));
            }
            pendingBlock = nullptr;
            continue;
        }

        std::smatch inlineMatch;
        if (std::regex_search(withoutComment, inlineMatch, inlineBlockRe)) {
            auto typeStr = toLower(inlineMatch[1].str());
            auto type = typeStr == "group" ? MseBlock::Group : MseBlock::List;
            auto node = createNode(type, trim(inlineMatch[2].str()), lineNumber, "", sourceLine);
            stack.back()->children.push_back(node);
            stack.push_back(&stack.back()->children.back());
            pendingBlock = nullptr;
            continue;
        }

        std::smatch headerMatch;
        if (std::regex_search(withoutComment, headerMatch, blockHeaderRe)) {
            auto typeStr = toLower(headerMatch[1].str());
            auto type = typeStr == "group" ? MseBlock::Group : MseBlock::List;
            auto node = createNode(type, trim(headerMatch[2].str()), lineNumber, "", sourceLine);
            pendingBlock = new MseBlock(node);
            continue;
        }

        if (pendingBlock) {
            stack.back()->children.push_back(*pendingBlock);
            delete pendingBlock;
            pendingBlock = nullptr;
        }

        auto parts = splitValues(withoutComment);
        if (parts.empty()) continue;

        if (stack.back()->type == MseBlock::List) {
            stack.back()->children.push_back(createNode(MseBlock::Row, parts[0], lineNumber, trim(withoutComment), sourceLine));
            continue;
        }

        std::string rest;
        for (size_t i = 1; i < parts.size(); ++i) {
            if (i > 1) rest += " ";
            rest += parts[i];
        }
        stack.back()->children.push_back(createNode(MseBlock::Property, parts[0], lineNumber, rest, sourceLine));
    }

    delete pendingBlock;
    pendingBlock = nullptr;

    std::vector<MseBlock> groups;
    std::vector<Dependency> deps;

    for (const auto& child : root.children) {
        collectGroups(child, groups);
        collectDependencies(child, deps);
    }

    if (stack.size() > 1) {
        doc.diagnostics.push_back(std::to_string(stack.size() - 1) + " block(s) were not closed");
    }

    assignStableIds(root, "root");

    doc.root = root;
    doc.groups = groups;
    doc.dependencies = dedupeDependencies(deps);
    return doc;
}

static std::string quoteValue(const std::string& value) {
    if (value.find_first_of(" \t\\/") != std::string::npos) {
        return "\"" + value + "\"";
    }
    return value;
}

std::string MseParser::exportMse(const MseBlock& node, const std::string& indent) {
    std::string result;
    for (const auto& child : node.children) {
        if (child.type == MseBlock::Comment) {
            auto raw = trim(child.raw);
            result += indent + raw + "\n";
            continue;
        }
        if (child.type == MseBlock::Blank) {
            result += "\n";
            continue;
        }
        if (child.type == MseBlock::Group || child.type == MseBlock::List) {
            result += indent + child.typeName() + " " + child.name + "\n";
            result += indent + "{\n";
            result += exportMse(child, indent + "    ");
            result += indent + "}\n";
            continue;
        }
        if (child.type == MseBlock::Row) {
            std::string row;
            if (!child.values.empty()) {
                for (size_t i = 0; i < child.values.size(); ++i) {
                    if (i > 0) row += " ";
                    row += quoteValue(child.values[i]);
                }
            } else {
                row = child.value;
            }
            result += indent + row + "\n";
            continue;
        }
        result += indent + child.name;
        if (!child.value.empty()) {
            result += "\t";
            if (!child.values.empty()) {
                for (size_t i = 0; i < child.values.size(); ++i) {
                    if (i > 0) result += " ";
                    result += quoteValue(child.values[i]);
                }
            } else {
                result += child.value;
            }
        }
        result += "\n";
    }
    return result;
}
