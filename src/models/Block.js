import sha256 from "crypto-js/sha256";
import UTXOPool from "./UTXOPool";
import { map } from "ramda";
import { transactionFromJSON } from "./Transaction";

const INITIAL_DIFFICULTY = 2;
const TARGET_BLOCK_TIME = 10000; 

class Block {
  constructor(opts) {
    const {
      blockchain,
      parentHash,
      height,
      coinbaseBeneficiary,
      nonce,
      utxoPool,
      transactions,
      timestamp,
      difficulty,
    } = {
      coinbaseBeneficiary: "root",
      nonce: "",
      utxoPool: new UTXOPool(),
      transactions: {},
      timestamp: Date.now(), 
      difficulty: INITIAL_DIFFICULTY, 
      ...opts,
    };

    this.blockchain = blockchain;
    this.nonce = nonce;
    this.parentHash = parentHash;
    this.height = height;
    this.coinbaseBeneficiary = coinbaseBeneficiary;
    this.utxoPool = utxoPool;
    this.transactions = map(transactionFromJSON)(transactions);
    this.timestamp = timestamp;
    this.difficulty = difficulty;
    this.blockID = this._generateBlockID(); 
    this._setHash();

    
    this.expanded = true;
  }

  isRoot() {
    return this.parentHash === "root";
  }

  isValid() {
    return (
      this.isRoot() ||
      (this.hash.substr(-this.difficulty) === "0".repeat(this.difficulty) &&
        this.hash === this._calculateHash())
    );
  }

  createChild(coinbaseBeneficiary) {
    const block = new Block({
      blockchain: this.blockchain,
      parentHash: this.hash,
      height: this.height + 1,
      utxoPool: this.utxoPool.clone(),
      coinbaseBeneficiary,
      timestamp: Date.now(),
      difficulty: this.adjustDifficulty(),
    });

    
    block.utxoPool.addUTXO(coinbaseBeneficiary, 12.5);

    return block;
  }

  addTransaction(transaction) {
    if (!this.isValidTransaction(transaction)) return;
    this.transactions[transaction.hash] = transaction;
    this.utxoPool.handleTransaction(transaction, this.coinbaseBeneficiary);
    this._setHash();
  }

  isValidTransaction(transaction) {
    return (
      this.utxoPool.isValidTransaction(transaction) &&
      transaction.hasValidSignature()
    );
  }

  addingTransactionErrorMessage(transaction) {
    if (!transaction.hasValidSignature()) return "Signature is not valid";
    return this.utxoPool.addingTransactionErrorMessage(transaction);
  }

  setNonce(nonce) {
    this.nonce = nonce;
    this._setHash();
  }

  combinedTransactionsHash() {
    if (Object.values(this.transactions).length === 0)
      return "No Transactions in Block";
    return sha256(
      Object.values(this.transactions)
        .map((tx) => tx.hash)
        .join("")
    ).toString();
  }

  adjustDifficulty() {
    if (this.isRoot()) return INITIAL_DIFFICULTY;
    const timeTaken = this.timestamp - this.blockchain.getPreviousBlock(this).timestamp;
    if (timeTaken < TARGET_BLOCK_TIME / 2) {
      return this.difficulty + 1; // 
    } else if (timeTaken > TARGET_BLOCK_TIME * 2) {
      return Math.max(1, this.difficulty - 1); 
    }
    return this.difficulty;
  }

  logBlock() {
    console.log(`
      Block ${this.height}:
      - Hash: ${this.hash}
      - Block ID: ${this.blockID}
      - Parent Hash: ${this.parentHash}
      - Coinbase Beneficiary: ${this.coinbaseBeneficiary}
      - Transactions: ${Object.values(this.transactions).length}
      - Timestamp: ${new Date(this.timestamp).toLocaleString()}
      - Difficulty: ${this.difficulty}
    `);
  }

  toJSON() {
    return {
      hash: this.hash,
      blockID: this.blockID,
      nonce: this.nonce,
      parentHash: this.parentHash,
      height: this.height,
      coinbaseBeneficiary: this.coinbaseBeneficiary,
      timestamp: this.timestamp,
      difficulty: this.difficulty,
      transactions: map((transaction) => transaction.toJSON(), this.transactions),
    };
  }

  _setHash() {
    this.hash = this._calculateHash();
  }

  _calculateHash() {
    return sha256(
      this.nonce +
        this.parentHash +
        this.coinbaseBeneficiary +
        this.timestamp +
        this.combinedTransactionsHash()
    ).toString();
  }

  _generateBlockID() {
    return sha256(this.hash + this.height).toString().substr(0, 8); // Генерируем уникальный ID
  }
}

export default Block;

export function blockFromJSON(blockchain, data) {
  return new Block({
    ...data,
    blockchain,
  });
}
