import React, { Component } from "react";
import BlockchainTree from "./BlockchainTree";
// import IdentityListItem from "./IdentityListItem";
import { Tab, Tabs, Tooltip } from "@blueprintjs/core";
// import WelcomeUTXOPoolTable from "./WelcomeUTXOPoolTable";
import "../App.css";
import AddIdentity from "./AddIdentity";
import { Tooltip as WalkthroughTooltip } from "./walkthrough";

class BlockchainWelcome extends Component {
  renderUTXOTab = () => {
    const { blockchain } = this.props;

    const content = blockchain.maxHeightBlock().isRoot() ? (
      <p>The root block has no unspent transaction outputs.</p>
    ) : (
      <WelcomeUTXOPoolTable blockchain={blockchain} />
    );

    return (
      <div>
        <p>
          This is the{" "}
          <Tooltip
            className="pt-tooltip-indicator"
            inline={true}
            content={
              "A UTXO pool is a list of UTXOs, which are 'owned' by the public key, and can be 'spent' with the corresponding private key."
            }
          >
            UTXO pool
          </Tooltip>{" "}
          for the longest chain. You can click on UTXOs to broadcast a
          transaction.
        </p>
        {content}
      </div>
    );
  };

  renderIdentitiesTab = () => {
    const { identities } = this.props;

    return (
      <WalkthroughTooltip
        content={
          <p style={{ maxWidth: "250px" }}>
            Ownership of coins is established via control over public keys with
            their corresponding private keys. Here you find the pairs that you
            generated and thus control exclusively. You can change their names
            for your convenience.
          </p>
        }
        nextLabel="Next"
        step={5}
        quitWalkthroughVisible={true}
      >
        <div>
          {Object.values(identities).map((identity) => (
            <IdentityListItem key={identity.publicKey} identity={identity} />
          ))}
          <AddIdentity />
        </div>
      </WalkthroughTooltip>
    );
  };

  render() {
    const { blockchain, identities, node } = this.props;

    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        
        <div style={{ flex: "2" }}>
          <h3>Blockchain Visualization</h3>
          <BlockchainTree
            blockchain={blockchain}
            identities={identities}
            node={node}
          />
        </div>

       
        <div style={{ flex: "1", marginLeft: "20px" }}>
          <Tabs>
            <Tab id="utxo" title="UTXOPool" panel={this.renderUTXOTab()} />
            <Tab id="nodes" title="Identities" panel={this.renderIdentitiesTab()} />
          </Tabs>
        </div>
      </div>
    );
  }
}

export default BlockchainWelcome;
