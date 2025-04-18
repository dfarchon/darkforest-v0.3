import { address } from './CheckedTypeUtils';
import { EthAddress } from '../_types/global/GlobalTypes';
import { contractAddress as localContractAddress } from './local_contract_addr';
import { contractAddress as prodContractAddress } from './prod_contract_addr';

// Interface defining the structure of a chain configuration
export interface ChainConfig {
    name: string;          // Human-readable name of the chain
    chainId: number;       // Numeric chain ID
    contractAddress: EthAddress;  // Dark Forest contract address on this chain
    etherscanUrl: string;  // Block explorer URL
    rpcUrl?: string;       // Optional custom RPC endpoint
    isTestnet: boolean;    // Whether this is a testnet or mainnet
}

// All supported chains configuration
const CHAIN_CONFIGS: Record<string, ChainConfig> = {
    // Local development chain
    localhost: {
        name: 'Localhost',
        chainId: 31337, // Hardhat local chain ID
        contractAddress: address(localContractAddress),
        etherscanUrl: 'https://localhost',
        isTestnet: true,
    },

    // Holesky testnet
    holesky: {
        name: 'Holesky',
        chainId: 17000,
        contractAddress: address(prodContractAddress),
        etherscanUrl: 'https://holesky.etherscan.io',
        isTestnet: true,
    },
    // Add more chains as needed
};

// LocalStorage key for custom chains
const CUSTOM_CHAINS_KEY = 'df_custom_chains';

// Get all chains (default + custom)
export function getAllChains(): Record<string, ChainConfig> {
    const customChains = getCustomChains();
    return { ...CHAIN_CONFIGS, ...customChains };
}

// Get a chain config by key
export function getChainConfig(key: string): ChainConfig | undefined {
    return getAllChains()[key];
}

// Get chain config by chain ID
export function getChainConfigByChainId(chainId: number): ChainConfig | undefined {
    const allChains = getAllChains();
    return Object.values(allChains).find(chain => chain.chainId === chainId);
}

// Add or update a custom chain
export function setCustomChain(key: string, config: ChainConfig): void {
    const customChains = getCustomChains();
    customChains[key] = config;
    localStorage.setItem(CUSTOM_CHAINS_KEY, JSON.stringify(customChains));
}

// Remove a custom chain
export function removeCustomChain(key: string): void {
    const customChains = getCustomChains();
    delete customChains[key];
    localStorage.setItem(CUSTOM_CHAINS_KEY, JSON.stringify(customChains));
}

// Get custom chains from localStorage
function getCustomChains(): Record<string, ChainConfig> {
    try {
        const stored = localStorage.getItem(CUSTOM_CHAINS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error loading custom chains:', error);
        return {};
    }
}

// Get the default chain to use based on environment
export function getDefaultChainKey(): string {
    return process.env.NODE_ENV === 'production' ? 'holesky' : 'localhost';
}

// Get all available chain keys
export function getAllChainKeys(): string[] {
    return Object.keys(CHAIN_CONFIGS);
}

// Get all chain configurations
export function getAllChainConfigs(): Record<string, ChainConfig> {
    return CHAIN_CONFIGS;
} 