#pragma once
#include <cmath>
#include <algorithm>

namespace MathUtils {
    inline double lerp(double a, double b, double t) { return a + (b - a) * t; }
    inline double clamp(double v, double minVal, double maxVal) { return std::max(minVal, std::min(maxVal, v)); }
    inline double degToRad(double deg) { return deg * 3.14159265358979323846 / 180.0; }
    inline double radToDeg(double rad) { return rad * 180.0 / 3.14159265358979323846; }
    struct Vec3 {
        double x = 0, y = 0, z = 0;
        Vec3() = default;
        Vec3(double x, double y, double z) : x(x), y(y), z(z) {}
        Vec3 operator+(const Vec3& o) const { return {x+o.x, y+o.y, z+o.z}; }
        Vec3 operator-(const Vec3& o) const { return {x-o.x, y-o.y, z-o.z}; }
        Vec3 operator*(double s) const { return {x*s, y*s, z*s}; }
        Vec3& operator+=(const Vec3& o) { x+=o.x; y+=o.y; z+=o.z; return *this; }
        Vec3& operator*=(double s) { x*=s; y*=s; z*=s; return *this; }
        double length() const { return std::sqrt(x*x + y*y + z*z); }
        void normalize() { double l = length(); if (l > 1e-10) { x/=l; y/=l; z/=l; } }
        Vec3 normalized() const { Vec3 v = *this; v.normalize(); return v; }
        Vec3 cross(const Vec3& o) const { return {y*o.z - z*o.y, z*o.x - x*o.z, x*o.y - y*o.x}; }
    };
}
