import detectEthereumProvider from '@metamask/detect-provider';
import { providers } from 'ethers';
import { address } from './CheckedTypeUtils';

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

  const onChainChange = (_chainId: string) => {
    onEthereumConfigChange();
  };

  const ethereum = window.ethereum;
  ethereum.on('accountsChanged', onAccountChange);
  ethereum.on('chainChanged', onChainChange);

  return () => {
    ethereum.removeListener('accountsChanged', onAccountChange);
    ethereum.removeListener('chainChanged', onChainChange);
  };
};
