import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";

const driver = await RTTP.connect({
  host: "localhost",
  port: 3308,
  locationServer: { host: "127.0.0.1", port: 3309 },
});

driver.onMessage((connection, message) => {
  Logger.log(connection, message);
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
    // Handle ride offer
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

//confirm ride offer by server
driver.onMessage(async (connection, message) => {
  if (message.operation === RTTPOperation.ACCEPT_RIDE) {
    console.log("Ride offer accepted");
    const start = await connection.inform({
      operation: RTTPOperation.START_LOCATION,
      type: RTTPType.INFORM,
      status: 200,
    });

    await driver.reportLocation(
      { lat: "40.7128", lng: "-74.0060" },
      start.payload.locationtoken,
    );
  }
});

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
