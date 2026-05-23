#pragma once
#include "core/Types.h"
#include <vector>

namespace CurveUtils {
    double sampleCurve(const std::vector<CurvePoint>& arr, double t, CurveInterpolationType interpolation = CurveInterpolationType::Linear);
    ColorKey sampleColor(const std::vector<ColorKey>& keys, double t);
}
