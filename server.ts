import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";

const server = await RTTP.listen({ host: "localhost", port: 888 });
server.on(RTTPOperation.ESTAB, (connection, request) => {
  console.log("Client Connected");
});
server.on(RTTPOperation.REGISTER_DRIVER, (connection, request) => {
  Logger.log(connection, request);
  const driverId = "D001";
  const message = RTTPEncoder.encode({
    version: "1.0",
    id: "0",
    role: ConnectionRole.SERVER,
    operation: RTTPOperation.REGISTER_DRIVER,
    type: RTTPType.ACKN,
    status: 201,
    payload: { driverid: driverId },
  });

  connection.identify({
    role: ConnectionRole.DRIVER,
    id: driverId,
  });

  connection.send(message);
});

console.log(`RTTP Server is listening at localhost:888`);
