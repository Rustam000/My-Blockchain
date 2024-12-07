import { clone } from 'ramda';
import UTXO from './UTXO';

export default class UTXOPool {
  constructor(utxos = new Map()) {
    this.utxos = utxos;
  }

  addUTXO(publicKey, amount) {
    const utxo = this.utxos.get(publicKey);

    if (utxo) {
      utxo.amount += amount;
    } else {
      const newUtxo = new UTXO(publicKey, amount);
      this.utxos.set(publicKey, newUtxo);
    }
  }

  handleTransaction(transaction, feeReceiver) {
    if (!this.isValidTransaction(transaction)) {
      throw new Error(this.addingTransactionErrorMessage(transaction));
    }

    const inputUTXO = this.utxos.get(transaction.inputPublicKey);
    if (inputUTXO) {
      inputUTXO.amount -= transaction.amount + transaction.fee;

      if (inputUTXO.amount === 0) {
        this.utxos.delete(transaction.inputPublicKey);
      }
      
      this.addUTXO(transaction.outputPublicKey, transaction.amount);
      this.addUTXO(feeReceiver, transaction.fee);
    }
  }

  isValidTransaction(transaction) {
    const { inputPublicKey, amount, fee } = transaction;
    const utxo = this.utxos.get(inputPublicKey);
    return utxo !== undefined && utxo.amount >= (amount + fee) && amount > 0;
  }

  addingTransactionErrorMessage(transaction) {
    const { inputPublicKey, amount, fee } = transaction;
    const utxo = this.utxos.get(inputPublicKey);

    if (!utxo) {
      return "No UTXO was associated with this public key";
    }
    if (amount <= 0) {
      return "Amount has to be at least 0";
    }
    if (utxo.amount < amount + fee) {
      return `UTXO associated with this public key (${utxo.amount}) does not cover desired amount (${amount}) and fee (${fee})`;
    }

    return "Unknown error"; 
  }

  clone() {
    return new UTXOPool(new Map(this.utxos));
  }
}
