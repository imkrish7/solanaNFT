import React, { useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { Provider, Program, web3 } from "@project-serum/anchor";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { MintLayout, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import {
  candyMachineProgram,
  TOKEN_METADATA_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  getAtaForMint,
  getNetworkExpire,
  getNetworkToken,
  getMetadata,
  getMasterEdition,
  CIVIC
} from "./helpers";
import config from "../config.json";
import { sendTransactions } from "./connection";
const { SystemProgram } = web3;
const NETWORK = "devnet";
const RPC_HOST = "https://explorer-api.devnet.solana.com";
const MACHINE_ID = "DXZrhr2DfPjHTF5ZaNQUbkypvfymk7WXZ6pNQozpCHsw";
const Landing = ({ walletAddress }) => {
  const [candyMachineInfo, setCandyMachineInfo] = useState(null);
  const network = clusterApiUrl("devnet");

  const candyMachineProgram = new web3.PublicKey(
    "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
  );
  const opts = { preflightCommitment: "confirmed" };
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

  const getCandyMachineState = async () => {
    const provider = getProvider();

    const idl = await Program.fetchIdl(candyMachineProgram, provider);
    const program = new Program(idl, candyMachineProgram, provider);
    const candyMachine = await program.account.candyMachine.fetch(MACHINE_ID);
    console.log(candyMachine);
    const itemsAvailable = candyMachine.data.itemsAvailable.toNumber();
    const itemsRedeemed = candyMachine.itemsRedeemed.toNumber();
    const itemsRemaining = itemsAvailable - itemsRedeemed;
    const goLiveData = candyMachine.data.goLiveDate.toNumber();
    const presale =
      candyMachine.data.whitelistMintSettings &&
      candyMachine.data.whitelistMintSettings.presale &&
      (!candyMachine.data.goLiveDate ||
        candyMachine.data.goLiveDate.toNumber() > new Date().getTime() / 1000);

    // We will be using this later in our UI so let's generate this now
    const goLiveDateTimeString = `${new Date(goLiveData * 1000).toGMTString()}`;

    // console.log({
    //   itemsAvailable,
    //   itemsRedeemed,
    //   itemsRemaining,
    //   goLiveData,
    //   goLiveDateTimeString,
    //   presale
    // });
    setCandyMachineInfo({
      id: MACHINE_ID,
      program,
      state: {
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining,
        goLiveData,
        goLiveDateTimeString,
        isSoldOut: itemsRemaining === 0,
        isActive:
          (presale ||
            candyMachine.data.goLiveDate.toNumber() <
              new Date().getTime() / 1000) &&
          (candyMachine.endSettings
            ? candyMachine.endSettings.endSettingType.date
              ? candyMachine.endSettings.number.toNumber() >
                new Date().getTime() / 1000
              : itemsRedeemed < candyMachine.endSettings.number.toNumber()
            : true),
        isPresale: presale,
        goLiveDate: candyMachine.data.goLiveDate,
        treasury: candyMachine.wallet,
        tokenMint: candyMachine.tokenMint,
        gatekeeper: candyMachine.data.gatekeeper,
        endSettings: candyMachine.data.endSettings,
        whitelistMintSettings: candyMachine.data.whitelistMintSettings,
        hiddenSettings: candyMachine.data.hiddenSettings,
        price: candyMachine.data.price
      }
    });
  };

  useEffect(() => {
    getCandyMachineState();
  }, []);
  const getCandyMachineCreator = async candyMachine => {
    const candyMachineID = new PublicKey(candyMachine);
    return await web3.PublicKey.findProgramAddress(
      [Buffer.from("candy_machine"), candyMachineID.toBuffer()],
      candyMachineProgram
    );
  };

  const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress,
    payer,
    walletAddress,
    splTokenMintAddress
  ) => {
    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
      { pubkey: walletAddress, isSigner: false, isWritable: false },
      { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
      {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false
      },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ];
    return new web3.TransactionInstruction({
      keys,
      programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      data: Buffer.from([])
    });
  };

  const getMetadata = async mint => {
    return (await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
  };

  const getMasterEdition = async mint => {
    return (await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
  };

  const getTokenWallet = async (wallet, mint) => {
    return (await web3.PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    ))[0];
  };

  // const mintToken = async () => {
  //   try {
  //     const mint = web3.Keypair.generate();
  //     const token = await getTokenWallet(walletAddress, mint.publicKey);
  //     const metadata = await getMetadata(mint.publicKey);
  //     const masterEdition = await getMasterEdition(mint.publicKey);
  //     const rpcHost = RPC_HOST;
  //     const connection = new Connection(rpcHost);
  //     const rent = await connection.getMinimumBalanceForRentExemption(
  //       MintLayout.span
  //     );
  //     const accounts = {
  //       config,
  //       candyMachine: MACHINE_ID,
  //       payer: walletAddress,
  //       wallet: candyMachineInfo.state.treasury,
  //       mint: mint.publicKey,
  //       metadata,
  //       masterEdition,
  //       mintAuthority: walletAddress,
  //       updateAuthority: walletAddress,
  //       tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       systemProgram: SystemProgram.programId,
  //       rent: web3.SYSVAR_RENT_PUBKEY,
  //       clock: web3.SYSVAR_CLOCK_PUBKEY
  //     };
  //     const signers = [mint];
  //     const instructions = [
  //       web3.SystemProgram.createAccount({
  //         fromPubkey: walletAddress,
  //         newAccountPubkey: mint.publicKey,
  //         space: MintLayout.span,
  //         lamports: rent,
  //         programId: TOKEN_PROGRAM_ID
  //       }),
  //       Token.createInitMintInstruction(
  //         TOKEN_PROGRAM_ID,
  //         mint.publicKey,
  //         0,
  //         walletAddress,
  //         walletAddress
  //       ),
  //       createAssociatedTokenAccountInstruction(
  //         token,
  //         walletAddress,
  //         walletAddress,
  //         mint.publicKey
  //       ),
  //       Token.createMintToInstruction(
  //         TOKEN_PROGRAM_ID,
  //         mint.publicKey,
  //         token,
  //         walletAddress,
  //         [],
  //         1
  //       )
  //     ];

  //     const provider = getProvider();
  //     const idl = await Program.fetchIdl(candyMachineProgram, provider);
  //     const program = new Program(idl, candyMachineProgram, provider);

  //     const txn = await program.rpc.mintNft({
  //       accounts,
  //       signers,
  //       instructions
  //     });

  //     console.log("txn:", txn);

  //     // Setup listener
  //     connection.onSignatureWithOptions(
  //       txn,
  //       async (notification, context) => {
  //         if (notification.type === "status") {
  //           console.log("Received status event");

  //           const { result } = notification;
  //           if (!result.err) {
  //             console.log("NFT Minted!");
  //           }
  //         }
  //       },
  //       { commitment: "processed" }
  //     );
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const mintToken = async () => {
    const mint = web3.Keypair.generate();
    const userTokenAccountAddress = (await getAtaForMint(
      mint.publicKey,
      walletAddress
    ))[0];

    const userPayingAccountAddress = candyMachineInfo.state.tokenMint
      ? (await getAtaForMint(
          candyMachineInfo.state.tokenMint,
          walletAddress
        ))[0]
      : walletAddress;

    const candyMachineAddress = candyMachineInfo.id;
    const remainingAccounts = [];
    const signers = [mint];
    const cleanupInstructions = [];
    const instructions = [
      web3.SystemProgram.createAccount({
        fromPubkey: walletAddress,
        newAccountPubkey: mint.publicKey,
        space: MintLayout.span,
        lamports: await candyMachineInfo.program.provider.connection.getMinimumBalanceForRentExemption(
          MintLayout.span
        ),
        programId: TOKEN_PROGRAM_ID
      }),
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        0,
        walletAddress,
        walletAddress
      ),
      createAssociatedTokenAccountInstruction(
        userTokenAccountAddress,
        walletAddress,
        walletAddress,
        mint.publicKey
      ),
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        userTokenAccountAddress,
        walletAddress,
        [],
        1
      )
    ];

    if (candyMachineInfo.state.gatekeeper) {
      remainingAccounts.push({
        pubkey: (await getNetworkToken(
          walletAddress,
          candyMachineInfo.state.gatekeeper.gatekeeperNetwork
        ))[0],
        isWritable: true,
        isSigner: false
      });
      if (candyMachineInfo.state.gatekeeper.expireOnUse) {
        remainingAccounts.push({
          pubkey: CIVIC,
          isWritable: false,
          isSigner: false
        });
        remainingAccounts.push({
          pubkey: (await getNetworkExpire(
            candyMachineInfo.state.gatekeeper.gatekeeperNetwork
          ))[0],
          isWritable: false,
          isSigner: false
        });
      }
    }
    if (candyMachineInfo.state.whitelistMintSettings) {
      const mint = new web3.PublicKey(
        candyMachineInfo.state.whitelistMintSettings.mint
      );

      const whitelistToken = (await getAtaForMint(mint, walletAddress))[0];
      remainingAccounts.push({
        pubkey: whitelistToken,
        isWritable: true,
        isSigner: false
      });

      if (candyMachineInfo.state.whitelistMintSettings.mode.burnEveryTime) {
        const whitelistBurnAuthority = web3.Keypair.generate();

        remainingAccounts.push({
          pubkey: mint,
          isWritable: true,
          isSigner: false
        });
        remainingAccounts.push({
          pubkey: whitelistBurnAuthority.publicKey,
          isWritable: false,
          isSigner: true
        });
        signers.push(whitelistBurnAuthority);
        const exists = await candyMachineInfo.program.provider.connection.getAccountInfo(
          whitelistToken
        );
        if (exists) {
          instructions.push(
            Token.createApproveInstruction(
              TOKEN_PROGRAM_ID,
              whitelistToken,
              whitelistBurnAuthority.publicKey,
              walletAddress,
              [],
              1
            )
          );
          cleanupInstructions.push(
            Token.createRevokeInstruction(
              TOKEN_PROGRAM_ID,
              whitelistToken,
              walletAddress,
              []
            )
          );
        }
      }
    }

    if (candyMachineInfo.state.tokenMint) {
      const transferAuthority = web3.Keypair.generate();

      signers.push(transferAuthority);
      remainingAccounts.push({
        pubkey: userPayingAccountAddress,
        isWritable: true,
        isSigner: false
      });
      remainingAccounts.push({
        pubkey: transferAuthority.publicKey,
        isWritable: false,
        isSigner: true
      });

      instructions.push(
        Token.createApproveInstruction(
          TOKEN_PROGRAM_ID,
          userPayingAccountAddress,
          transferAuthority.publicKey,
          walletAddress,
          [],
          candyMachineInfo.state.price.toNumber()
        )
      );
      cleanupInstructions.push(
        Token.createRevokeInstruction(
          TOKEN_PROGRAM_ID,
          userPayingAccountAddress,
          walletAddress,
          []
        )
      );
    }
    const metadataAddress = await getMetadata(mint.publicKey);
    const masterEdition = await getMasterEdition(mint.publicKey);

    const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
      candyMachineAddress
    );

    instructions.push(
      await candyMachineInfo.program.instruction.mintNft(creatorBump, {
        accounts: {
          config: new web3.PublicKey(
            "22ca8g679q9gSyWUzNJiy1QLiSjJ4JJt8w5p8eUJsxo6"
          ),
          candyMachine: candyMachineAddress,
          candyMachineCreator,
          payer: walletAddress,
          wallet: candyMachineInfo.state.treasury,
          mint: mint.publicKey,
          metadata: metadataAddress,
          masterEdition,
          mintAuthority: walletAddress,
          updateAuthority: walletAddress,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          clock: web3.SYSVAR_CLOCK_PUBKEY,
          recentBlockhashes: web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
          instructionSysvarAccount: web3.SYSVAR_INSTRUCTIONS_PUBKEY
        },
        remainingAccounts:
          remainingAccounts.length > 0 ? remainingAccounts : undefined
      })
    );

    try {
      return (await sendTransactions(
        candyMachineInfo.program.provider.connection,
        candyMachineInfo.program.provider.wallet,
        [instructions, cleanupInstructions],
        [signers, []]
      )).txs.map(t => t.txid);
    } catch (e) {
      console.log(e);
    }
    return [];
  };
  return (
    candyMachineInfo &&
    <Container>
      <Paragraph>{`Drop Date: ${candyMachineInfo.state
        .goLiveDateTimeString}`}</Paragraph>
      <Paragraph>{`Items Minted: ${candyMachineInfo.state
        .itemsRedeemed} / ${candyMachineInfo.state.itemsAvailable}`}</Paragraph>
      <Button className="cta-button mint-button" onClick={mintToken}>
        Mint NFT
      </Button>
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  row-gap: 10px;
`;
const Button = styled.button`
  background: #fff;
  border: 1px solid blue;
  border-radius: 4px;
  padding: 10px 16px;
  color: blue;
  font-weight: 500;
  font-size: 20px;
  cursor: pointer;
`;

const Paragraph = styled.div`
  color: #858585;
  font-size: 16px;
  font-weight: 400;
`;
export default Landing;