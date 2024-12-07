import Block from "./Block";
import { blockFromJSON } from "./Block";
import { transactionFromJSON } from "./Transaction";
import { rerender } from "../store";
import { publish, subscribeTo } from "../network";
import { maxBy, reduce, unfold, reverse, values, prop } from "ramda";

class Blockchain {
  constructor(name) {
    this.name = name;
    this.genesis = null;
    this.blocks = {};
    this.pendingTransactions = {};

    this.createGenesisBlock();

    this._subscribeToNetwork();

    
    publish("REQUEST_BLOCKS", { blockchainName: this.name });
  }

  _subscribeToNetwork() {
    
    subscribeTo("BLOCKS_BROADCAST", ({ blocks, blockchainName }) => {
      if (blockchainName === this.name) {
        blocks.forEach((block) => this._addBlock(blockFromJSON(this, block)));
      }
    });

    
    subscribeTo("TRANSACTION_BROADCAST", ({ transaction, blockchainName }) => {
      if (blockchainName === this.name) {
        this.pendingTransactions[transaction.hash] = transactionFromJSON(
          transaction
        );
      }
    });

    
    subscribeTo("REQUEST_BLOCKS", ({ blockchainName }) => {
      if (blockchainName === this.name)
        publish("BLOCKS_BROADCAST", {
          blockchainName,
          blocks: Object.values(this.blocks).map((b) => b.toJSON()),
        });
    });
  }

  maxHeightBlock() {
    const blocks = values(this.blocks);
    if (blocks.length === 0) return null;

    const maxByHeight = maxBy(prop("height"));
    return reduce(maxByHeight, blocks[0], blocks);
  }

  longestChain() {
    const getParent = (block) =>
      block ? [block, this.blocks[block.parentHash]] : false;
    return reverse(unfold(getParent, this.maxHeightBlock()));
  }

  createGenesisBlock() {
    const block = new Block({
      blockchain: this,
      parentHash: "root",
      height: 1,
      nonce: this.name,
      coinbaseBeneficiary: "root",
      difficulty: 2, 
    });
    this.blocks[block.hash] = block;
    this.genesis = block;
  }

  containsBlock(block) {
    return this.blocks[block.hash] !== undefined;
  }

  addBlock(newBlock) {
    this._addBlock(newBlock);
    publish("BLOCKS_BROADCAST", {
      blocks: [newBlock.toJSON()],
      blockchainName: this.name,
    });
  }

  _addBlock(block) {
    if (!block.isValid()) return;
    if (this.containsBlock(block)) return;

    const parent = this.blocks[block.parentHash];
    if (!parent || parent.height + 1 !== block.height) return;

    
    if (block.difficulty !== this._calculateDifficulty(block)) return;

    const isParentMaxHeight = this.maxHeightBlock().hash === parent.hash;

    
    const newUtxoPool = parent.utxoPool.clone();
    block.utxoPool = newUtxoPool;

    
    block.utxoPool.addUTXO(block.coinbaseBeneficiary, 12.5);

    
    const transactions = block.transactions;
    block.transactions = {};
    let containsInvalidTransactions = false;

    Object.values(transactions).forEach((transaction) => {
      if (block.isValidTransaction(transaction)) {
        block.addTransaction(transaction);

        
        if (isParentMaxHeight && this.pendingTransactions[transaction.hash]) {
          delete this.pendingTransactions[transaction.hash];
        }
      } else {
        containsInvalidTransactions = true;
      }
    });

    if (containsInvalidTransactions) return;

    this.blocks[block.hash] = block;
    rerender();
  }

  _calculateDifficulty(block) {
    if (!block || block.isRoot()) return 2; 
    const parent = this.blocks[block.parentHash];
    const timeTaken = block.timestamp - parent.timestamp;

    const targetTime = 10000; 
    if (timeTaken < targetTime / 2) {
      return parent.difficulty + 1; 
    } else if (timeTaken > targetTime * 2) {
      return Math.max(1, parent.difficulty - 1); 
    }
    return parent.difficulty;
  }

  validateChain() {
    for (const block of this.longestChain()) {
      if (!block.isValid()) return false;
    }
    return true;
  }

  logChain() {
    console.log(`Blockchain "${this.name}" State:`);
    console.log("===============================");
    this.longestChain().forEach((block) => {
      console.log(`Block ${block.height}:`);
      console.log(`- Hash: ${block.hash}`);
      console.log(`- Parent Hash: ${block.parentHash}`);
      console.log(`- Difficulty: ${block.difficulty}`);
      console.log(`- Transactions: ${Object.keys(block.transactions).length}`);
      console.log("-------------------------------");
    });
  }
}

export default Blockchain;
