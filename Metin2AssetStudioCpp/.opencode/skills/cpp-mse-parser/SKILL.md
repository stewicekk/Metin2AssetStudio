# C++ MSE Parser Skill

## Format Knowledge
- MSE = Metin2 particle system text format
- Block types: Group, List, Property, Row, Comment, Blank
- Comments: // or # line prefix
- Blocks: { } on separate lines or inline after Group/List keyword
- Lists contain Row children, Groups contain mixed children

## Parser API (src/core/MseParser)
- `MseParser::parse(text)` → MseDocument with root block tree
- `MseParser::exportMse(node, indent)` → reconstruct text
- `MseParser::findChild(node, type, name)` → tree traversal
- `MseParser::readNumberProperty(node, name, fallback)` → parse
- `MseParser::readListNumber(node, name, fallback)` → parse list

## Export API (src/core/MseExporter, src/core/EffExporter)
- `MseExporter::buildMse(emitters, opts)` → MSE text
- `EffExporter::buildEff(emitters, opts)` → CEffectData text
- `EffExporter::buildMde(emitters, opts)` → CEffectMesh text

## Compatibility
- Shape codes: point→POINT, cone→CONE, box→BOX, sphere/vol→SPHERE, ring/disc→DISC
- Colors: 0-255 integer in export, 0.0-1.0 float internal
- Blend: Alpha(0)/Add(1)/Modulate(2) in EFF; ALPHA/ADD/MODULATE in MSE
