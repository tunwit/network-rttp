import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";

const client = await RTTP.connect({ host: "localhost", port: 888 });
client.onMessage((connection, message) => {
  Logger.log(connection, message);
  if (
    message.operation === RTTPOperation.REGISTER_DRIVER &&
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
  operation: RTTPOperation.REGISTER_DRIVER,
  payload: {
    name: "sd",
  },
});

client.send(message);

// connection.close();
