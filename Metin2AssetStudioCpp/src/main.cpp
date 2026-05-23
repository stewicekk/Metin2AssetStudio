#include <QApplication>
#include <QStyleFactory>
#include "ui/MainWindow.h"
#include "i18n/Translation.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    app.setApplicationName("Metin2 Asset Studio");
    app.setApplicationVersion("2.0.0");
    app.setOrganizationName("Metin2AssetStudio");
    app.setStyle(QStyleFactory::create("Fusion"));

    Translation::instance().setLanguage("en");

    MainWindow window;
    window.setWindowTitle("Metin2 Asset Studio C++ v2.0.0");
    window.resize(1600, 1000);
    window.showMaximized();

    return app.exec();
}
