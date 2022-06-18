import React, { useEffect, useState } from 'react';
import { networkParams } from '../components/networks';
import { toHex, truncateAddress } from '../components/utils';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { providerOptions } from '../components/providerOptions';

let web3Modal;

if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions, // required
  });
}

export default function Home() {
  const [provider, setProvider] = useState();
  const [library, setLibrary] = useState();
  const [account, setAccount] = useState();
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [chainId, setChainId] = useState();
  const [network, setNetwork] = useState();
  const [message, setMessage] = useState('');
  const [signedMessage, setSignedMessage] = useState('');
  const [verified, setVerified] = useState();

  const connectWallet = async () => {
    try {
      const provider = await web3Modal.connect();
      const library = new ethers.providers.Web3Provider(provider);
      const accounts = await library.listAccounts();
      const network = await library.getNetwork();
      setProvider(provider);
      setLibrary(library);
      if (accounts) setAccount(accounts[0]);
      setChainId(network.chainId);
    } catch (error) {
      setError(error);
    }
  };

  const handleNetwork = (e) => {
    const id = e.target.value;
    setNetwork(Number(id));
  };

  const handleInput = (e) => {
    const msg = e.target.value;
    setMessage(msg);
  };

  const switchNetwork = async () => {
    try {
      await library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex(network) }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: 'wallet_addEthereumChain',
            params: [networkParams[toHex(network)]],
          });
        } catch (error) {
          setError(error);
        }
      }
    }
  };

  const signMessage = async () => {
    if (!library) return;
    try {
      const signature = await library.provider.request({
        method: 'personal_sign',
        params: [message, account],
      });
      setSignedMessage(message);
      setSignature(signature);
    } catch (error) {
      setError(error);
    }
  };

  const verifyMessage = async () => {
    if (!library) return;
    try {
      const verify = await library.provider.request({
        method: 'personal_ecRecover',
        params: [signedMessage, signature],
      });
      setVerified(verify === account.toLowerCase());
    } catch (error) {
      setError(error);
    }
  };

  const refreshState = () => {
    setAccount();
    setChainId();
    setNetwork('');
    setMessage('');
    setSignature('');
    setVerified(undefined);
  };

  const disconnect = async () => {
    await web3Modal.clearCachedProvider();
    refreshState();
  };

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts) => {
        console.log('accountsChanged', accounts);
        if (accounts) setAccount(accounts[0]);
      };

      const handleChainChanged = (_hexChainId) => {
        setChainId(_hexChainId);
      };

      const handleDisconnect = () => {
        console.log('disconnect', error);
        disconnect();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
          provider.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [provider]);

  return (
    <>
      <div className='flex min-h-screen flex-col items-center justify-center'>
        <h4 className='text-6xl tracking-widest  items-center mx-auto flex flex-col leading-tight text-center'>
          Wallet <br />
          Connect
        </h4>

        <p className='pt-4 text-xl p-6 text-center'>
          This is a sample of wallet connection and interraction page
        </p>

        <div className=''>
          {!account ? (
            <button
              className='bg-blue-400 p-3 mt-10 px-10 rounded-3xl text-white font-bold'
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          ) : (
            <button
              className='bg-red-400 p-3 mt-10 px-10 rounded-3xl text-white font-bold'
              onClick={disconnect}
            >
              Disconnect
            </button>
          )}
        </div>
        <div className='flex justify-between mx-auto space-x-6 pt-6'>
          Connected Wallet:
          {account ? (
            <span className='text-green-600 pl-6 pb-4'>
              {truncateAddress(account)}
            </span>
          ) : (
            <span className='text-red-400 pl-6 pb-4'>
              Please connect your wallet
            </span>
          )}
        </div>
        {account && (
          <span className='pb-4'>
            Network ID:{' '}
            {chainId == '0x1' ? (
              <span className='text-green-500'>ETH Mainnet</span>
            ) : (
              `${chainId} please switch to mainnet`
            )}
          </span>
        )}
        {account && (
          <>
            <select
              placeholder='Select network'
              className='p-3 px-16 items-start mb-4 rounded-md bg-gray-200'
              onChange={handleNetwork}
            >
              <option value='1'>Mainnet</option>
              {/* <option value='3'>Ropsten</option> */}
              <option value='4'>Rinkeby</option>
              {/* <option value='42'>Kovan</option>
              <option value='1666600000'>Harmony</option>
              <option value='42220'>Celo</option> */}
            </select>
            <button
              className='bg-blue-400 text-sm rounded-3xl px-6 py-1 text-white'
              onClick={switchNetwork}
              isDisabled={!network}
            >
              Change Network
            </button>
          </>
        )}
      </div>
    </>
  );
}
