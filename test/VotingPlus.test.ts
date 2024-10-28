import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { assert, expect } from "chai";
import { ethers, ignition } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { VotingPlus } from "../typechain-types";

async function deployVotingPlusfixtureNoVoterExceptOwner() {
  const [owner, voter1, voter2, voter3, voter4, simpleUser] =
    await ethers.getSigners();
  const votingPlus = await ethers.deployContract("VotingPlus");
  await votingPlus.addVoter(owner);
  return { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser };
}

/**
 * Fixture
 * - ajouts de 4 voters
 * @returns
 */
async function deployVotingPlusfixtureWithVoters() {
  const { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
    await loadFixture(deployVotingPlusfixtureNoVoterExceptOwner);
  await votingPlus.addVoter(voter1);
  await votingPlus.addVoter(voter2);
  await votingPlus.addVoter(voter3);
  await votingPlus.addVoter(voter4);
  return { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser };
}

/**
 * Fixture
 * - statut de workflow Proposal
 * @returns
 */
async function deployVotingPlusfixtureWithVotersProposalStatus() {
  const { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
    await loadFixture(deployVotingPlusfixtureWithVoters);
  await votingPlus.nextWorkflowStatus();
  return { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser };
}

/**
 * Fixture utilisée pour la phase de vote
 * - ajouts de 4 voters
 * - ajouts de 5 proposals
 * @returns
 */
async function deployVotingPlusfixtureWithVotersVotingStatus() {
  const { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
    await loadFixture(deployVotingPlusfixtureWithVoters);
  await votingPlus.nextWorkflowStatus();
  await votingPlus.connect(voter1).addProposal("Proposal N°1 Voter 1");
  await votingPlus.connect(voter1).addProposal("Proposal N°2 Voter 1");
  await votingPlus.connect(voter2).addProposal("Proposal Voter 2");
  await votingPlus.connect(voter3).addProposal("Proposal Voter 3");
  await votingPlus.connect(voter4).addProposal("Proposal Voter 4");
  await votingPlus.nextWorkflowStatus();
  await votingPlus.nextWorkflowStatus();
  return { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser };
}

/**
 * Fixture utilisée pour la phase de vote
 * - ajouts de 4 voters
 * - ajouts de 5 proposals
 * - vote effectués
 * @returns
 */
async function deployVotingPlusfixtureWithVotersVotingSessionEnded() {
  const { votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
    await loadFixture(deployVotingPlusfixtureWithVoters);
  await votingPlus.nextWorkflowStatus();
  await votingPlus.connect(voter1).addProposal("Proposal N°1 Voter 1");
  await votingPlus.connect(voter1).addProposal("Proposal N°2 Voter 1");
  await votingPlus.connect(voter2).addProposal("Proposal Voter 2");
  await votingPlus.connect(voter3).addProposal("Proposal Voter 3");
  await votingPlus.connect(voter4).addProposal("Proposal Voter 4");
  await votingPlus.nextWorkflowStatus();
  await votingPlus.nextWorkflowStatus();
  await votingPlus.connect(voter1).setVote(0);
  await votingPlus.connect(voter2).setVote(3);
  await votingPlus.connect(voter3).setVote(4);
  await votingPlus.connect(voter4).setVote(3);
  await votingPlus.nextWorkflowStatus();
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

  describe("Workflows global check", async () => {
    beforeEach(async () => {
      ({ votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
        await loadFixture(deployVotingPlusfixtureNoVoterExceptOwner));
    });

    it("only the owner can change the workflow state", async () => {
      await expect(
        votingPlus.connect(voter1).nextWorkflowStatus()
      ).to.be.revertedWithCustomError(votingPlus, "OwnableUnauthorizedAccount");
    });

    it("should emit WorkflowStatusChange and increase workflow status by 1", async () => {
      const previousStatus = await votingPlus.workflowStatus();

      await expect(votingPlus.nextWorkflowStatus())
        .to.emit(votingPlus, "WorkflowStatusChange")
        .withArgs(previousStatus, previousStatus + 1n);

      const currentStatus = await votingPlus.workflowStatus();
      assert(currentStatus === previousStatus + 1n);
    });
  });

  describe("Registration phase", async () => {
    beforeEach(async () => {
      ({ votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
        await loadFixture(deployVotingPlusfixtureNoVoterExceptOwner));
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

    it("should revert addProposal cause the current workflow status is not ProposalsRegistrationStarted", async () => {
      await expect(votingPlus.addProposal("My Proposal")).to.be.revertedWith(
        "Proposals are not allowed yet"
      );
    });
  });

  describe("Proposal phase", async () => {
    beforeEach(async () => {
      ({ votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
        await loadFixture(deployVotingPlusfixtureWithVotersProposalStatus));
    });
    it("should be Proposal status", async () => {
      const currentStatus = await votingPlus.workflowStatus();
      assert(currentStatus === 1n);
    });

    it("should revert addProposal cause the user is not a voter", async () => {
      await expect(
        votingPlus.connect(simpleUser).addProposal("My Proposal")
      ).to.be.revertedWith("You're not a voter");
    });

    it("should revert cause a proposal can not be empty", async () => {
      await expect(
        votingPlus.connect(voter1).addProposal("")
      ).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });

    it("should add 4 proposals and do not allow to vote to any proposal (wrong status and not be a voter)", async () => {
      await expect(
        votingPlus.connect(voter1).addProposal("Proposal N°1 Voter 1")
      )
        .to.emit(votingPlus, "ProposalRegistered")
        .withArgs(0);

      let proposal = await votingPlus.getOneProposal(0);
      assert(proposal.description === "Proposal N°1 Voter 1");

      await expect(
        votingPlus.connect(voter1).addProposal("Proposal N°2 Voter 1")
      )
        .to.emit(votingPlus, "ProposalRegistered")
        .withArgs(1);
      proposal = await votingPlus.getOneProposal(1);
      assert(proposal.description === "Proposal N°2 Voter 1");

      await expect(votingPlus.connect(voter2).addProposal("Proposal Voter 2"))
        .to.emit(votingPlus, "ProposalRegistered")
        .withArgs(2);
      proposal = await votingPlus.getOneProposal(2);
      assert(proposal.description === "Proposal Voter 2");

      await expect(votingPlus.connect(voter3).addProposal("Proposal Voter 3"))
        .to.emit(votingPlus, "ProposalRegistered")
        .withArgs(3);
      proposal = await votingPlus.getOneProposal(3);
      assert(proposal.description === "Proposal Voter 3");

      await expect(votingPlus.connect(voter4).addProposal("Proposal Voter 4"))
        .to.emit(votingPlus, "ProposalRegistered")
        .withArgs(4);
      proposal = await votingPlus.getOneProposal(4);
      assert(proposal.description === "Proposal Voter 4");

      //TO DO : Tester le nombre de propositions soumis;

      await expect(
        votingPlus.connect(simpleUser).setVote(0)
      ).to.be.revertedWith("You're not a voter");

      await expect(votingPlus.connect(voter1).setVote(0)).to.be.revertedWith(
        "Voting session havent started yet"
      );
      await votingPlus.nextWorkflowStatus();
      await expect(votingPlus.connect(voter1).setVote(0)).to.be.revertedWith(
        "Voting session havent started yet"
      );
    });
  });

  describe("Voting phase", async () => {
    beforeEach(async () => {
      ({ votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
        await loadFixture(deployVotingPlusfixtureWithVotersVotingStatus));
    });

    it("should be Voting status", async () => {
      const currentStatus = await votingPlus.workflowStatus();
      assert(currentStatus === 3n);
    });

    it("should revert, can not add a proposal in VotingSessionStarted status", async () => {
      await expect(
        votingPlus.connect(voter1).addProposal("Ne marchera pas")
      ).to.be.revertedWith("Proposals are not allowed yet");
    });

    it("should revert, the user is not a voter", async () => {
      await expect(
        votingPlus.connect(simpleUser).setVote(0)
      ).to.be.revertedWith("You're not a voter");
    });

    it("should revert, the proposal does not exist", async () => {
      await expect(votingPlus.connect(voter1).setVote(6)).to.be.revertedWith(
        "Proposal not found"
      );
    });

    it("should revert, the voter can only vote once", async () => {
      await votingPlus.connect(voter1).setVote(0);
      await expect(votingPlus.connect(voter1).setVote(1)).to.be.revertedWith(
        "You have already voted"
      );
    });

    it("should take votes from all user and check it's update their voter structure, check also if the proposals have the right voting count", async () => {
      let Voter = await votingPlus.getVoter(voter1.address);
      assert(Voter.hasVoted === false);
      await expect(votingPlus.connect(voter1).setVote(0))
        .to.emit(votingPlus, "Voted")
        .withArgs(voter1.address, 0);

      Voter = await votingPlus.getVoter(voter1.address);
      assert(Voter.hasVoted === true);
      assert(Voter.votedProposalId === 0n);

      await expect(votingPlus.connect(voter2).setVote(3))
        .to.emit(votingPlus, "Voted")
        .withArgs(voter2.address, 3);
      Voter = await votingPlus.getVoter(voter2.address);
      assert(Voter.hasVoted === true);
      assert(Voter.votedProposalId === 3n);

      await expect(votingPlus.connect(voter3).setVote(4))
        .to.emit(votingPlus, "Voted")
        .withArgs(voter3.address, 4);
      Voter = await votingPlus.getVoter(voter3.address);
      assert(Voter.hasVoted === true);
      assert(Voter.votedProposalId === 4n);

      await expect(votingPlus.connect(voter4).setVote(3))
        .to.emit(votingPlus, "Voted")
        .withArgs(voter4.address, 3);
      Voter = await votingPlus.getVoter(voter4.address);
      assert(Voter.hasVoted === true);
      assert(Voter.votedProposalId === 3n);

      let Proposal = await votingPlus.getOneProposal(0);
      assert(Proposal.voteCount === 1n);

      Proposal = await votingPlus.getOneProposal(1);
      assert(Proposal.voteCount === 0n);

      Proposal = await votingPlus.getOneProposal(2);
      assert(Proposal.voteCount === 0n);

      Proposal = await votingPlus.getOneProposal(3);
      assert(Proposal.voteCount === 2n);

      Proposal = await votingPlus.getOneProposal(4);
      assert(Proposal.voteCount === 1n);
    });

    it("should revert, the owner can not tally vote during vote session", async () => {
      await expect(votingPlus.tallyDraw()).to.be.revertedWith(
        "Current status is not voting session ended"
      );
    });
  });

  describe("Tally vote phase", async () => {
    beforeEach(async () => {
      ({ votingPlus, owner, voter1, voter2, voter3, voter4, simpleUser } =
        await loadFixture(deployVotingPlusfixtureWithVotersVotingSessionEnded));
    });

    it("should revert voter can no more voting in tally session", async () => {
      await expect(votingPlus.connect(voter1).setVote(0)).to.be.revertedWith(
        "Voting session havent started yet"
      );
    });

    it("should revert only owner can tally the votes", async () => {
      await expect(
        votingPlus.connect(voter1).tallyDraw()
      ).to.be.revertedWithCustomError(votingPlus, "OwnableUnauthorizedAccount");
    });

    it("should change workflow state, emit the workflow change status and define the winning proposal", async () => {
      const previousStatus = await votingPlus.workflowStatus();
      await expect(votingPlus.tallyDraw())
        .to.emit(votingPlus, "WorkflowStatusChange")
        .withArgs(previousStatus, previousStatus + 1n);

      let proposalID = await votingPlus.winningProposalsID(0);
      assert(proposalID === 3n);

      proposalID = await votingPlus.connect(voter1).winningProposalsID(0);
      assert(proposalID === 3n);

      proposalID = await votingPlus.connect(simpleUser).winningProposalsID(0);
      assert(proposalID === 3n);

      const currentStatus = await votingPlus.workflowStatus();
      assert(currentStatus === previousStatus + 1n);
    });
  });
});
