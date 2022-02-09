import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./utils/songLinkPortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [msg, setMsg] = useState("");
  const [notif, setNotif] = useState("");
  const [allWaves, setAllWaves] = useState();
  const contractAddress = "0x1794E98C743be19d4a8928BD25340E90C49c1645";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object ( metamask )", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setNotif(`Found an authorized account: ${account}`);
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
      } else {
        setNotif("No authorized account found, Connect Wallet :D");
        console.log("No authorized account found ( ˘︹˘ )");
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setNotif("Connected :D");
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async (playlist_url) => {
    try {
      console.log(playlist_url);
      setNotif("Submitting....");
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalPlaylist();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.upload(playlist_url, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);
        setNotif("Mining... Do Not Refresh");

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalPlaylist();
        console.log("Retrieved total wave count...", count.toNumber());
        setNotif(`Mined! Thanks for the Playlist (ɔ◔‿◔)ɔ ♥`);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setNotif("Transaction Failed");
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.sender,
            timestamp: new Date(wave.timestamp * 1000),
            url: wave.playlist_url,
          });
        });

        
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewPlaylist", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewPlaylist", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewPlaylist", onNewWave);
      }
    };
  }, []);

  useEffect(() => {
    if (checkIfWalletIsConnected()) {
      getAllWaves();
    }
  }, []);

  const checkSpotifyURL = async(link) => {
    fetch("https://spotifyverifyapi.herokuapp.com/", {
      method: "POST",
      body: JSON.stringify({
        url: link.msg,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.works == true) {
          const url = new URL(link.msg);
          const str = `https://open.spotify.com/embed${url.pathname}`;
          wave(str);
        } else {
          setNotif(json.err);
        }
      });
}

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = { msg };
    checkSpotifyURL(message);
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">🎵 Song Link !</div>

        <div className="bio">Your Playlist on BlockChain!</div>
        <br></br>

        <div className="alert">{notif}</div>

        <div className="bio">
          Paste link of your favorite Spotify Playlist. Cooldown time of 15 minutes, if transaction fails, please try after 15 minutes
        </div>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        <div className="mainContainer">
          Total Number of Playlist:{" "}
          <span
            style={{
              marginLeft:"5px",
              color: "red",
            }}
          >
            {allWaves?.length}
          </span>
        </div>
        {currentAccount && (
          <form className="dataContainer" onSubmit={handleSubmit}>
            <div className="mainContainer">
              <input
                type="text"
                placeholder="Spotify Playlist URL"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
              />
            </div>
            <button className="waveButton">Submit</button>
          </form>
        )}

        { allWaves?.reverse().map((wave, index) => {
          const etherscan =
            "https://rinkeby.etherscan.io/address/" + wave.address;
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                marginTop: "20px",
                padding: "30px",
              }}
            >
              <iframe
                src={wave.url}
                width="100%"
                height="380"
                frameBorder="0"
                allowFullScreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              ></iframe>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <span>
                Etherscan Link: <a href={etherscan}>{etherscan}</a>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
