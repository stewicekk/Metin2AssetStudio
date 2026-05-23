set(TEST_SOURCES
    test_main.cpp
    test_parser.cpp
    test_exporter.cpp
    test_simulation.cpp
)

add_executable(Metin2AssetStudioCpp_tests ${TEST_SOURCES})

target_link_libraries(Metin2AssetStudioCpp_tests PRIVATE
    Catch2::Catch2
    Qt6::Widgets
    Qt6::Core
    nlohmann_json::nlohmann_json
)

target_include_directories(Metin2AssetStudioCpp_tests PRIVATE
    ${CMAKE_SOURCE_DIR}/src
)

# Copy test fixtures
file(COPY ${CMAKE_SOURCE_DIR}/resources/test_fixtures DESTINATION ${CMAKE_CURRENT_BINARY_DIR})
