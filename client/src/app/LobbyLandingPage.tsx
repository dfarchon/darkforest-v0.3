import React, { useState, useEffect, useRef } from 'react';
import GameManager from '../api/GameManager';
import GameUIManagerContext from './board/GameUIManagerContext';
import GameUIManager, { GameUIManagerEvent } from './board/GameUIManager';
import AbstractGameManager from '../api/AbstractGameManager';
import {
    doesBrowserHaveAccountData,
    unsupportedFeatures,
    Incompatibility,
    enableEthereum,
} from '../api/BrowserChecks';
import {
    isAddressWhitelisted,
    submitWhitelistKey,
    submitInterestedEmail,
    submitPlayerEmail,
    EmailResponse,
} from '../api/UtilityServerAPI';
import {
    getAddress,
    handleEthereumConfigChanges,
} from '../utils/EthereumUtils';
import _ from 'lodash';
import TerminalEmitter, {
    TerminalTextStyle,
    TerminalEvent,
} from '../utils/TerminalEmitter';
import Terminal from './Terminal';
import { useHistory } from 'react-router-dom';
import ModalWindow from './ModalWindow';
import GameWindow from './GameWindow';
import {
    Wrapper,
    Hidden,
    GameWindowWrapper,
} from './GameLandingPageComponents';
import UIEmitter, { UIEmitterEvent } from '../utils/UIEmitter';
import BlueButton from '../components/BlueButton';
import styled from 'styled-components';
import { GameConfig, DEFAULT_GAME_CONFIG } from '../_types/global/GameConfig';
import { getChainConfig, getDefaultChainKey } from '../utils/chain-config';
import GameConfigPanel from '../components/GameConfigPanel';

enum InitState {
    NONE,
    COMPATIBILITY_CHECKS_PASSED,
    DEPLOY_CONTRACT,
    ASKING_HAS_WHITELIST_KEY,
    ASKING_WAITLIST_EMAIL,
    ASKING_WHITELIST_KEY,
    ASKING_PLAYER_EMAIL,
    FETCHING_ETH_DATA,
    ASK_ADD_ACCOUNT,
    ADD_ACCOUNT,
    NO_HOME_PLANET,
    SEARCHING_FOR_HOME_PLANET,
    ALL_CHECKS_PASS,
    COMPLETE,
    TERMINATED,
}

// doing it this way because I plan to add more later
enum ModalState {
    NONE,
    GAS_PRICES,
}

export enum InitRenderState {
    NONE,
    LOADING,
    COMPLETE,
}

// Main page layout container
const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
`;

// Terminal area - top 1/3 of the screen
const TerminalContainer = styled.div`
  border: 2px solid #00ADE1;
  border-radius: 4px;
  margin: 10px;
  box-shadow: 0 0 10px rgba(0, 173, 225, 0.3);
  height: 33vh;
  overflow: hidden;
  position: relative;
  padding: 10px;
`;

const TerminalInnerWrapper = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  overflow: hidden;
`;

// Config panel area - bottom 2/3 of the screen
const ConfigPanelContainer = styled.div`
  border: 2px solid #00ADE1;
  border-radius: 4px;
  margin: 10px;
  box-shadow: 0 0 10px rgba(0, 173, 225, 0.3);
  height: 63vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// Content area for the config panel
const ConfigPanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 25px;
  color: white;
`;

// Button container at the bottom of config panel
const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  border-top: 1px solid rgba(0, 173, 225, 0.3);
`;

const GameLink = styled.div`
  margin: 10px 0;
  padding: 10px;
  background-color: rgba(0, 173, 225, 0.1);
  border-radius: 4px;
  word-break: break-all;
  font-family: monospace;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 173, 225, 0.2);
  }
