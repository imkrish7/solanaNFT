import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
const NFT = props => {
  const { state } = useLocation();
  const { properties: { creators }, mint } = state;
  const creator = useMemo(
    () => {
      const result = { ...creators[0] };
      return result;
    },
    [creators]
  );
  return (
    <Container>
      {state && <Image src={state.image} />}
      <Body>
        <Row>
          <Title>Name :</Title>
          <Value>
            {state.name}
          </Value>
        </Row>
        <Row>
          <Title>Creator :</Title>
          <Value>
            {creator.address}
          </Value>
        </Row>
        <Row>
          <Title>Address:</Title>
          <Value>
            {mint}
          </Value>
        </Row>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  width: 70%;
  height: 200px;
  box-shadow: 5px 5px 10px #ccc;
  border-radius: 10px;
  display: grid;
  grid-template-columns: 150px 1fr;
  grid-template-rows: 1fr;
  padding: 10px;
`;

const Image = styled.img`
  width: 150px;
  height: 180px;
  border-radius: 4px;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px;
  gap: 10px;
`;
const Row = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr;
  grid-template-rows: 1fr;
  gap: 10px;
  align-items: center;
  width: 100%;
`;

const Title = styled.span`
  color: #212121;
  font-weight: 500;
  font-size: 24px;
  word-wrap: break-word;
`;

const Value = styled.span`
  color: #858585;
  font-weight: 400;
  font-size: 20px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: #0000ff3d;
  padding: 5px 10px;
  border-radius: 4px;
`;

export default NFT;
