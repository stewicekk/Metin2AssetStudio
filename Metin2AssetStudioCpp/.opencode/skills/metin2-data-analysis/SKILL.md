# Metin2 Data Analysis Skill

## MSE Format Analysis
- Block-based text format with Group/List/Property/Row nodes
- Comments: // or # line prefixes
- Blocks delimited by { } on separate lines or inline
- Quoted strings preserve spaces and special chars
- File references: .mde (mesh), .gr2 (Granny), .dds/.tga/.bmp/.png/.jpg (texture)

## Compatibility Rules
- Colors: 0-255 integer range in export, 0.0-1.0 float in runtime
- Shape codes: POINT/CONE/BOX/SPHERE/DISC
- Blend: ADD=additive, NORMAL=alpha, MODULATE=multiply
- RotType: NONE(0)/SPIN(2)/RANDOM(4)
- AnimType: 1=loop, 2=once, 3=rand
- CoordType: WORLD/LOCAL
- Max particles capped at 2048 in export

## Export Order (MSE)
SystemName -> BirthRate -> MaxParticleCount -> LifeTime -> LifeTimeRnd -> BurstCount -> StartDelay -> Loop -> LifeCycle -> CoordType -> RotationType -> SpawnShape -> SpawnRadius -> Speed -> SpeedRnd -> Spread -> DirectionYaw -> DirectionPitch -> GravityVector -> AirResistance -> [GroundBounce/BounceFactor] -> [Attractor] -> SizeX -> SizeY -> SizeRnd -> RotMin -> RotMax -> RotSpeedMin -> RotSpeedMax -> BlendType -> TextureFileName -> TextureAnimType -> TextureAnimFrame -> TextureAnimFPS -> ColorKeyframeCount -> ColorKeyframes -> SizeCurveCount -> SizeCurves -> AlphaCurveCount -> AlphaCurves -> SpeedCurveCount -> SpeedCurves -> SpinCurveCount -> SpinCurves

## Data Pipeline
1. Parse .mse -> MseDocument (lossless AST)
2. Convert MseDocument -> Emitter structs (interpretation)
3. Edit Emitters in UI
4. Export Emitters -> MSE/EFF/MDE text
