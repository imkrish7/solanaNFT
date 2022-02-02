import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Provider, Program, web3 } from "@project-serum/anchor";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { programs } from "@metaplex/js";
import {
  getParsedNftAccountsByOwner,
  isValidSolanaAddress,
  createConnectionConfig
} from "@nfteyez/sol-rayz";
const tokenPublicKey = "Gz3vYbpsB2agTsAwedtvtTkQ1CG9vsioqLW3r9ecNpvZ";
const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const RPC_HOST = "https://explorer-api.devnet.solana.com";
const MACHINE_ID = "DXZrhr2DfPjHTF5ZaNQUbkypvfymk7WXZ6pNQozpCHsw";

const { metadata: { Metadata, MetadataProgram } } = programs;

const NFTList = ({ walletAddress }) => {
  const [nfts, setNfts] = useState([]);
  const network = clusterApiUrl("devnet");
  const opts = { preflightCommitment: "confirmed" };
  const candyMachineProgram = new web3.PublicKey(
    "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
  );

  const getProvider = () => {
    const rpcHost = RPC_HOST;
    const connection = new Connection(rpcHost);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );

    return provider;
  };

  const getSerialized = async nfts => {
    let result = [];
    if (nfts.length > 0) {
      for (let i = 0; i < nfts.length; i++) {
        const { data: { uri }, mint } = nfts[i];
        console.log(nfts[i]);
        const fetchedData = await axios(uri);
        result = [...result, { ...fetchedData.data, mint }];
      }
    }
    return result;
  };

  const getAllNfts = async () => {
    try {
      const connect = createConnectionConfig(clusterApiUrl("devnet"));
      const provider = getProvider();
      const nftsData = await getParsedNftAccountsByOwner({
        publicAddress: walletAddress.toString(),
        connection: connect,
        serialization: true
      });
      const sanitized = await getSerialized(nftsData);
      setNfts([...sanitized]);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(
    () => {
      if (walletAddress) {
        getAllNfts();
      }
    },
    [walletAddress]
  );

  return (
    <Container>
      <Header>NFT List</Header>
      <List>
        {nfts.length > 0 &&
          nfts.map((nft, index) => {
            return (
              <Link key={index} to={`/nft/${nft.name}`} state={{ ...nft }}>
                <Image src={nft.image} />
              </Link>
            );
          })}
      </List>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 0px 50px;
`;

const Header = styled.h1`color: blue;`;
const List = styled.div`
  width: 100%;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Image = styled.img`
  width: 200px;
  height: 150px;
  border-radius: 10px;
`;
export default NFTList;
