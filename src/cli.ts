import { parseArgs } from "util";
import { authWebsocket, createServerContext } from "./api";
import { websocketResponseSchema } from "./api-schema";
import z from "zod";
import * as readline from "readline";
// import { prompt } from 'bun';

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    key: {
      type: "string",
    },
    url: {
      type: "string",
    },
    server: {
      type: "string",
    },
  },
  allowPositionals: true,
});

const { key: API_KEY, url: API_URL, server: SERVER_ID } = values;
if (!API_KEY) {
  console.log("--key not found");
  process.exit(1);
}
if (!API_URL) {
  console.log("--url not found");
  process.exit(1);
}
if (!SERVER_ID) {
  console.log("--server not found");
  process.exit(1);
}

const server = createServerContext({
  baseUrl: API_URL,
  serverId: SERVER_ID,
  apiKey: API_KEY,
});

const { token, socket: socketUrl } = await authWebsocket(server);
const socket = new WebSocket(socketUrl, {
  headers: {
    authorization: `Bearer ${token}`,
    origin: API_URL,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
  terminal: true,
});

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ event: "auth", args: [token] }));
});

socket.addEventListener("message", (msg) => {
  const json = JSON.parse(msg.data);
  const parseResult = z.safeParse(websocketResponseSchema, json);
  if (!parseResult.success) {
    console.error(`Error parsing socket event: ${parseResult.error.message}`);
    return;
  }
  const data = parseResult.data;
  if (data.event == "auth success") {
    socket.send(JSON.stringify({ event: "send logs", args: [null] }));
  }
  if (data.event == "console output") {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    console.log(data.args[0]);
    rl.prompt(true);
  }
});

socket.addEventListener("close", (e) => {
  console.log(e.reason);
});

rl.on("line", (line) => {
  socket.send(
    JSON.stringify({
      event: "send command",
      args: [line],
    }),
  );
});
