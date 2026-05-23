#include "TextureRegistry.h"
#include <QPainter>
#include <QRadialGradient>
#include <QtMath>
#include <cmath>
#include <algorithm>
static const double PI = 3.14159265358979323846;

TextureRegistry& TextureRegistry::instance() {
    static TextureRegistry inst;
    return inst;
}

QImage TextureRegistry::getTexture(const std::string& name, int size) {
    std::string key = name + "_" + std::to_string(size);
    auto it = cache.find(key);
    if (it != cache.end()) return it->second;

    QImage img;
    if (name == "circle") img = generateCircle(size);
    else if (name == "star") img = generateStar(size);
    else if (name == "ring") img = generateRing(size);
    else if (name == "spark") img = generateSpark(size);
    else if (name == "smoke") img = generateSmoke(size);
    else if (name == "flare") img = generateFlare(size);
    else if (name == "hexagon") img = generateHexagon(size);
    else if (name == "flame") img = generateFlame(size);
    else if (name == "diamond") img = generateDiamond(size);
    else if (name == "softGlow") img = generateSoftGlow(size);
    else if (name == "cross") img = generateCross(size);
    else if (name == "arrow") img = generateArrow(size);
    else if (name == "debris") img = generateDebris(size);
    else img = generateCircle(size);

    cache[key] = img;
    return img;
}

void TextureRegistry::clear() {
    cache.clear();
}

QImage TextureRegistry::generateCircle(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    QRadialGradient grad(size / 2.0, size / 2.0, size / 2.0);
    grad.setColorAt(0.0, QColor(255, 255, 255, 255));
    grad.setColorAt(0.7, QColor(255, 255, 255, 255));
    grad.setColorAt(1.0, QColor(255, 255, 255, 0));
    p.fillRect(0, 0, size, size, grad);
    p.end();
    return img;
}

QImage TextureRegistry::generateStar(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, cy = size / 2.0;
    double r1 = size / 2.5, r2 = size / 6.0;
    QPolygonF star;
    for (int i = 0; i < 10; ++i) {
        double angle = (i * 36.0 - 90.0) * PI / 180.0;
        double r = (i % 2 == 0) ? r1 : r2;
        star << QPointF(cx + r * cos(angle), cy + r * sin(angle));
    }
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawPolygon(star);
    p.end();
    return img;
}

QImage TextureRegistry::generateRing(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    p.setPen(QPen(QColor(255, 255, 255, 255), size / 8.0));
    p.setBrush(Qt::NoBrush);
    p.drawEllipse(QPointF(size / 2.0, size / 2.0), size / 3.5, size / 3.5);
    p.end();
    return img;
}

QImage TextureRegistry::generateSpark(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, cy = size / 2.0;
    QPolygonF diamond;
    diamond << QPointF(cx, cy - size / 2.0)
            << QPointF(cx + size / 8.0, cy)
            << QPointF(cx, cy + size / 2.0)
            << QPointF(cx - size / 8.0, cy);
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawPolygon(diamond);
    QPolygonF hCross;
    hCross << QPointF(cx - size / 2.0, cy)
           << QPointF(cx, cy + size / 8.0)
           << QPointF(cx + size / 2.0, cy)
           << QPointF(cx, cy - size / 8.0);
    p.drawPolygon(hCross);
    p.end();
    return img;
}

QImage TextureRegistry::generateSmoke(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    QRadialGradient grad(size / 2.0, size / 2.0, size / 2.0);
    grad.setColorAt(0.0, QColor(255, 255, 255, 255));
    grad.setColorAt(0.4, QColor(255, 255, 255, 200));
    grad.setColorAt(0.8, QColor(255, 255, 255, 80));
    grad.setColorAt(1.0, QColor(255, 255, 255, 0));
    p.fillRect(0, 0, size, size, grad);
    p.end();
    return img;
}

