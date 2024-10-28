import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { VotingPlus } from "../typechain-types";

async function deployVotingPlusfixtureNoVoterExceptOwner() {
  const [owner, voter1, voter2, voter3, voter4, simpleUser] =
    await ethers.getSigners();
  const votingPlus = await ethers.deployContract("VotingPlus");
  await votingPlus.addVoter(owner);
  return { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser };
}

async function deployVotingPlusfixtureWithVoters() {
  const { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
    await loadFixture(deployVotingPlusfixtureNoVoterExceptOwner);
  // add voters
  await votingPlus.addVoter(voter1);
  await votingPlus.addVoter(voter2);
  await votingPlus.addVoter(voter3);
  await votingPlus.addVoter(voter4);
  return { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser };
}

describe("VotingPlus", function () {
  let votingPlus: VotingPlus;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  let voter3: HardhatEthersSigner;
  let voter4: HardhatEthersSigner;
  let simpleUser: HardhatEthersSigner;

  describe("Initialization", async () => {
    it("should deploy the contract", async () => {
      const { votingPlus, owner } = await loadFixture(
        deployVotingPlusfixtureNoVoterExceptOwner
      );
      let VotingPlusOwner = await votingPlus.owner();
      assert(VotingPlusOwner == owner.address);
    });
  });

  describe("Registration phase", async () => {
    beforeEach(async () => {
      ({ votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
        await loadFixture(deployVotingPlusfixtureNoVoterExceptOwner));
      //Object.assign(this, await loadFixture(deployVotingPlusfixtureNoVoter));
    });

    it("should should add two voters check if thye have been add to the mapping", async () => {
      await expect(votingPlus.addVoter(voter1.address))
        .to.emit(votingPlus, "VoterRegistered")
        .withArgs(voter1.address);

      let voter = await votingPlus.connect(voter1).getVoter(voter1.address);
      assert(voter.isRegistered === true);

      await expect(votingPlus.addVoter(voter2.address))
        .to.emit(votingPlus, "VoterRegistered")
        .withArgs(voter2.address);

      voter = await votingPlus.connect(voter1).getVoter(voter2.address);
      assert(voter.isRegistered === true);
    });

    it("should revert cause getVoter can only be call by voter", async () => {
      await expect(
        votingPlus.connect(voter3).getVoter(voter1.address)
      ).to.be.revertedWith("You're not a voter");
    });

    it("should revert cause addVoter can only be call by owner", async () => {
      await expect(
        votingPlus.connect(voter1).addVoter(voter3.address)
      ).to.be.revertedWithCustomError(votingPlus, "OwnableUnauthorizedAccount");
    });

    it("should revert cause deleteVoter can only be call by owner", async () => {
      await expect(
        votingPlus.connect(voter1).deleteVoter(voter1.address)
      ).to.be.revertedWithCustomError(votingPlus, "OwnableUnauthorizedAccount");
    });

    it("should delete a voter", async () => {
      await expect(votingPlus.addVoter(voter1.address))
        .to.emit(votingPlus, "VoterRegistered")
        .withArgs(voter1.address);

      let voter = await votingPlus.connect(voter1).getVoter(voter1.address);
      assert(voter.isRegistered === true);

      await votingPlus.deleteVoter(voter1.address);
      voter = await votingPlus.getVoter(voter1.address);
      assert(voter.isRegistered === false);
    });
  });

  describe("Registration phase", async () => {});
});
