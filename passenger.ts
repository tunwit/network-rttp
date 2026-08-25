import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });

let rideActive = false;
let quitting = false;
let rideEndedResolve: (() => void) | null = null;

const client = await RTTP.connect({
  host: "localhost",
  port: 3308,
  locationServer: { host: "localhost", port: 3309 },
});
client.onMessage((connection, message) => {
  if (message.operation === RTTPOperation.ESTAB) {
    console.log("Connected to server");
    client.setRemoteIdentity({ role: message.role, id: message.id });
  }
});
client.onMessage((connection, message) => {
  if (
    message.operation === RTTPOperation.END_RIDE &&
    message.type === RTTPType.INFORM
  ) {
    rideActive = false;
    console.log("Ride ended");
    connection.ackn(
      {
        operation: RTTPOperation.END_RIDE,
        type: RTTPType.ACKN,
        status: 200,
      },
      message.requestid,
    );
    rideEndedResolve?.();
    rideEndedResolve = null;
  }
});

async function waitForRideToEnd() {
  return new Promise<void>((resolve) => {
    rideEndedResolve = resolve;
  });
}
async function passengerFlow() {
  while (!quitting) {
    if (rideActive) {
      await waitForRideToEnd();
      continue;
    }

    const command = await rl.question(
      "Enter 'r' to request a ride or 'q' to quit: ",
    );

    if (command === "q") {
      client.inform({
        type: RTTPType.INFORM,
        operation: RTTPOperation.FIN,
      });
      client.close();
      quitting = true;
      rl.close();
      break;
    }

    if (command !== "r") {
      continue;
    }

    const registerPassenger = await client.inform({
      type: RTTPType.INFORM,
      operation: RTTPOperation.REGISTER_PASSENGER,
      payload: { name: "sd" },
    });

    client.setLocalIdentity({
      role: ConnectionRole.PASSENGER,
      id: registerPassenger.payload.passengerid,
    });

    console.log("Ride requested, waiting for driver...");

    const requestRide = await client.inform({
      type: RTTPType.INFORM,
      operation: RTTPOperation.REQUEST_RIDE,
      payload: {
        pickuplat: "40.7128",
        pickuplng: "-74.0060",
        destinationlat: "34.0522",
        destinationlng: "-118.2437",
      },
    });

    console.log(
      `Ride request acknowledged with driver ID: ${requestRide.payload.driverid}`,
    );

    rideActive = true;
  }
}
passengerFlow();
