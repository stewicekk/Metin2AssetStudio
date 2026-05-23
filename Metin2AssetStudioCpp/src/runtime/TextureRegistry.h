#pragma once
#include <string>
#include <unordered_map>
#include <QImage>

class TextureRegistry {
public:
    static TextureRegistry& instance();
    QImage getTexture(const std::string& name, int size = 64);
    void clear();
private:
    TextureRegistry() = default;
    QImage generateCircle(int size);
    QImage generateStar(int size);
    QImage generateRing(int size);
    QImage generateSpark(int size);
    QImage generateSmoke(int size);
    QImage generateFlare(int size);
    QImage generateHexagon(int size);
    QImage generateFlame(int size);
    QImage generateDiamond(int size);
    QImage generateSoftGlow(int size);
    QImage generateCross(int size);
    QImage generateArrow(int size);
    QImage generateDebris(int size);
    std::unordered_map<std::string, QImage> cache;
};
