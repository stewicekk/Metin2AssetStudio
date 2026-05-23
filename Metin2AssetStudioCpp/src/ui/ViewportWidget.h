#pragma once
#include <QOpenGLWidget>
#include <QOpenGLFunctions>
#include <QTimer>
#include <QMouseEvent>
#include <QWheelEvent>
#include <QKeyEvent>
#include "core/Types.h"
#include "runtime/CameraController.h"
#include "runtime/ParticleRenderer.h"

class ViewportWidget : public QOpenGLWidget, protected QOpenGLFunctions {
    Q_OBJECT
public:
    explicit ViewportWidget(QWidget* parent = nullptr);
    ~ViewportWidget();
    void setEmitters(const std::vector<Emitter>* emitters);
    void setPlaying(bool p) { isPlaying = p; }
    void setVpScale(double s) { vpScale = s; }
    void setSceneBg(const QColor& c) { bgColor = c; }
    void setShowGrid(bool s) { showGrid = s; }
    void setShowAxis(bool s) { showAxis = s; }
    void resetCamera() { camera.reset(); }
    void takeScreenshot();
    CameraController* camCtrl() { return &camera; }
    ParticleRenderer* getRenderer() { return &renderer; }
public slots:
    void tick(double dt);
signals:
    void fpsUpdated(double fps);
    void emitterClicked(uint64_t uid);
protected:
    void initializeGL() override;
    void resizeGL(int w, int h) override;
    void paintGL() override;
    void mousePressEvent(QMouseEvent* event) override;
    void mouseMoveEvent(QMouseEvent* event) override;
    void mouseReleaseEvent(QMouseEvent* event) override;
    void wheelEvent(QWheelEvent* event) override;
private:
    void setupProjection(int w, int h);
    void renderGrid();
    void renderAxis();
    void renderMinimap();
    CameraController camera;
    ParticleRenderer renderer;
    const std::vector<Emitter>* emittersPtr = nullptr;
    uint64_t activeId = 0;
    bool isPlaying = false;
    double vpScale = 1.0;
    QColor bgColor{10, 17, 24};
    bool showGrid = true, showAxis = true;
    double fpsAccum = 0;
    int fpsFrames = 0;
    double curFps = 0;
    double animTime = 0;
    int viewW = 0, viewH = 0;
};
