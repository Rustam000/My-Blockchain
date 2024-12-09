import React from "react";
import { Button } from "@blueprintjs/core";
import { action } from "../store";

const AddIdentity = () => {
  const handleAddIdentity = () => {
    action({ type: "ADD_IDENTITY" });
  };

  return (
    <Button
      text="Add another identity"
      icon="add"
      intent="primary"
      className="input-action"
      style={{ paddingLeft: "15px" }}
      onClick={handleAddIdentity}
    />
  );
};

export default AddIdentity;
