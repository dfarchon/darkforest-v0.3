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
    TerminalWrapper,
    Hidden,
    GameWindowWrapper,
} from './GameLandingPageComponents';
import UIEmitter, { UIEmitterEvent } from '../utils/UIEmitter';
import BlueButton from '../components/BlueButton';
import styled from 'styled-components';

enum InitState {
    NONE,
    COMPATIBILITY_CHECKS_PASSED,
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


const BorderedGameWindowWrapper = styled.div`
  box-sizing: border-box;
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

        if (issues.includes(Incompatibility.NotRopsten)) {
            terminalEmitter.print('Connecting to Holesky Testnet');
            await animEllipsis();
            terminalEmitter.print(' ');
            terminalEmitter.println(
                'ERROR: Holesky not selected. Please select Holesky and try again.',
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
            terminalEmitter.print('Falling back to Holesky');
            await animEllipsis();
            terminalEmitter.print(' ');
            terminalEmitter.println('Holesky selected.', TerminalTextStyle.White);


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

        terminalEmitter.println('Connected to DarkForestCore contract.');
        gameUIManagerRef.current = gameUIManager;
    };

    const deployContract = async () => {
        const terminalEmitter = TerminalEmitter.getInstance();
        terminalEmitter.println('Deploying contract...');
        const gameUIManager = gameUIManagerRef.current;
        if (!gameUIManager) {
            return;
        }

        const contractAddress = await gameUIManager.deployContract();
        terminalEmitter.println('Contract deployed.', TerminalTextStyle.Green);
        terminalEmitter.println('Contract address: ' + contractAddress, TerminalTextStyle.White);
    }

    const advanceState = async () => {
        if (initState === InitState.NONE) {
            await advanceStateFromNone();
        } else if (initState === InitState.COMPATIBILITY_CHECKS_PASSED) {
            await advanceStateFromCompatibilityPassed();
        }



        // if (
        //     initState !== InitState.TERMINATED &&
        //     initState !== InitState.COMPLETE
        // ) {
        //     advanceState();
        // }
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

            <div style={{
                border: '2px solid #00ADE1',
                padding: '8px',
                borderRadius: '4px',
                margin: '10px',
                boxShadow: '0 0 10px rgba(0, 173, 225, 0.3)',
                width: '600px',
                maxWidth: '90%',
                height: '400px',
                maxHeight: '90%'
            }}>

                <Terminal />

            </div>

            <div style={{
                border: '2px solid #00ADE1',
                padding: '8px',
                borderRadius: '4px',
                margin: '10px',
                boxShadow: '0 0 10px rgba(0, 173, 225, 0.3)',
                width: '600px',
                maxWidth: '90%',
                height: '400px',
                maxHeight: '90%'
            }}>

                <BlueButton onClick={advanceStateFromNone}>
                    advance State From None
                </BlueButton>

                <br />


                <BlueButton onClick={advanceStateFromCompatibilityPassed}>
                    advance State From Compatibility Passed
                </BlueButton>

                <br />

                <BlueButton onClick={deployContract}>
                    Deploy Contract
                </BlueButton>

            </div>



        </Wrapper >
    );
}
