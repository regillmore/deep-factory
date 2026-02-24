# Next incremental tasks

1. Replace placeholder atlas with authored asset pipeline and tile metadata.
2. Add debug tile edit brush (place/break) with hovered-tile cursor highlight.
3. Implement collision grid + simple player controller.
4. Add water/lava tile animation and autotiling rules.
5. Introduce basic lighting (sunlight + torch flood fill).
6. Add entity layer and interpolation between fixed updates.
7. Add save/load format for chunk snapshots.
8. Prepare networking scaffolding (state diff messages, interest management).
9. Add a main menu shell and move debug overlay to a UI toggle.
10. Build a dense metadata-derived tile property lookup (bitflags + liquid kind table) and switch `tileMetadata` helper accessors to it for hot-path collision/lighting queries, with unit tests.
