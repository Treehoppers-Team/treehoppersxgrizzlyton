import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { SlopeAdapter } from "@web3auth/slope-adapter";
// Plugins
import { SolanaWalletConnectorPlugin } from "@web3auth/solana-wallet-connector-plugin";
// Adapters
import { SolflareAdapter } from "@web3auth/solflare-adapter";
import { useEffect, useState } from "react";

import RPC from "./api/solanaRPC";

const clientId =
  "BLcEFyEx2d1tloesFeDnFSQBPHOInsrxf1zmqKsQQkjO8cTckM0fz-rdkrzSOEBhXmJzyacUvdbf6XLMMTphjIQ"; // get from https://dashboard.web3auth.io

function App() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.SOLANA,
            chainId: "0x1", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
            rpcTarget: "https://rpc.ankr.com/solana", // This is the public RPC we have added, please pass on your own endpoint while creating an app
          },
          web3AuthNetwork: "cyan",
        });

        // adding solana wallet connector plugin

        const torusPlugin = new SolanaWalletConnectorPlugin({
          torusWalletOpts: {},
          walletInitOptions: {
            whiteLabel: {
              name: "Whitelabel Demo",
              theme: { isDark: true, colors: { torusBrand1: "#00a8ff" } },
              logoDark: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
              logoLight: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
              topupHide: true,
              defaultLanguage: "en",
            },
            enableLogging: true,
          },
        });
        await web3auth.addPlugin(torusPlugin);

        const solflareAdapter = new SolflareAdapter({
          clientId,
        });
        web3auth.configureAdapter(solflareAdapter);

        const slopeAdapter = new SlopeAdapter({
          clientId,
        });
        web3auth.configureAdapter(slopeAdapter);

        setWeb3auth(web3auth);

        await web3auth.initModal();
        if (web3auth.provider) {
          setProvider(web3auth.provider);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    uiConsole("Logged in Successfully!");
  };

  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.authenticateUser();
    uiConsole(idToken);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendTransaction();
    uiConsole(receipt);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const signedMessage = await rpc.signMessage();
    uiConsole(signedMessage);
  };

  const getPrivateKey = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    uiConsole(privateKey);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const modalStyle = "m-1 p-1 w-full bg-slate-200 rounded-lg hover:bg-slate-300"
  const loggedInView = (
    <>
      <button
        onClick={onOpen}
        className="text-white h-16 bg-[#00C48A] hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium text-sm px-5 py-2.5 text-center"
      >
        Manage Wallet
      </button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Your Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div className="flex flex-col justify-center">
              <div>
                <button onClick={getUserInfo} className={modalStyle}>
                  Get User Info
                </button>
              </div>
              <div>
                <button onClick={authenticateUser} className={modalStyle}>
                  Get ID Token
                </button>
              </div>
              <div>
                <button onClick={getAccounts} className={modalStyle}>
                  Get Account
                </button>
              </div>
              <div>
                <button onClick={getBalance} className={modalStyle}>
                  Get Balance
                </button>
              </div>
              <div>
                <button onClick={sendTransaction} className={modalStyle}>
                  Send Transaction
                </button>
              </div>
              <div>
                <button onClick={signMessage} className={modalStyle}>
                  Sign Message
                </button>
              </div>
              <div>
                <button onClick={getPrivateKey} className={modalStyle}>
                  Get Private Key
                </button>
              </div>

              <button 
                className="w-full m-1 text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                onClick={logout} >
                  Log Out
                </button>
            </div>
            <div id="console" style={{ whiteSpace: "pre-line" }}>
              <p style={{ whiteSpace: "pre-line" }}></p>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              className="w-full my-2 mx-auto text-white bg-red-500 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              onClick={onClose}
            >
              Close
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );

  const unloggedInView = (
    <button 
    className="text-white h-16 bg-[#00C48A] hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium text-sm px-5 py-2.5 text-center"
    onClick={login}>
      Login
    </button>
  );

  return (
    <div className="container">
      <div>
        {provider ? loggedInView : unloggedInView}
      </div>
    </div>
  );
}

export default App;
