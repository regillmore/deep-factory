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
10. Build a dense metadata-derived terrain connectivity lookup (connectivity-group IDs + material-tag bitmasks) and switch `areTerrainAutotileNeighborsConnected` to it for mesher hot-path adjacency checks, with unit tests.
