#!/usr/bin/env node

import { parseArgs } from "node:util";
import * as readline from "node:readline";
import { authWebsocket, createServerContext } from "./api";
import { websocketResponseSchema } from "./api-schema";
import { z } from "zod";
// import dotenv from "dotenv";
import "dotenv/config";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const { values, positionals } = parseArgs({
  args: process.argv,
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

let { key: API_KEY, url: API_URL, server: SERVER_ID } = values;
API_KEY = API_KEY ?? process.env.PTEROCLI_API_KEY;
API_URL = API_URL ?? process.env.PTEROCLI_API_URL;
SERVER_ID = SERVER_ID ?? process.env.PTEROCLI_SERVER_ID;

if (!API_KEY) {
  console.log("pterodactyl api key not found, use the --key flag or specify a PTEROCLI_API_KEY environment variable");
  process.exit(1);
}
if (!API_URL) {
  console.log("pterodactyl api url not found, use the --url flag or specify a PTEROCLI_API_URL environment variable");
  process.exit(1);
}
if (!SERVER_ID) {
  console.log("pterodactyl server id not found, use the --server flag or specify a PTEROCLI_SERVER_ID environment variable");
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

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ event: "auth", args: [token] }));
});

// readline stuffs

const historyFile = join(tmpdir(), 'ptcli_history');
if (!existsSync(historyFile)) {
  writeFileSync(historyFile, '');
}
const history = readFileSync(historyFile, 'utf-8').split('\n').filter(Boolean);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
  terminal: true,
  history: history,
  historySize: 100,
});

function log(...args: any[]) {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  console.log(...args);
  rl.prompt();
}

function error(...args: any[]) {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  console.error(...args);
  rl.prompt();
}

// stdout

socket.addEventListener("message", (msg) => {
  const json = JSON.parse(msg.data);
  const parseResult = z.safeParse(websocketResponseSchema, json);
  if (!parseResult.success) {
    error(`Error parsing socket event: ${parseResult.error.message}`);
    return;
  }
  const data = parseResult.data;
  if (data.event == "auth success") {
    socket.send(JSON.stringify({ event: "send logs", args: [null] }));
  }
  if (data.event == "console output") {
    log(data.args[0]);
  }
});

socket.addEventListener("close", (e) => {
  error(e.reason);
});

// stdin

rl.on("line", (line) => {
  socket.send(
    JSON.stringify({
      event: "send command",
      args: [line],
    }),
  );
});

rl.addListener('history', (history) => {
  writeFileSync(historyFile, history.join('\n'));
})
