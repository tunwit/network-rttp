import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";

const client = await RTTP.connect({ host: "localhost", port: 3308 });
client.onMessage((connection, message) => {
  Logger.log(connection, message);
  if (
    (message.operation === RTTPOperation.REGISTER_DRIVER || message.operation === RTTPOperation.REGISTER_PASSENGER) &&
    message.type === RTTPType.ACKN
  ) {
    const driverId = message.payload.driverid;
    client.identify({ id: driverId, role: ConnectionRole.DRIVER });
  }
});

const message = RTTPEncoder.encode({
  id: null,
  role: ConnectionRole.UNKNOWN,
  version: "1.0",
  type: RTTPType.INFORM,
  operation: RTTPOperation.REGISTER_PASSENGER,
  payload: {
    name: "sd",
  },
});

client.send(message);

const message2 = RTTPEncoder.encode({
  id: client.getIdentity()?.id || null,
  role: client.getIdentity()?.role || ConnectionRole.UNKNOWN,
  version: "1.0",
  type: RTTPType.INFORM,
  operation: RTTPOperation.REQUEST_RIDE,
  payload: {
    lat: "40.7128",
    lng: "-74.0060",
  },
});

client.send(message2);

// connection.close();
