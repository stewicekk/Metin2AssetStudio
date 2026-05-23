#pragma once
#include <cstdint>

class SeededRandom {
public:
    explicit SeededRandom(uint64_t seed);
    double next();          // [0, 1)
    double range(double min, double max);
    double centered(double amount);
private:
    uint64_t state;
};
