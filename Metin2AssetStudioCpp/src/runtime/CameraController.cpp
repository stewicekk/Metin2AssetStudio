#include "CameraController.h"
#include <QtMath>

CameraController::CameraController(QObject* parent) : QObject(parent) {}

MathUtils::Vec3 CameraController::getPosition() const {
    double thetaRad = MathUtils::degToRad(theta);
    double phiRad = MathUtils::degToRad(phi);
    double x = radius * std::sin(thetaRad) * std::cos(phiRad);
    double y = radius * std::cos(thetaRad);
    double z = radius * std::sin(thetaRad) * std::sin(phiRad);
    return MathUtils::Vec3(x + target.x, y + target.y, z + target.z);
}

MathUtils::Vec3 CameraController::getTarget() const {
    return target;
}

void CameraController::setTarget(const MathUtils::Vec3& t) {
    target = t;
    emit cameraChanged();
}

void CameraController::mousePressEvent(QMouseEvent* event) {
    if (event->button() == Qt::RightButton) {
        isDragging = true;
        isPanning = false;
        lastMousePos = event->pos();
    } else if (event->button() == Qt::MiddleButton) {
        isPanning = true;
        isDragging = false;
        lastMousePos = event->pos();
    }
}

void CameraController::mouseMoveEvent(QMouseEvent* event, int widgetWidth, int widgetHeight) {
    QPoint delta = event->pos() - lastMousePos;
    lastMousePos = event->pos();

    if (isDragging) {
        phi += delta.x() * 0.5;
        theta = MathUtils::clamp(theta - delta.y() * 0.5, 1.0, 179.0);
        emit cameraChanged();
    } else if (isPanning) {
        double thetaRad = MathUtils::degToRad(theta);
        double phiRad = MathUtils::degToRad(phi);
        double forwardX = std::sin(thetaRad) * std::cos(phiRad);
        double forwardY = std::cos(thetaRad);
        double forwardZ = std::sin(thetaRad) * std::sin(phiRad);
        MathUtils::Vec3 fwd(forwardX, forwardY, forwardZ);
        fwd.normalize();
        MathUtils::Vec3 up(0, 1, 0);
        MathUtils::Vec3 right = fwd.normalized().cross(up).normalized();
        MathUtils::Vec3 viewUp = right.cross(fwd.normalized()).normalized();
        double panSpeed = radius * 0.003;
        target += right * (-delta.x() * panSpeed);
        target += viewUp * (delta.y() * panSpeed);
        emit cameraChanged();
    }
}

void CameraController::mouseReleaseEvent(QMouseEvent* event) {
    if (event->button() == Qt::RightButton) isDragging = false;
    if (event->button() == Qt::MiddleButton) isPanning = false;
}

void CameraController::wheelEvent(QWheelEvent* event) {
    double dy = event->angleDelta().y();
    radius *= (1.0 - dy * 0.01);
    radius = MathUtils::clamp(radius, 0.5, 50.0);
    emit cameraChanged();
}

void CameraController::reset() {
    phi = 45.0;
    theta = 45.0;
    radius = 8.0;
    target = MathUtils::Vec3(0, 1, 0);
    emit cameraChanged();
}
