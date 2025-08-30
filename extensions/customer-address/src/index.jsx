// TODO: expand logic later
import React from "react";
import ReactDOM from "react-dom";

function App() {
  return <div>Address Validator++ [Customer Address]</div>;
}

const containerId = "avpp-customer-address-root";
let mountNode = document.getElementById(containerId);
if (!mountNode) {
  mountNode = document.createElement("div");
  mountNode.id = containerId;
  document.body.appendChild(mountNode);
}

ReactDOM.render(<App />, mountNode);

