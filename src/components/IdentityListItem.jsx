import React, { Component } from "react";
import Key from "./Key";
import { Tab, Tabs, EditableText } from "@blueprintjs/core";
import { action } from "../store"
export default class IdentityListItem extends Component {
  changeName = (name) => {
    action({type: 'CHANGE_IDENTITY_NAME', publicKey: this.props.identity.publicKey, name })
  }
  render() {
    return (
      <div style={{marginBottom: '10px'}}>
        <h6><EditableText value={this.props.identity.name} onChange={this.changeName}/></h6>
        <Tabs>
          <Tab
            id="public"
            title="Public Key"
            panel={<Key value={this.props.identity.publicKey} />}
          />
          <Tab
            id="private"
            title="Private Key"
            panel={
              <textarea
                className="pt-input"
                spellCheck={false}
                style={{ width: "100%", height: "100px" }}
                value={this.props.identity.privateKey}
                readOnly
              />
            }
          />
        </Tabs>
      </div>
    );
  }
}
