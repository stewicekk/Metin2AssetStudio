set(SOURCES
    main.cpp
    core/Types.h
    core/MseParser.h core/MseParser.cpp
    core/MseExporter.h core/MseExporter.cpp
    core/EffExporter.h core/EffExporter.cpp
    core/MdeExporter.h core/MdeExporter.cpp
    core/ProjectManager.h core/ProjectManager.cpp
    runtime/SeededRandom.h runtime/SeededRandom.cpp
    runtime/ParticleSimulation.h runtime/ParticleSimulation.cpp
    runtime/TextureRegistry.h runtime/TextureRegistry.cpp
    runtime/CameraController.h runtime/CameraController.cpp
    runtime/ParticleRenderer.h runtime/ParticleRenderer.cpp
    utils/CurveUtils.h utils/CurveUtils.cpp
    utils/MathUtils.h utils/MathUtils.cpp
    i18n/Translation.h i18n/Translation.cpp
    ui/MainWindow.h ui/MainWindow.cpp
    ui/EmitterListPanel.h ui/EmitterListPanel.cpp
    ui/PropsPanel.h ui/PropsPanel.cpp
    ui/ViewportWidget.h ui/ViewportWidget.cpp
    ui/TimelinePanel.h ui/TimelinePanel.cpp
    ui/PresetsPanel.h ui/PresetsPanel.cpp
    ui/SceneSettingsPanel.h ui/SceneSettingsPanel.cpp
    ui/GizmoLayer.h ui/GizmoLayer.cpp
)

add_executable(Metin2AssetStudioCpp ${SOURCES})

target_link_libraries(Metin2AssetStudioCpp PRIVATE
    Qt6::Widgets
    Qt6::OpenGLWidgets
    Qt6::Core
    OpenGL::GL
    nlohmann_json::nlohmann_json
)

target_include_directories(Metin2AssetStudioCpp PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

if(WIN32)
    set_target_properties(Metin2AssetStudioCpp PROPERTIES WIN32_EXECUTABLE TRUE)
endif()
