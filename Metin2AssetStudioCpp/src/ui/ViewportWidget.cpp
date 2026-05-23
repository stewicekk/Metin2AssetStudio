#include "ViewportWidget.h"
#include <QImage>
#include <QDateTime>
#include <QDir>
#include <QApplication>
#include <cmath>
#include <GL/glu.h>

ViewportWidget::ViewportWidget(QWidget* parent)
    : QOpenGLWidget(parent)
{
    setFocusPolicy(Qt::StrongFocus);
}

ViewportWidget::~ViewportWidget() {}

void ViewportWidget::setEmitters(const std::vector<Emitter>* emitters)
{
    emittersPtr = emitters;
    renderer.setEmitters(emitters);
}

void ViewportWidget::initializeGL()
{
    initializeOpenGLFunctions();
    glClearColor(bgColor.redF(), bgColor.greenF(), bgColor.blueF(), 1.0f);
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glEnable(GL_PROGRAM_POINT_SIZE);
    renderer.initGL();
}

void ViewportWidget::resizeGL(int w, int h)
{
    viewW = w;
    viewH = h;
    glViewport(0, 0, w, h);
}

void ViewportWidget::paintGL()
{
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    setupProjection(viewW, viewH);

    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    auto camPos = camera.getPosition();
    auto camTarget = camera.getTarget();
    auto camUp = camera.getUp();

    gluLookAt(camPos.x, camPos.y, camPos.z,
              camTarget.x, camTarget.y, camTarget.z,
              camUp.x, camUp.y, camUp.z);

    if (showGrid) renderGrid();
    if (showAxis) renderAxis();

    renderer.render(camPos, camTarget, camera.getFov(), viewW, viewH);

    renderMinimap();
}

void ViewportWidget::setupProjection(int w, int h)
{
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();

    double aspect = (h > 0) ? static_cast<double>(w) / h : 1.0;
    double fovRad = camera.getFov() * 3.14159265358979323846 / 180.0;
    double fh = tan(fovRad / 2.0) * 0.1;
    double fw = fh * aspect;

    glFrustum(-fw, fw, -fh, fh, 0.1, 100.0);
}

void ViewportWidget::renderGrid()
{
    glColor3d(0.1, 0.2, 0.2);
    glBegin(GL_LINES);
    for (int i = -10; i <= 10; ++i) {
        glVertex3d(static_cast<double>(i), 0.0, -10.0);
        glVertex3d(static_cast<double>(i), 0.0, 10.0);
        glVertex3d(-10.0, 0.0, static_cast<double>(i));
        glVertex3d(10.0, 0.0, static_cast<double>(i));
    }
    glEnd();

    glLineWidth(2.0f);
    glColor3d(1.0, 1.0, 1.0);
    glBegin(GL_LINES);
    glVertex3d(-10.0, 0.0, 0.0);
    glVertex3d(10.0, 0.0, 0.0);
    glVertex3d(0.0, 0.0, -10.0);
    glVertex3d(0.0, 0.0, 10.0);
    glEnd();
    glLineWidth(1.0f);
}

void ViewportWidget::renderAxis()
{
    double len = 2.0;

    // X axis (red)
    glColor3d(1.0, 0.0, 0.0);
    glBegin(GL_LINES);
    glVertex3d(0.0, 0.0, 0.0);
    glVertex3d(len, 0.0, 0.0);
    glEnd();

    // Y axis (green)
    glColor3d(0.0, 1.0, 0.0);
    glBegin(GL_LINES);
    glVertex3d(0.0, 0.0, 0.0);
    glVertex3d(0.0, len, 0.0);
    glEnd();

    // Z axis (blue)
    glColor3d(0.0, 0.0, 1.0);
    glBegin(GL_LINES);
    glVertex3d(0.0, 0.0, 0.0);
    glVertex3d(0.0, 0.0, len);
    glEnd();

    // Arrow cones
    double coneH = 0.2;
    double coneR = 0.08;
    int segments = 8;

    // X arrow
    glColor3d(1.0, 0.0, 0.0);
    glBegin(GL_TRIANGLE_FAN);
    glVertex3d(len + coneH, 0.0, 0.0);
    for (int i = 0; i <= segments; ++i) {
        double a = 2.0 * 3.14159265358979323846 * i / segments;
        glVertex3d(len, coneR * cos(a), coneR * sin(a));
    }
    glEnd();

    // Y arrow
    glColor3d(0.0, 1.0, 0.0);
    glBegin(GL_TRIANGLE_FAN);
    glVertex3d(0.0, len + coneH, 0.0);
    for (int i = 0; i <= segments; ++i) {
        double a = 2.0 * 3.14159265358979323846 * i / segments;
        glVertex3d(coneR * cos(a), len, coneR * sin(a));
    }
    glEnd();

    // Z arrow
    glColor3d(0.0, 0.0, 1.0);
    glBegin(GL_TRIANGLE_FAN);
    glVertex3d(0.0, 0.0, len + coneH);
    for (int i = 0; i <= segments; ++i) {
        double a = 2.0 * 3.14159265358979323846 * i / segments;
        glVertex3d(coneR * cos(a), coneR * sin(a), len);
    }
    glEnd();
}

