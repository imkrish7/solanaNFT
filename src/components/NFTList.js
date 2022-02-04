import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { clusterApiUrl } from "@solana/web3.js";
import {
  getParsedNftAccountsByOwner,
  createConnectionConfig
} from "@nfteyez/sol-rayz";

const NFTList = ({ walletAddress }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nfts, setNfts] = useState([]);
  const network = clusterApiUrl("devnet");
  const getSerialized = async nfts => {
    let result = [];
    if (nfts.length > 0) {
      for (let i = 0; i < nfts.length; i++) {
        const { data: { uri }, mint } = nfts[i];
        const fetchedData = await axios(uri);
        result = [...result, { ...fetchedData.data, mint }];
      }
    }
    return result;
  };

  const getAllNfts = async () => {
    try {
      const connect = createConnectionConfig(network);
      const nftsData = await getParsedNftAccountsByOwner({
        publicAddress: walletAddress.toString(),
        connection: connect,
        serialization: true
      });
      const sanitized = await getSerialized(nftsData);
      setNfts([...sanitized]);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setError(true);
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
        {loading
          ? <Loader />
          : error
            ? <Error>Something went wrong. Please refresh</Error>
            : nfts.length > 0
              ? nfts.map((nft, index) => {
                  return (
                    <Link
                      key={index}
                      to={`/nft/${nft.name}`}
                      state={{ ...nft }}
                    >
                      <Image src={nft.image} />
                    </Link>
                  );
                })
              : <Header>You have no NFT</Header>}
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
  justify-content: center;
`;

const Image = styled.img`
  width: 200px;
  height: 150px;
  border-radius: 10px;
`;

const rotate = keyframes`
  from{
    transform: rotate(0deg);
  }
  to{
    transform: rotate(360deg);
  }
`;

const Loader = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid #ccc;
  border-top-color: blue;
  animation: ${rotate} 500ms linear infinite;
`;

const Error = styled.span`
  color: #e74c3c;
  font-weight: 450;
  font-size: 20px;
`;

export default NFTList;
