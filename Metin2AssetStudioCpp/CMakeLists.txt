cmake_minimum_required(VERSION 3.25)
project(Metin2AssetStudioCpp VERSION 2.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt6 REQUIRED COMPONENTS Widgets OpenGLWidgets Core)
find_package(OpenGL REQUIRED)
find_package(nlohmann_json REQUIRED)
find_package(Catch2 QUIET)

add_subdirectory(src)

if(Catch2_FOUND)
    add_subdirectory(tests)
endif()