void ViewportWidget::renderMinimap()
{
    int mapSize = 120;
    int margin = 10;
    int mapX = viewW - mapSize - margin;
    int mapY = margin;

    glViewport(mapX, mapY, mapSize, mapSize);

    glMatrixMode(GL_PROJECTION);
    glPushMatrix();
    glLoadIdentity();
    glOrtho(-15.0, 15.0, -15.0, 15.0, -1.0, 1.0);

    glMatrixMode(GL_MODELVIEW);
    glPushMatrix();
    glLoadIdentity();

    // Background
    glColor4d(0.05, 0.05, 0.1, 0.85);
    glBegin(GL_QUADS);
    glVertex2d(-15, -15);
    glVertex2d(15, -15);
    glVertex2d(15, 15);
    glVertex2d(-15, 15);
    glEnd();

    // Grid lines
    glColor4d(0.15, 0.25, 0.25, 0.6);
    glBegin(GL_LINES);
    for (int i = -10; i <= 10; ++i) {
        glVertex2d(static_cast<double>(i), -15.0);
        glVertex2d(static_cast<double>(i), 15.0);
        glVertex2d(-15.0, static_cast<double>(i));
        glVertex2d(15.0, static_cast<double>(i));
    }
    glEnd();

    // Emitter positions
    if (emittersPtr) {
        for (const auto& e : *emittersPtr) {
            if (!e.visible) continue;
            glPointSize(4.0f);
            glColor3d(0.3, 0.8, 1.0);
            glBegin(GL_POINTS);
            glVertex3d(e.posX, e.posZ, 0.0);
            glEnd();
        }
    }

    // Camera position (triangle)
    auto camPos = camera.getPosition();
    double cx = camPos.x;
    double cz = camPos.z;
    glColor3d(1.0, 1.0, 1.0);
    glBegin(GL_TRIANGLES);
    glVertex2d(cx, cz + 0.5);
    glVertex2d(cx - 0.3, cz - 0.3);
    glVertex2d(cx + 0.3, cz - 0.3);
    glEnd();

    glPopMatrix();
    glMatrixMode(GL_PROJECTION);
    glPopMatrix();
    glMatrixMode(GL_MODELVIEW);

    setupProjection(viewW, viewH);
    glViewport(0, 0, viewW, viewH);
}

void ViewportWidget::takeScreenshot()
{
    makeCurrent();
    QImage img(viewW, viewH, QImage::Format_RGBA8888);
    glReadPixels(0, 0, viewW, viewH, GL_RGBA, GL_UNSIGNED_BYTE, img.bits());
    img = img.mirrored(false, true);

    QString timestamp = QDateTime::currentDateTime().toString("yyyy-MM-dd_hh-mm-ss");
    QString filename = QString("screenshot_%1.png").arg(timestamp);
    img.save(filename);

    if (parent()) {
        auto* mw = window();
        if (mw) {
            mw->setProperty("statusMessage", "Screenshot saved: " + filename);
        }
    }
}

void ViewportWidget::tick(double dt)
{
    if (dt > 0.05) dt = 0.05;

    animTime += dt;

    if (isPlaying) {
        renderer.update(dt, true, vpScale);
    } else {
        bool first = (animTime < dt);
        renderer.update(0.0, false, vpScale);
    }

    update();

    fpsAccum += dt;
    fpsFrames++;
    if (fpsAccum >= 1.0) {
        curFps = static_cast<double>(fpsFrames) / fpsAccum;
        fpsAccum = 0.0;
        fpsFrames = 0;
        emit fpsUpdated(curFps);
    }
}

void ViewportWidget::mousePressEvent(QMouseEvent* event)
{
    camera.mousePress(event);
    update();
}

void ViewportWidget::mouseMoveEvent(QMouseEvent* event)
{
    camera.mouseMove(event);
    update();
}

void ViewportWidget::mouseReleaseEvent(QMouseEvent* event)
{
    camera.mouseRelease(event);
    update();
}

void ViewportWidget::wheelEvent(QWheelEvent* event)
{
    camera.wheelEvent(event);
    update();
}
