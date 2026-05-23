#include "GizmoLayer.h"
#include <GL/gl.h>
#include <GL/glu.h>
#include <algorithm>
#include <cmath>

static const double AXIS_LEN = 2.0;
static const double CONE_H = 0.2;
static const double CONE_R = 0.08;
static const int SEGMENTS = 12;
static const double HIT_RADIUS = 10.0;

static Vec3 axisDir(int axis)
{
    switch (axis) {
        case 0: return Vec3(1, 0, 0);
        case 1: return Vec3(0, 1, 0);
        case 2: return Vec3(0, 0, 1);
        default: return Vec3();
    }
}

static Vec3 axisColor(int axis, bool bright)
{
    double b = bright ? 1.0 : 0.7;
    switch (axis) {
        case 0: return Vec3(b, 0, 0);
        case 1: return Vec3(0, b, 0);
        case 2: return Vec3(0, 0, b);
        default: return Vec3(1, 1, 1);
    }
}

GizmoLayer::GizmoLayer(QObject* parent)
    : QObject(parent)
{
}

void GizmoLayer::setTarget(const Vec3& t)
{
    target = t;
}

void GizmoLayer::render(const Vec3& cameraPos)
{
    if (!enabled) return;

    for (int axis = 0; axis < 3; ++axis) {
        Vec3 color = axisColor(axis, axis == activeAxis);
        drawAxis(axis, color, cameraPos);
    }
}

void GizmoLayer::drawAxis(int axis, const Vec3& color, const Vec3& cameraPos)
{
    Vec3 dir = axisDir(axis);
    Vec3 end = target + dir * AXIS_LEN;
    Vec3 coneTip = end + dir * CONE_H;
    Vec3 coneBase = end;

    Vec3 toCam = cameraPos - target;
    Vec3 up(0, 1, 0);
    if (std::abs(toCam.normalized().dot(up)) > 0.99) {
        up = Vec3(0, 0, 1);
    }
    Vec3 right = toCam.normalized().cross(up).normalized();
    Vec3 localUp = right.cross(toCam.normalized()).normalized();

    glColor3d(color.x, color.y, color.z);
    glLineWidth(axis == activeAxis ? 3.0f : 1.5f);

    // Line
    glBegin(GL_LINES);
    glVertex3d(target.x, target.y, target.z);
    glVertex3d(end.x, end.y, end.z);
    glEnd();

    // Arrow cone
    glBegin(GL_TRIANGLE_FAN);
    glVertex3d(coneTip.x, coneTip.y, coneTip.z);
    for (int i = 0; i <= SEGMENTS; ++i) {
        double angle = 2.0 * 3.14159265358979323846 * i / SEGMENTS;
        Vec3 r = right * (CONE_R * cos(angle)) + localUp * (CONE_R * sin(angle));
        glVertex3d(coneBase.x + r.x, coneBase.y + r.y, coneBase.z + r.z);
    }
    glEnd();

    glLineWidth(1.0f);
}

bool GizmoLayer::hitTestAxis(int axis, QPoint mousePos, int viewW, int viewH, const Vec3& cameraPos)
{
    if (!enabled) return false;

    Vec3 dir = axisDir(axis);
    Vec3 end = target + dir * AXIS_LEN;

    // Project both points to screen
    GLdouble model[16], proj[16];
    GLint viewport[4];
    glGetDoublev(GL_MODELVIEW_MATRIX, model);
    glGetDoublev(GL_PROJECTION_MATRIX, proj);
    glGetIntegerv(GL_VIEWPORT, viewport);

    GLdouble sx1, sy1, sz1, sx2, sy2, sz2;
    gluProject(target.x, target.y, target.z, model, proj, viewport, &sx1, &sy1, &sz1);
    gluProject(end.x, end.y, end.z, model, proj, viewport, &sx2, &sy2, &sz2);

    QPoint p1(static_cast<int>(sx1), viewport[3] - static_cast<int>(sy1));
    QPoint p2(static_cast<int>(sx2), viewport[3] - static_cast<int>(sy2));

    // Distance from mouse to line segment in screen space
    QPoint pm = mousePos;
    double dx = p2.x() - p1.x();
    double dy = p2.y() - p1.y();
    double len2 = dx * dx + dy * dy;
    if (len2 < 1.0) {
        double d = sqrt(pow(pm.x() - p1.x(), 2) + pow(pm.y() - p1.y(), 2));
        return d < HIT_RADIUS;
    }
    double t = ((pm.x() - p1.x()) * dx + (pm.y() - p1.y()) * dy) / len2;
    t = std::max(0.0, std::min(1.0, t));
    double nearX = p1.x() + t * dx;
    double nearY = p1.y() + t * dy;
    double dist = sqrt(pow(pm.x() - nearX, 2) + pow(pm.y() - nearY, 2));
    return dist < HIT_RADIUS;
}

bool GizmoLayer::mousePressEvent(QMouseEvent* event, int viewW, int viewH, const Vec3& cameraPos)
{
    if (!enabled || event->button() != Qt::LeftButton) return false;

    for (int axis = 0; axis < 3; ++axis) {
        if (hitTestAxis(axis, event->pos(), viewW, viewH, cameraPos)) {
            activeAxis = axis;
            isDragging = true;
            dragStart = target;
            lastMousePos = event->pos();
            return true;
        }
    }
    return false;
}

void GizmoLayer::mouseMoveEvent(QMouseEvent* event, int viewW, int viewH, const Vec3& cameraPos)
{
    if (!isDragging || activeAxis < 0) return;

    // Project dragStart and dragStart + axisDir to screen
    GLdouble model[16], proj[16];
    GLint viewport[4];
    glGetDoublev(GL_MODELVIEW_MATRIX, model);
    glGetDoublev(GL_PROJECTION_MATRIX, proj);
    glGetIntegerv(GL_VIEWPORT, viewport);

    Vec3 dir = axisDir(activeAxis);

    GLdouble sx1, sy1, sz1, sx2, sy2, sz2;
    gluProject(dragStart.x, dragStart.y, dragStart.z, model, proj, viewport, &sx1, &sy1, &sz1);
    gluProject(dragStart.x + dir.x, dragStart.y + dir.y, dragStart.z + dir.z, model, proj, viewport, &sx2, &sy2, &sz2);

    double screenDx = sx2 - sx1;
    double screenDy = sy2 - sy1;
    double screenLen = sqrt(screenDx * screenDx + screenDy * screenDy);
    if (screenLen < 1.0) return;

    QPoint delta = event->pos() - lastMousePos;
    double projDist = (delta.x() * screenDx + delta.y() * screenDy) / screenLen;
    double scaleFactor = projDist / screenLen;

    Vec3 newTarget = dragStart + dir * (scaleFactor * AXIS_LEN);
    target = newTarget;
    emit targetChanged(target);

    lastMousePos = event->pos();
}

void GizmoLayer::mouseReleaseEvent(QMouseEvent* event)
{
    if (event->button() == Qt::LeftButton) {
        isDragging = false;
        activeAxis = -1;
    }
}
