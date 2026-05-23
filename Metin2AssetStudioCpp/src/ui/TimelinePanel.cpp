#include "TimelinePanel.h"
#include <QHBoxLayout>

TimelinePanel::TimelinePanel(QWidget* parent)
    : QWidget(parent)
{
    setupUI();
}

void TimelinePanel::setupUI()
{
    auto* layout = new QHBoxLayout(this);
    layout->setContentsMargins(4, 4, 4, 4);
    layout->setSpacing(4);

    btnPlay = new QPushButton(QString::fromUtf8("\xE2\x96\xB6"), this);
    btnPlay->setToolTip(tr("Play / Pause"));
    btnPlay->setFixedWidth(32);
    layout->addWidget(btnPlay);

    btnStop = new QPushButton(QString::fromUtf8("\xE2\x8F\xB9"), this);
    btnStop->setToolTip(tr("Stop"));
    btnStop->setFixedWidth(32);
    layout->addWidget(btnStop);

    timeSlider = new QSlider(Qt::Horizontal, this);
    timeSlider->setRange(0, 1000);
    timeSlider->setValue(0);
    timeSlider->setToolTip(tr("Timeline (0-10s)"));
    layout->addWidget(timeSlider, 1);

    timeLabel = new QLabel("0.00s", this);
    timeLabel->setMinimumWidth(50);
    timeLabel->setAlignment(Qt::AlignCenter);
    layout->addWidget(timeLabel);

    layout->addSpacing(8);

    btnMse = new QPushButton(tr("MSE"), this);
    btnMse->setToolTip(tr("Export MSE"));
    btnMse->setFixedWidth(36);
    layout->addWidget(btnMse);

    btnEff = new QPushButton(tr("EFF"), this);
    btnEff->setToolTip(tr("Export EFF"));
    btnEff->setFixedWidth(36);
    layout->addWidget(btnEff);

    btnMde = new QPushButton(tr("MDE"), this);
    btnMde->setToolTip(tr("Export MDE"));
    btnMde->setFixedWidth(36);
    layout->addWidget(btnMde);

    btnImport = new QPushButton(tr("Imp"), this);
    btnImport->setToolTip(tr("Import"));
    btnImport->setFixedWidth(36);
    layout->addWidget(btnImport);

    layout->addStretch();

    statusLabel = new QLabel(this);
    statusLabel->setAlignment(Qt::AlignRight | Qt::AlignVCenter);
    layout->addWidget(statusLabel);

    connect(btnPlay, &QPushButton::clicked, this, [this]() {
        isPlaying = !isPlaying;
        btnPlay->setText(isPlaying
            ? QString::fromUtf8("\xE2\x8F\xB8")
            : QString::fromUtf8("\xE2\x96\xB6"));
        emit playPauseToggled(isPlaying);
    });

    connect(btnStop, &QPushButton::clicked, this, [this]() {
        isPlaying = false;
        btnPlay->setText(QString::fromUtf8("\xE2\x96\xB6"));
        setTime(0);
        emit stopRequested();
    });

    connect(timeSlider, &QSlider::valueChanged, this, [this](int val) {
        curTime = (static_cast<double>(val) / 1000.0) * 10.0;
        timeLabel->setText(QString("%1s").arg(curTime, 0, 'f', 2));
        emit timeChanged(curTime);
    });

    connect(btnMse, &QPushButton::clicked, this, &TimelinePanel::exportMseRequested);
    connect(btnEff, &QPushButton::clicked, this, &TimelinePanel::exportEffRequested);
    connect(btnMde, &QPushButton::clicked, this, &TimelinePanel::exportMdeRequested);
    connect(btnImport, &QPushButton::clicked, this, &TimelinePanel::importRequested);
}

void TimelinePanel::setPlaying(bool p)
{
    isPlaying = p;
    btnPlay->setText(isPlaying
        ? QString::fromUtf8("\xE2\x8F\xB8")
        : QString::fromUtf8("\xE2\x96\xB6"));
}

void TimelinePanel::setTime(double t)
{
    curTime = t;
    timeSlider->blockSignals(true);
    int val = static_cast<int>((t / 10.0) * 1000.0);
    timeSlider->setValue(val);
    timeSlider->blockSignals(false);
    timeLabel->setText(QString("%1s").arg(t, 0, 'f', 2));
}
