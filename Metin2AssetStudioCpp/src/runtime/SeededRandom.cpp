#include "SeededRandom.h"

SeededRandom::SeededRandom(uint64_t seed) : state(seed) {}

double SeededRandom::next() {
    state = (1664525ULL * state + 1013904223ULL) & 0xFFFFFFFF;
    return state / 4294967296.0;
}

double SeededRandom::range(double min, double max) {
    return min + next() * (max - min);
}

double SeededRandom::centered(double amount) {
    return next() * 2.0 * amount - amount;
}
