# Dark Forest Game Configuration

This document describes the configuration parameters in `gameConfig.json`.

## Basic Settings

- `adminAddress`: Admin wallet address
- `whitelistEnabled`: Whether the whitelist is enabled
- `paused`: Whether the game is paused
- `DISABLE_ZK_CHECK`: Whether to disable ZK proof verification

## Game Parameters

- `PERLIN_THRESHOLD`: Threshold for Perlin noise generation (default: 18)
- `GLOBAL_SPEED_IN_HUNDRETHS`: Game speed (75 = 0.75x speed)
- `gameEndTimestamp`: Unix timestamp for game end

## Resource Settings

- `ENERGY_PER_SECOND`: Energy generation rate per second
- `ENERGY_CAP`: Maximum energy capacity
- `SILVER_RARITY`: Rarity factor for silver resource

## Planet Generation

- `PLANET_RARITY`: Rarity factor for planet generation
- `TRADING_POST_RARITY`: Rarity factor for trading post generation
- `TRADING_POST_BARBARIANS`: Number of barbarians in trading posts

## Planet Type Thresholds

Array `planetTypeThresholds` determines the probability of different planet types:

- `[65536, 0]`:
  - 65536: Trading post threshold
  - 0: Regular planet threshold

## Planet Level Thresholds

Array `planetLevelThresholds` determines the probability of different planet levels (0-7):

- Level 0: 16777216
- Level 1: 4194256
- Level 2: 1048516
- Level 3: 262081
- Level 4: 65472
- Level 5: 16320
- Level 6: 4032
- Level 7: 960

## World Radius Settings

- `target4RadiusConstant`: Constant for target4 radius calculation
- `target5RadiusConstant`: Constant for target5 radius calculation
