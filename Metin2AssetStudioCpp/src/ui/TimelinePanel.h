#pragma once
#include <QWidget>
#include <QPushButton>
#include <QSlider>
#include <QLabel>

class TimelinePanel : public QWidget {
    Q_OBJECT
public:
    explicit TimelinePanel(QWidget* parent = nullptr);
    void setPlaying(bool p);
    void setTime(double t);
    double time() const { return curTime; }
signals:
    void playPauseToggled(bool playing);
    void timeChanged(double time);
    void exportMseRequested();
    void exportEffRequested();
    void exportMdeRequested();
    void importRequested();
    void stopRequested();
private:
    void setupUI();
    QPushButton *btnPlay, *btnStop;
    QSlider* timeSlider;
    QLabel *timeLabel, *statusLabel;
    QPushButton *btnMse, *btnEff, *btnMde, *btnImport;
    bool isPlaying = false;
    double curTime = 0;
};
