import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";

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

const registerPassenger = await client.inform({
  type: RTTPType.INFORM,
  operation: RTTPOperation.REGISTER_PASSENGER,
  payload: {
    name: "sd",
  },
});

client.setLocalIdentity({
  role: ConnectionRole.PASSENGER,
  id: registerPassenger.payload.passengerid,
});

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
