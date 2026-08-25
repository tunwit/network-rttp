import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";
import { createInterface } from "node:readline/promises";
import * as readline from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });

const driver = await RTTP.connect({
  host: "localhost",
  port: 3308,
  locationServer: { host: "127.0.0.1", port: 3309 },
});

driver.onMessage((connection, message) => {
  Logger.log(message);
});

driver.onMessage((connection, message) => {
  if (message.operation === RTTPOperation.ESTAB) {
    console.log("Connected to server");
    driver.setRemoteIdentity({ role: message.role, id: message.id });
  }
});

driver.onMessage((connection, message) => {
  if (message.operation === RTTPOperation.OFFER_RIDE) {
    console.log("Ride offer received");
    connection.ackn(
      {
        operation: RTTPOperation.OFFER_RIDE,
        type: RTTPType.ACKN,
        status: 200,
      },
      message.requestid,
    );
  }
});

type Mode = "idle" | "ride";
let mode: Mode = "idle";
let quitting = false;
let rideEndSignal: (() => void) | null = null;

const IDLE_PROMPT = "Waiting for ride offers. Press 'q' to quit: ";
const RIDE_PROMPT = "Ride in progress. Press Enter to end the ride: ";

// Overwrite whatever is currently on the prompt line immediately,
// instead of waiting for the user to press Enter to see the new prompt.
function repaintPrompt(promptText: string) {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(promptText);
}

function enterRideMode() {
  mode = "ride";
  repaintPrompt(RIDE_PROMPT);
}

function enterIdleMode() {
  mode = "idle";
  repaintPrompt(IDLE_PROMPT);
}

//confirm ride offer by server
driver.onMessage(async (connection, message) => {
  if (message.operation === RTTPOperation.ACCEPT_RIDE) {
    console.log("Ride offer accepted");
    enterRideMode();

    const start = await connection.inform({
      operation: RTTPOperation.START_LOCATION,
      type: RTTPType.INFORM,
      status: 200,
    });

    void (async () => {
      let lat = 40.7128;
      let lng = -74.006;

      while (mode === "ride") {
        await driver.reportLocation(
          {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
          },
          start.payload.locationtoken,
        );

        lat += 0.0001;
        lng += 0.0001;

        await Bun.sleep(1000);
      }
    })();

    // Wait for driverFlow() to receive the Enter keypress and signal us,
    // instead of calling rl.question() again here.
    await new Promise<void>((resolve) => {
      rideEndSignal = resolve;
    });

    connection.inform({
      operation: RTTPOperation.END_LOCATION,
      type: RTTPType.INFORM,
      payload: {
        locationtoken: start.payload.locationtoken,
      },
    });
    connection.inform({
      operation: RTTPOperation.END_RIDE,
      type: RTTPType.INFORM,
    });
  }
});

async function driverFlow() {
  while (!quitting) {
    const command = await rl.question(
      mode === "ride" ? RIDE_PROMPT : IDLE_PROMPT,
    );

    if (mode === "ride") {
      // Any input while a ride is active ends the ride.
      rideEndSignal?.();
      rideEndSignal = null;
      enterIdleMode();
      continue;
    }

    if (command === "q") {
      driver.inform({
        type: RTTPType.INFORM,
        operation: RTTPOperation.FIN,
      });
      quitting = true;
      driver.close();
      rl.close();
      break;
    }
  }
}

const registerDriver = await driver.inform({
  type: RTTPType.INFORM,
  operation: RTTPOperation.REGISTER_DRIVER,
  payload: {
    name: "sd",
  },
});

console.log("Registered driver with id:", registerDriver.payload.driverid);
driver.setLocalIdentity({
  role: ConnectionRole.DRIVER,
  id: registerDriver.payload.driverid,
});

void driverFlow();