# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.0] - 2024-03-21

### Fixed
- Pomodoro timer popup functionality now works correctly while progress bar advances
- Improved z-index layering for proper UI element stacking
- Preserved popup HTML during timer display updates

### Added
- Documentation for Pomodoro timer feature
- Changelog to track project updates

### Technical
- Enhanced DOM manipulation to maintain popup structure
- Implemented proper z-index hierarchy:
  - Time ring: z-index 1
  - Session info: z-index 20
  - Popup: z-index 100
- Added pointer-events management for proper click handling 