`;

export default function LobbyLandingPage(_props: { replayMode: boolean }) {
    const history = useHistory();
    /* terminal stuff */
    let initState = InitState.NONE;
    const [initRenderState, setInitRenderState] = useState<InitRenderState>(
        InitRenderState.NONE
    );
    useEffect(() => {
        const uiEmitter = UIEmitter.getInstance();
        uiEmitter.emit(UIEmitterEvent.UIChange);
    }, [initRenderState]);

    const [modal, setModal] = useState<ModalState>(ModalState.NONE);
    const modalClose = () => setModal(ModalState.NONE);

    const gameUIManagerRef = useRef<GameUIManager | null>(null);
    const [deployedContractAddress, setDeployedContractAddress] = useState<string | null>(null);
    const [gameConfig, setGameConfig] = useState<GameConfig | undefined>(undefined);

    // Disable body scrolling
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        return () => {
            document.body.style.overflow = '';
            document.body.style.height = '';
            document.body.style.margin = '';
            document.body.style.padding = '';
        };
    }, []);

    const getUserInput = async () => {
        const terminalEmitter = TerminalEmitter.getInstance();
        terminalEmitter.enableUserInput();
        const ret: string = await new Promise<string>((resolve) => {
            terminalEmitter.once(TerminalEvent.UserEnteredInput, resolve);
        });
        terminalEmitter.disableUserInput();

        return ret.trim();
    };

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const animEllipsis = async () => {
        const terminalEmitter = TerminalEmitter.getInstance();
        const delay = 0; // TODOPR 250
        for (const _i in _.range(3)) {
            await wait(delay).then(() => terminalEmitter.print('.'));
        }
        await wait(delay * 1.5);
        return;
    };

    const advanceStateFromNone = async () => {
        const terminalEmitter = TerminalEmitter.getInstance();

        const lastUpdated = localStorage.getItem('lastUpdated');
        if (lastUpdated) {
            const diff = Date.now() - parseInt(lastUpdated);
            // 10 min
            if (diff < 1000 * 60 * 10)
                terminalEmitter.emit(TerminalEvent.SkipAllTyping);
        }
        terminalEmitter.shell('df init');
        terminalEmitter.println('Initializing Dark Forest...');

        terminalEmitter.print('Loading zkSNARK proving key');
        await animEllipsis();
        terminalEmitter.print(' ');
        terminalEmitter.println(
            'Proving key loaded. (14.3MB)',
            TerminalTextStyle.Blue
        );

        terminalEmitter.print('Verifying zkSNARK params');
        await animEllipsis();
        terminalEmitter.print(' ');
        terminalEmitter.println(
            '28700 constraints verified.',
            TerminalTextStyle.Blue
        );

        terminalEmitter.print('Connecting to Ethereum network');
        await animEllipsis();
        terminalEmitter.print(' ');
        terminalEmitter.println('Connected to Ethereum.', TerminalTextStyle.Blue);

        terminalEmitter.print('Installing flux capacitor');
        await animEllipsis();
        terminalEmitter.print(' ');
        terminalEmitter.println(
            'Flux capacitor installed.',
            TerminalTextStyle.Blue
        );

        terminalEmitter.println('Initialization complete.');
        terminalEmitter.newline();
        const issues = await unsupportedFeatures();
        handleEthereumConfigChanges(); // this reloads the page if network/account changes, so no cleanup needed

        // $ df check
        terminalEmitter.shell('df check');

        terminalEmitter.print('Checking compatibility');
        await animEllipsis();
        terminalEmitter.print(' ');
        terminalEmitter.println(
            'Initiating (6) compatibility checks.',
            TerminalTextStyle.Blue
        );

        terminalEmitter.print('Checking if device is compatible');
        await animEllipsis();
        terminalEmitter.print(' ');
        if (issues.includes(Incompatibility.MobileOrTablet)) {
            terminalEmitter.println(
                'ERROR: Mobile or tablet device detected. Please use desktop.',
                TerminalTextStyle.Red
            );
        } else {
            terminalEmitter.println(
                'Desktop detected. Device OK.',
                TerminalTextStyle.White
            );
        }

        terminalEmitter.print('Checking if IndexedDB is present');
        await animEllipsis();
        terminalEmitter.print(' ');
        if (issues.includes(Incompatibility.NoIDB)) {
            terminalEmitter.println(
                'ERROR: IndexedDB not found. Try using a different browser.',
                TerminalTextStyle.Red
            );
        } else {
            terminalEmitter.println('IndexedDB detected.', TerminalTextStyle.White);
        }

        terminalEmitter.print('Checking if browser is supported');
        await animEllipsis();
        terminalEmitter.print(' ');
        if (issues.includes(Incompatibility.UnsupportedBrowser)) {
            terminalEmitter.println(
                'ERROR: Browser unsupported. Try Brave, Firefox, or Chrome.',
                TerminalTextStyle.Red
            );
        } else {
            terminalEmitter.println('Browser Supported.', TerminalTextStyle.White);
        }

        terminalEmitter.print('Checking for Metamask');
        await animEllipsis();
        terminalEmitter.print(' ');
        if (issues.includes(Incompatibility.NoMetamaskInstalled)) {
            terminalEmitter.println(
                'ERROR: Could not find Metamask. Please install Metamask.',
                TerminalTextStyle.Red
            );
        } else {
            terminalEmitter.println('Metamask found.', TerminalTextStyle.White);
        }

        terminalEmitter.print('Checking if Ethereum is enabled');
        await animEllipsis();
        terminalEmitter.print(' ');
        if (issues.includes(Incompatibility.NotLoggedInOrEnabled)) {
            terminalEmitter.print(
                'ERROR: Ethereum is not enabled. ',
                TerminalTextStyle.Red
            );
            terminalEmitter.printLink(
                'Click here to enable Ethereum',
                enableEthereum.bind(this),
                TerminalTextStyle.Red
            );
            terminalEmitter.println('.', TerminalTextStyle.Red);
        } else {
            terminalEmitter.println('Ethereum enabled.', TerminalTextStyle.White);
        }

        if (issues.includes(Incompatibility.UnsupportedNetwork)) {
            const defaultChainKey = getDefaultChainKey();
            const chainConfig = getChainConfig(defaultChainKey);
            const networkName = chainConfig ? chainConfig.name : 'supported network';

            terminalEmitter.print(`Connecting to ${networkName}`);
            await animEllipsis();
            terminalEmitter.print(' ');
            terminalEmitter.println(
                `ERROR: ${networkName} not selected. Please select ${networkName} and try again.`,
                TerminalTextStyle.Red
            );
        } else {
            terminalEmitter.print('Checking Ethereum Mainnet');
            await animEllipsis();
            terminalEmitter.print(' ');
            terminalEmitter.printLink(
                'ERROR: Gas prices too high!',
                () => setModal(ModalState.GAS_PRICES),
                TerminalTextStyle.White
            );
            terminalEmitter.newline();

            const defaultChainKey = getDefaultChainKey();
            const chainConfig = getChainConfig(defaultChainKey);
            const networkName = chainConfig ? chainConfig.name : 'supported network';

            terminalEmitter.print(`Falling back to ${networkName}`);
            await animEllipsis();
            terminalEmitter.print(' ');
            terminalEmitter.println(`${networkName} selected.`, TerminalTextStyle.White);
        }

        if (issues.length > 0) {
            terminalEmitter.print(
                `${issues.length.toString()} errors found. `,
                TerminalTextStyle.Red
            );
            terminalEmitter.println('Please resolve them and refresh the page.');
        } else {
            terminalEmitter.println('All checks passed.', TerminalTextStyle.Green);
            terminalEmitter.newline();
            initState = InitState.COMPATIBILITY_CHECKS_PASSED;
        }
    };

    const advanceStateFromCompatibilityPassed = async () => {
        const terminalEmitter = TerminalEmitter.getInstance();
        terminalEmitter.shell('df log');

        const address = await getAddress();

        terminalEmitter.print('Your address is ');

        terminalEmitter.print(address, TerminalTextStyle.White);
        terminalEmitter.println('');

        const newGameManager: AbstractGameManager = await GameManager.create();
        const gameUIManager = GameUIManager.create(newGameManager);

        terminalEmitter.println('Connected to contract.', TerminalTextStyle.Green);
        terminalEmitter.println('');
        gameUIManagerRef.current = gameUIManager;

        initState = InitState.DEPLOY_CONTRACT;
    };

    const getGameLink = (contractAddress: string): string => {
        return `${window.location.origin}/game1/${contractAddress}`;
    };

    const deployContract = async () => {
        const terminalEmitter = TerminalEmitter.getInstance();
        const gameUIManager = gameUIManagerRef.current;
        if (!gameUIManager) {
            return;
        }

        terminalEmitter.println('Deploying contract... Please confirm transaction in your wallet', TerminalTextStyle.White);
        try {
            const contractAddress = await gameUIManager.deployContract(gameConfig);
            setDeployedContractAddress(contractAddress);

            terminalEmitter.println('Contract address: ' + contractAddress, TerminalTextStyle.White);
            terminalEmitter.println('Contract deployed successfully!', TerminalTextStyle.Green);

            // Generate and display game link in terminal
            const gameLink = getGameLink(contractAddress);
            terminalEmitter.println('');
            terminalEmitter.println('Game link created:', TerminalTextStyle.Sub);
            terminalEmitter.printLink(gameLink, () => window.open(gameLink, '_blank'), TerminalTextStyle.Blue);
            terminalEmitter.println('');
            terminalEmitter.println('Click the link above or use the "Open Game" button to start playing!', TerminalTextStyle.White);
        } catch (error) {
            console.error('Contract deployment failed:', error);
            terminalEmitter.println(`Contract deployment failed: ${error.message.slice(0, 100)}`, TerminalTextStyle.Red);
        }
    };

    const navigateToGame = () => {
        if (deployedContractAddress) {
            window.open(getGameLink(deployedContractAddress), '_blank');
        }
    };

    const copyToClipboard = () => {
        if (deployedContractAddress) {
            const gameLink = getGameLink(deployedContractAddress);
            navigator.clipboard.writeText(gameLink);

            const terminalEmitter = TerminalEmitter.getInstance();
            terminalEmitter.println('Game link copied to clipboard!', TerminalTextStyle.Green);
        }
    };

    const handleSaveSettings = (config: GameConfig) => {
        setGameConfig(config);
    };

    const resetSettings = () => {
        setGameConfig(DEFAULT_GAME_CONFIG);
        const terminalEmitter = TerminalEmitter.getInstance();
        terminalEmitter.println('Settings reset to defaults.', TerminalTextStyle.Green);
    };

    const advanceState = async () => {
        if (initState === InitState.NONE) {
            await advanceStateFromNone();

            // Only continue to the next state if there are no wallet issues
            const issues = await unsupportedFeatures();
            if (issues.length === 0) {
                advanceState(); // Only recursively call when no issues
            }
        } else if (initState === InitState.COMPATIBILITY_CHECKS_PASSED) {
            await advanceStateFromCompatibilityPassed();
            advanceState();
        }
    };

    useEffect(() => {
        advanceState();

        return () => {
            if (gameUIManagerRef.current) {
                gameUIManagerRef.current.destroy();
                gameUIManagerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Wrapper initRender={initRenderState}>
            {modal === ModalState.GAS_PRICES && (
                <ModalWindow close={modalClose}>
                    <img
                        style={{ margin: '0 auto' }}
                        src={'/public/img/toodamnhigh.jpg'}
                    />
                </ModalWindow>
            )}

            <PageLayout>
                {/* Terminal section - top 1/3 */}
                <TerminalContainer>
                    <TerminalInnerWrapper>
                        <Terminal />
                    </TerminalInnerWrapper>
                </TerminalContainer>

                {/* Configuration panel - bottom 2/3 */}
                <ConfigPanelContainer>
                    {/* Configuration panel content area - replace placeholder with GameConfigPanel */}
                    <ConfigPanelContent>
                        <GameConfigPanel
                            onSaveConfig={handleSaveSettings}
                            initialConfig={gameConfig}
                        />
                    </ConfigPanelContent>

                    {/* Button row at the bottom of config panel */}
                    <ButtonContainer>
                        <BlueButton onClick={resetSettings}>
                            Reset to Default
                        </BlueButton>

                        <BlueButton onClick={deployContract}>
                            Deploy Universe
                        </BlueButton>

                        {deployedContractAddress && (
                            <>
                                <BlueButton onClick={navigateToGame}>
                                    Open Game
                                </BlueButton>

                                <BlueButton onClick={copyToClipboard}>
                                    Copy Link
                                </BlueButton>
                            </>
                        )}
                    </ButtonContainer>
                </ConfigPanelContainer>
            </PageLayout>
        </Wrapper>
    );
}
