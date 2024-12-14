import React, { Component } from "react";
import SortableTree, { getTreeFromFlatData } from '@nosferatu500/react-sortable-tree';
// import { getTreeFromFlatData } from "@nosferatu500/react-sortable-tree";
import { Button, Dialog } from "@blueprintjs/core";
import { last, pipe, pluck} from "ramda";
import { contains } from "ramda";
import NewBlock from "./NewBlock";
import DetailBlock from "./DetailBlock";
import { Tooltip, advanceTo, Dialog as WalkthroughDialog } from "./walkthrough";

class BlockchainWelcome extends Component {
  state = {
    addBlock: null,
    showBlock: null,
  };

  addBlockFrom = (parent) => {
    const parentBlock = parent.blockchain.blocks[parent.hash];
    this.setState({
      addBlock: parentBlock.createChild(this.props.node.publicKey),
    });
  };

  showBlock = (block) => () => {
    const showBlock = block.blockchain.blocks[block.hash];
    this.setState({ showBlock });
  };

  closeAddBlock = () => this.setState({ addBlock: null });

  closeShowBlock = () => this.setState({ showBlock: null });

  generateNodeProps = (longestChain) => ({ node }) => {
    const addBlock = () => {
      this.addBlockFrom(node);
      advanceTo(3);
    };

    const isMaxHeightBlock = last(longestChain).hash === node.hash;
    const isPartOfLongestChain = pipe(pluck("hash"), contains(node.hash))(longestChain);

    return {
      buttons: [
        <Button key="detail" icon="database" onClick={this.showBlock(node)} />,
        isMaxHeightBlock ? (
          <Tooltip
            content={
              <p style={{ maxWidth: "250px" }}>
                Mining blocks means adding blocks to another parent block by pointing to it in the block header.
                Unless someone else gives you coins, mining is the only way for you to get coins. Let's start here.
              </p>
            }
            next={addBlock}
            nextLabel="Start mining!"
            step={2}
          >
            <Button key="add" text="Add block from here" onClick={addBlock} />
          </Tooltip>
        ) : (
          <Button key="add" text="Add block from here" onClick={addBlock} />
        ),
      ],
      node: {
        title: `Block ${node.hash.substr(0, 10)}`,
        subtitle: `Height ${node.height}`,
        expanded: true,
      },
      className: isPartOfLongestChain ? "partOfLongestChain" : "",
    };
  };

  render() {
    const { blockchain, node, identities } = this.props;
    const treeData = getTreeFromFlatData({
      flatData: Object.values(blockchain.blocks),
      getKey: (block) => block.hash,
      getParentKey: (block) => block.parentHash,
      rootKey: blockchain.genesis.parentHash,
    });

    const longestChain = blockchain.longestChain();

    return (
      <div style={{ height: 800 }}>
        <SortableTree
          treeData={treeData}
          canDrag={false}
          onChange={(treeData) => this.setState({ treeData })}
          generateNodeProps={this.generateNodeProps(longestChain)}
        />

        <Dialog
          isOpen={this.state.addBlock !== null}
          onClose={this.closeAddBlock}
          title="Add block"
          style={{ width: "95%" }}
        >
          <NewBlock
            block={this.state.addBlock}
            onCancel={this.closeAddBlock}
            node={node}
          />
        </Dialog>

        <WalkthroughDialog step={16} title="The end" nextLabel="Bye!">
          <p>
            Thank you for following this demo. Play around to better understand blockchains.
            Feedback is welcome at{" "}
            <a href="" target="_blank" rel="noopener noreferrer"></a>.
          </p>
        </WalkthroughDialog>

        <Dialog
          isOpen={this.state.showBlock !== null}
          onClose={this.closeShowBlock}
          title="Block Detail"
          style={{ width: "70%" }}
        >
          <DetailBlock
            block={this.state.showBlock}
            onCancel={this.closeShowBlock}
            identities={identities}
          />
        </Dialog>
      </div>
    );
  }
}

export default BlockchainWelcome;
