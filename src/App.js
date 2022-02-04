import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import NFT from "./components/NFT";
import NFTList from "./components/NFTList";
import styled from "styled-components";
const LAMPORTS = 0.000000001;

function App() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(0);
  const network = clusterApiUrl("devnet");
  const opts = { preflightCommitment: "confirmed" };

  const checkWalletConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("solana wallet exist");
          const response = await solana.connect({ onlyIfTruested: true });
          console.log(
            "connected with public key",
            response.publicKey.toString()
          );
          setAddress(response.publicKey);
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet");
        window.open("https://phantom.app/", "_blank");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (solana) {
        const response = await solana.connect();
        console.log(
          "wallet is connected now with address",
          response.publicKey.toString()
        );
        setAddress(response.publicKey);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBalance = async () => {
    const { solana } = window;
    try {
      if (solana) {
        const connection = new Connection(network, opts.preflightCommitment);
        const _balance = await connection.getBalance(address);
        const balanceInSol = _balance * LAMPORTS;
        setBalance(balanceInSol.toFixed(5));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkWalletConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(
    () => {
      fetchBalance();
    },
    [address]
  );
  return (
    <Container>
      {address && <Header>Wallet Connected</Header>}
      {address && balance
        ? <Card>
            <Row>
              <CardBodyHeader>Address :</CardBodyHeader>
              <CardBodyText>
                {address.toString()}
              </CardBodyText>
            </Row>
            <Row>
              <CardBodyHeader>Balance :</CardBodyHeader>
              <CardBodyText>
                {balance} SOL
              </CardBodyText>
            </Row>
          </Card>
        : null}
      {!address && <Button onClick={connectWallet}> connect to wallet </Button>}
      <Main>
        <Routes>
          <Route path="/" element={<NFTList walletAddress={address} />} />
          <Route path="/nft/:id" element={<NFT />} />
        </Routes>
      </Main>
    </Container>
  );
}

export default App;

const Button = styled.button`
  background-color: blue;
  font-size: 20px;
  font-weight: 450;
  color: #fff;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  text-transform: capitalize;
  cursor: pointer;
`;

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const Card = styled.div`
  min-width: 600px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #858585;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  column-gap: 10px;
  align-items: center;
`;

const CardBodyHeader = styled.p`
  color: #212121;
  font-weight: 700;
  font-size: 24px;
`;
const CardBodyText = styled.p`
  color: #212121;
  font-weight: 450;
  font-size: 20px;
`;

const Main = styled.div`
  width: 100%;
  margin: 20px 0px;
  display: flex;
  justify-content: center;
`;

const Header = styled.h1`color: blue;`;
