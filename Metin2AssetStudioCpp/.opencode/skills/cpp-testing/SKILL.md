# C++ Testing Skill

## Framework: Catch2
- Header-only, use `#include <catch2/catch_all.hpp>`
- TEST_CASE macros with descriptive names
- REQUIRE/CHECK for assertions
- Approx() for floating-point comparisons

## Test Categories

### Parser Tests (tests/test_parser.cpp)
- Parse valid MSE, check diagnostics empty
- Handle comments // and #, blank lines
- Report unbalanced braces
- Handle inline { block syntax
- Extract file dependencies (.dds, .gr2)
- readNumberProperty with fallbacks
- List block parsing
- Quoted strings with spaces
- Roundtrip: parse → export → re-parse
- splitValues edge cases

### Exporter Tests (tests/test_exporter.cpp)
- Build MSE with all emitter fields
- Verify shape codes
- Verify color key integer conversion (0-255)
- Build EFF with CEffectData wrapper
- Build MDE with bone mapping + bounding radius
- ProjectManager JSON serialize/deserialize
- Invalid JSON error handling

### Simulation Tests (tests/test_simulation.cpp)
- SeededRandom deterministic output
- Range bounds [min, max]
- Centered distribution mean ≈ 0
- createParticles pool allocation
- resetRuntime state
- spawnParticle initial values
- updateRuntime age increment
- updateRuntime death at life
- Max particle cap enforcement
