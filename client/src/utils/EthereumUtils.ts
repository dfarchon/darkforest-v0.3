import detectEthereumProvider from '@metamask/detect-provider';
import { providers } from 'ethers';
import { address } from './CheckedTypeUtils';
import { getChainConfigByChainId, getDefaultChainKey, getChainConfig } from './chain-config';

export const getProvider = async () =>
  new providers.Web3Provider(await detectEthereumProvider() as providers.ExternalProvider);

export const getAddress = async () =>
  address(await (await getProvider()).getSigner().getAddress());

const onEthereumConfigChange = () => {
  location.reload();
};

export const handleEthereumConfigChanges = () => {
  if (!window.ethereum) {
    return () => { };
  }
  const onAccountChange = (_accounts: Array<string>) => {
    onEthereumConfigChange();
  };

  const onChainChange = async (chainId: string) => {
    // Convert chainId from hex to decimal (Metamask provides hex chainId)
    const numericChainId = parseInt(chainId, 16);

    // Get the supported chain config
    const defaultChainKey = getDefaultChainKey();
    const supportedChainConfig = getChainConfig(defaultChainKey);

    // If the chain changed to an unsupported network, reload the page
    // to show the incompatibility warning
    if (!supportedChainConfig || numericChainId !== supportedChainConfig.chainId) {
      onEthereumConfigChange();
    }
  };

  const ethereum = window.ethereum;
  ethereum.on('accountsChanged', onAccountChange);
  ethereum.on('chainChanged', onChainChange);

  return () => {
    ethereum.removeListener('accountsChanged', onAccountChange);
    ethereum.removeListener('chainChanged', onChainChange);
  };
};
