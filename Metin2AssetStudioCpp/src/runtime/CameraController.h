#pragma once
#include "utils/MathUtils.h"
#include <QObject>
#include <QPoint>
#include <QMouseEvent>
#include <QWheelEvent>

class CameraController : public QObject {
    Q_OBJECT
public:
    explicit CameraController(QObject* parent = nullptr);
    MathUtils::Vec3 getPosition() const;
    MathUtils::Vec3 getTarget() const;
    void setTarget(const MathUtils::Vec3& target);
    void mousePressEvent(QMouseEvent* event);
    void mouseMoveEvent(QMouseEvent* event, int widgetWidth, int widgetHeight);
    void mouseReleaseEvent(QMouseEvent* event);
    void wheelEvent(QWheelEvent* event);
    void reset();
    double getFov() const { return fov; }
    void setFov(double v) { fov = v; }
signals:
    void cameraChanged();
private:
    double phi = 45.0, theta = 45.0, radius = 8.0;
    MathUtils::Vec3 target{0, 1, 0};
    double fov = 45.0;
    bool isDragging = false, isPanning = false;
    QPoint lastMousePos;
};
