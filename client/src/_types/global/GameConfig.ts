/**
 * Represents the game configuration structure used for contract deployment and initialization
 * Based on eth/config/gameConfig.json
 */
export interface GameConfig {
    // Admin settings
    adminAddress: string;
    whitelistEnabled: boolean;
    paused: boolean;

    // Game mechanics
    DISABLE_ZK_CHECK: boolean;
    PERLIN_THRESHOLD: number;
    GLOBAL_SPEED_IN_HUNDRETHS: number;
    PLANET_RARITY: number;
    ENERGY_PER_SECOND: number;
    ENERGY_CAP: number;
    TRADING_POST_RARITY: number;
    SILVER_RARITY: number;
    TRADING_POST_BARBARIANS: number;

    // Planet configuration
    planetTypeThresholds: number[];
    planetLevelThresholds: number[];

    // Game timing
    gameEndTimestamp: number;

    // Radius constants
    target4RadiusConstant: number;
    target5RadiusConstant: number;
}

/**
 * Default game configuration values
 * Based on eth/config/gameConfig.json
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
    adminAddress: "0x0000000000000000000000000000000000000000",
    whitelistEnabled: false,
    paused: false,
    DISABLE_ZK_CHECK: false,
    PERLIN_THRESHOLD: 18,
    GLOBAL_SPEED_IN_HUNDRETHS: 75,
    PLANET_RARITY: 16384,
    ENERGY_PER_SECOND: 100,
    ENERGY_CAP: 1000,
    TRADING_POST_RARITY: 16,
    SILVER_RARITY: 4,
    TRADING_POST_BARBARIANS: 50,
    planetTypeThresholds: [65536, 0],
    planetLevelThresholds: [16777216, 4194256, 1048516, 262081, 65472, 16320, 4032, 960],
    gameEndTimestamp: 4911112800,
    target4RadiusConstant: 50,
    target5RadiusConstant: 12
}; 