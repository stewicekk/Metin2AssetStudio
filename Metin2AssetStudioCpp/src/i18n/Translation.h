#pragma once
#include <string>
#include <unordered_map>

class Translation {
public:
    static Translation& instance();
    void setLanguage(const std::string& lang);
    std::string get(const std::string& key) const;
    std::string tr(const std::string& key) const { return get(key); }
private:
    Translation() = default;
    std::string currentLang = "en";
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> strings;
    void loadEnglish();
    void loadCzech();
};
