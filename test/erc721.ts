import '@typechain/hardhat';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ERC721Mock } from '../typechain-types';
import { parseEther } from 'ethers/lib/utils';

describe('Token contract', () => {
  let erc721: ERC721Mock;
  let [owner, addr1, addr2, addr3, addr4]: SignerWithAddress[] = [];

  beforeEach(async function deploy() {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const Token = await ethers.getContractFactory('ERC721Mock')
    const ERC721 = await Token.deploy('TestToken', 'TT');
    
    erc721 = await ERC721.deployed();
    
  })

  // mint 
  describe('mint', () => {
    it('Minting should be successful when deployer mint', async () => {
      const mintTx = await erc721.mint(addr1.address, 1)
      await mintTx.wait();
    
      const ownerBalance = await erc721.balanceOf(addr1.address);
      
      expect(ownerBalance).to.eq(1)
    });

  
    it('The same tokenID minting should fail', async function () {
      const mintTx = await erc721.mint(addr1.address, 6);
      await mintTx.wait();
  

      await expect(erc721.mint(addr1.address, 6))
        .to.be.revertedWith('ERC721: token already minted');
    });


  });

  // balanceOf
  describe('balanceOf', () => {
    it('balance of owner address should same with the amount of token minted', async function () {

      await erc721.mint(addr1.address, 1);
      await erc721.mint(addr1.address, 2);
      await erc721.mint(addr1.address, 3);
      await erc721.mint(addr1.address, 4);
      await erc721.mint(addr1.address, 5);
      const balance = await erc721.balanceOf(addr1.address);
  
      expect(balance).to.equal(5);
    });
  });

  // ownerOf
  describe('ownerOf', () => {
    it('owner of token should same with address of deployer', async function () {
      await erc721.mint(addr1.address, 10);
      
      
      const minter = await erc721.ownerOf(10);
      
      expect(minter).to.equal(addr1.address);
    });
  });

  // transferFrom
  describe('transferFrom', () => {
    it('revert test', async () => {
      const mintTx = await erc721.mint(addr1.address, 1);
      await mintTx.wait();

      await expect(erc721.connect(addr2).transferFrom(addr1.address, addr2.address, 1))
        .to.be.revertedWith('ERC721: caller is not token owner nor approved');
    });

    it('transferFrom', async function () {
      await erc721.mint(addr1.address, 1);
      await erc721.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      
      expect(await erc721.balanceOf(addr2.address)).to.eq(1)
    });
  });

  // approve
  describe('approve', () => {
    it('token owner should not same with address owner whom get approved', async function () {
      const mintTx = await erc721.mint(addr1.address, 1);
      await mintTx.wait();

      await expect(erc721.connect(addr1).approve(addr1.address, 1))
        .to.be.revertedWith('ERC721: approval to current owner')
    });

    it('whom did not get approved for token should fail to be the approve caller', async function () {
      const mintTx = await erc721.mint(addr1.address, 1);
      await mintTx.wait();

      await expect(erc721.connect(addr2).approve(addr3.address, 1))
        .to.be.revertedWith('ERC721: approve caller is not token owner nor approved for all')
    });

    it('token owner and whom get approved by owner both can be the approve caller of the token', async function () {
      const mintTx = await erc721.mint(addr1.address, 1);
      await mintTx.wait();

      erc721.connect(addr1).approve(addr2.address, 1)
      await expect(erc721.connect(addr3).approve(addr4.address, 1)).to.be.revertedWith('ERC721: approve caller is not token owner nor approved for all')
    });

    it('approval should success when token owner set approve call', async function () {
      const mintTx = await erc721.mint(addr1.address, 3);
      await mintTx.wait();

      expect(await erc721.connect(addr1).approve(addr2.address, 3));
    });
    
    it('approval should success when whom approved by token owner set approve call', async function () {
      const mintTx = await erc721.mint(addr1.address, 3);
      await mintTx.wait();

      erc721.connect(addr1).setApprovalForAll(addr2.address, true);

      expect(await erc721.connect(addr2).approve(addr3.address, 3));
    });
  });
    
  // setApproveForAll
  describe('setApproveForAll', () => {
    it('token owner should not be the operator', async function () {
      const mintTx = await erc721.mint(addr1.address, 1);
      await mintTx.wait();

      await expect(erc721.connect(addr1).setApprovalForAll(addr1.address, true))
        .to.be.revertedWith('ERC721: approve to caller')
    });

    it('setApproveForAll', async function () {
      const mintTx = await erc721.mint(addr1.address, 1);
      await mintTx.wait();

      await erc721.connect(addr1).setApprovalForAll(addr2.address, true);
      await erc721.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
      
      const balanceOfAddr2 = await erc721.balanceOf(addr2.address);
      
      expect(balanceOfAddr2).to.equal(1);
    });

  // isApprovedForAll
    describe('isApprovedForAll', () => {
      it('function isApprovedForAll should return true', async function () {
        const mintTx = await erc721.mint(addr1.address, 1);
        await mintTx.wait();

        await erc721.connect(addr1).setApprovalForAll(addr2.address, true);

        expect(await erc721.isApprovedForAll(addr1.address, addr2.address))
          .to.equal(true);
      });
    });

    // getApproved
    describe('getApproved', () => {
      it('function getApproved should return approved address', async function () {
        const tokenId = 3;
        const mintTx = await erc721.mint(addr1.address, tokenId);
        await mintTx.wait();

        await erc721.connect(addr1).approve(addr2.address, tokenId);

        expect(await erc721.getApproved(tokenId)).to.equal(addr2.address)
      });
    });
  });
});