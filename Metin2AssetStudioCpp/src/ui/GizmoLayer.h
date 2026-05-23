#pragma once
#include <QObject>
#include <QMouseEvent>
#include <QOpenGLFunctions>

struct Vec3 {
    double x = 0.0, y = 0.0, z = 0.0;
    Vec3() = default;
    Vec3(double x, double y, double z) : x(x), y(y), z(z) {}
    Vec3 operator+(const Vec3& o) const { return {x+o.x, y+o.y, z+o.z}; }
    Vec3 operator-(const Vec3& o) const { return {x-o.x, y-o.y, z-o.z}; }
    Vec3 operator*(double s) const { return {x*s, y*s, z*s}; }
    double dot(const Vec3& o) const { return x*o.x + y*o.y + z*o.z; }
    double length() const { return sqrt(x*x + y*y + z*z); }
    Vec3 normalized() const { double l = length(); return l > 0 ? Vec3(x/l, y/l, z/l) : Vec3(); }
};

class GizmoLayer : public QObject {
    Q_OBJECT
public:
    enum Mode { Translate, Rotate, Scale };
    explicit GizmoLayer(QObject* parent = nullptr);
    void setEnabled(bool e) { enabled = e; }
    bool isEnabled() const { return enabled; }
    void setMode(Mode m) { mode = m; }
    Mode getMode() const { return mode; }
    void setTarget(const Vec3& t);
    Vec3 getTarget() const { return target; }
    void render(const Vec3& cameraPos);
    bool mousePressEvent(QMouseEvent* event, int viewW, int viewH, const Vec3& cameraPos);
    void mouseMoveEvent(QMouseEvent* event, int viewW, int viewH, const Vec3& cameraPos);
    void mouseReleaseEvent(QMouseEvent* event);
signals:
    void targetChanged(const Vec3& pos);
private:
    bool enabled = false;
    Mode mode = Translate;
    Vec3 target{0, 1, 0};
    int activeAxis = -1;
    bool isDragging = false;
    Vec3 dragStart;
    QPoint lastMousePos;
    void drawAxis(int axis, const Vec3& color, const Vec3& cameraPos);
    bool hitTestAxis(int axis, QPoint mousePos, int viewW, int viewH, const Vec3& cameraPos);
};
