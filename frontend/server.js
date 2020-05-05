const httpProxy = require("http-proxy");
const express = require("express");
const app = express();
const port = 3000;
const proxy = httpProxy.createProxyServer({});

app.use(express.static("../assets"));

app.all("*", (req, res) => {
  console.log(req);
  proxy.web(req, res, { target: "http://localhost:1337" });
});

app.all("*", (req, res) => {
  proxy.web(req, res, { target: "http://localhost:1337" });
});

const server = require("http").createServer(app);
server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head, { target: "http://localhost:1337" });
});
server.listen(port);
console.log(`Listening on port ${port}`);
