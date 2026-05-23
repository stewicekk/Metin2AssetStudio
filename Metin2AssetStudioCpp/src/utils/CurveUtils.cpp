#include "CurveUtils.h"
#include "MathUtils.h"
#include <algorithm>

static double smoothstep(double t) {
    return t * t * (3.0 - 2.0 * t);
}

double CurveUtils::sampleCurve(const std::vector<CurvePoint>& arr, double t, CurveInterpolationType interpolation) {
    if (arr.empty()) return 1.0;
    if (arr.size() == 1) return arr[0].v;

    std::vector<CurvePoint> sorted = arr;
    std::sort(sorted.begin(), sorted.end(), [](const CurvePoint& a, const CurvePoint& b) {
        return a.t < b.t;
    });

    if (t <= sorted[0].t) return sorted[0].v;
    if (t >= sorted.back().t) return sorted.back().v;

    size_t i = 0;
    for (i = 0; i < sorted.size() - 1; ++i) {
        if (t >= sorted[i].t && t < sorted[i + 1].t) break;
    }

    const CurvePoint& a = sorted[i];
    const CurvePoint& b = sorted[i + 1];
    double localT = (t - a.t) / (b.t - a.t);

    if (interpolation == CurveInterpolationType::Smooth) {
        localT = smoothstep(localT);
    }

    return MathUtils::lerp(a.v, b.v, localT);
}

ColorKey CurveUtils::sampleColor(const std::vector<ColorKey>& keys, double t) {
    if (keys.empty()) return {0.0, 1.0, 1.0, 1.0, 1.0};
    if (keys.size() == 1) return keys[0];

    std::vector<ColorKey> sorted = keys;
    std::sort(sorted.begin(), sorted.end(), [](const ColorKey& a, const ColorKey& b) {
        return a.t < b.t;
    });

    if (t <= sorted[0].t) return sorted[0];
    if (t >= sorted.back().t) return sorted.back();

    size_t i = 0;
    for (i = 0; i < sorted.size() - 1; ++i) {
        if (t >= sorted[i].t && t < sorted[i + 1].t) break;
    }

    const ColorKey& a = sorted[i];
    const ColorKey& b = sorted[i + 1];
    double localT = (t - a.t) / (b.t - a.t);

    ColorKey result;
    result.t = t;
    result.r = MathUtils::lerp(a.r, b.r, localT);
    result.g = MathUtils::lerp(a.g, b.g, localT);
    result.b = MathUtils::lerp(a.b, b.b, localT);
    result.a = MathUtils::lerp(a.a, b.a, localT);

    return result;
}