QImage TextureRegistry::generateFlare(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    QLinearGradient grad(0, size / 2.0, size, size / 2.0);
    grad.setColorAt(0.0, QColor(255, 255, 255, 0));
    grad.setColorAt(0.3, QColor(255, 255, 255, 80));
    grad.setColorAt(0.45, QColor(255, 255, 255, 255));
    grad.setColorAt(0.5, QColor(255, 255, 255, 255));
    grad.setColorAt(0.55, QColor(255, 255, 255, 255));
    grad.setColorAt(0.7, QColor(255, 255, 255, 80));
    grad.setColorAt(1.0, QColor(255, 255, 255, 0));
    p.fillRect(0, size / 4, size, size / 2, grad);
    p.end();
    return img;
}

QImage TextureRegistry::generateHexagon(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, cy = size / 2.0, r = size / 2.5;
    QPolygonF hex;
    for (int i = 0; i < 6; ++i) {
        double angle = (i * 60.0 - 90.0) * PI / 180.0;
        hex << QPointF(cx + r * cos(angle), cy + r * sin(angle));
    }
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawPolygon(hex);
    p.end();
    return img;
}

QImage TextureRegistry::generateFlame(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, by = size - 2.0;
    QPainterPath path;
    path.moveTo(cx, 2);
    path.cubicTo(cx - size / 4, size / 3, cx - size / 3, size * 0.7, cx - size / 6, by);
    path.cubicTo(cx - size / 8, by - size / 4, cx + size / 8, by - size / 4, cx + size / 6, by);
    path.cubicTo(cx + size / 3, size * 0.7, cx + size / 4, size / 3, cx, 2);
    path.closeSubpath();
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawPath(path);
    p.end();
    return img;
}

QImage TextureRegistry::generateDiamond(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, cy = size / 2.0, r = size / 2.8;
    QPolygonF diamond;
    diamond << QPointF(cx, cy - r) << QPointF(cx + r, cy)
            << QPointF(cx, cy + r) << QPointF(cx - r, cy);
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawPolygon(diamond);
    p.end();
    return img;
}

QImage TextureRegistry::generateSoftGlow(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    QRadialGradient grad(size / 2.0, size / 2.0, size / 2.0);
    grad.setColorAt(0.0, QColor(255, 255, 255, 255));
    grad.setColorAt(0.3, QColor(255, 255, 255, 128));
    grad.setColorAt(0.6, QColor(255, 255, 255, 32));
    grad.setColorAt(1.0, QColor(255, 255, 255, 0));
    p.fillRect(0, 0, size, size, grad);
    p.end();
    return img;
}

QImage TextureRegistry::generateCross(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, cy = size / 2.0;
    double w = size / 6.0;
    double h = size / 2.8;
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawRect(QRectF(cx - w / 2, cy - h, w, h * 2));
    p.drawRect(QRectF(cx - h, cy - w / 2, h * 2, w));
    p.end();
    return img;
}

QImage TextureRegistry::generateArrow(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, cy = size / 2.0;
    QPolygonF arrow;
    arrow << QPointF(cx, 2) << QPointF(cx + size / 3, cy)
          << QPointF(cx + size / 6, cy) << QPointF(cx + size / 6, size - 2)
          << QPointF(cx - size / 6, size - 2) << QPointF(cx - size / 6, cy)
          << QPointF(cx - size / 3, cy);
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawPolygon(arrow);
    p.end();
    return img;
}

QImage TextureRegistry::generateDebris(int size) {
    QImage img(size, size, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    QPainter p(&img);
    p.setRenderHint(QPainter::Antialiasing);
    double cx = size / 2.0, cy = size / 2.0, r = size / 3.0;
    QPolygonF debris;
    int pts = 8 + size % 4;
    for (int i = 0; i < pts; ++i) {
        double angle = (i * 360.0 / pts) * PI / 180.0;
        double mod = 1.0 + 0.3 * sin(angle * 3.7 + 1.2) * cos(angle * 2.3 + 0.8);
        double rr = r * mod;
        debris << QPointF(cx + rr * cos(angle), cy + rr * sin(angle));
    }
    p.setPen(Qt::NoPen);
    p.setBrush(QColor(255, 255, 255, 255));
    p.drawPolygon(debris);
    p.end();
    return img;
}
