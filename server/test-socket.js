import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("connected", socket.id);
  socket.emit('joinAuction', 'auction1');
});

socket.on("auctionState", (state) => {
  console.log("auctionState:", state);
});

socket.on("timeUpdate", (t) => {
  console.log("timeUpdate:", t);
});

socket.on("bidUpdate", (b) => {
  console.log("bidUpdate:", b);
});

socket.on("disconnect", () => {
  console.log("disconnected");
});

// Run for 6 seconds then exit
setTimeout(() => {
  socket.disconnect();
  process.exit(0);
}, 6000);
