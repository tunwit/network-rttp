import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";

const server = await RTTP.listen({ host: "localhost", port: 3308 });
server.on(RTTPOperation.ESTAB, (connection, request) => {
  console.log("Client Connected");
});
server.on(RTTPOperation.REGISTER_DRIVER, (connection, request) => {
  Logger.log(connection, request);
  const driverId = "D001";
  connection.setRemoteIdentity({
    role: ConnectionRole.DRIVER,
    id: driverId,
  });

  connection.ackn(
    {
      operation: RTTPOperation.REGISTER_DRIVER,
      type: RTTPType.ACKN,
      status: 201,
      payload: { driverid: driverId },
    },
    request.requestid,
  );
});

server.on(RTTPOperation.REGISTER_PASSENGER, (connection, request) => {
  Logger.log(connection, request);
  const passengerId = "P001";

  connection.setRemoteIdentity({
    role: ConnectionRole.PASSENGER,
    id: passengerId,
  });

  connection.ackn({
    operation: RTTPOperation.REGISTER_PASSENGER,
    type: RTTPType.ACKN,
    status: 201,
    payload: { passengerid: passengerId },
  }, request.requestid);
});

server.on(RTTPOperation.REQUEST_RIDE, (connection, request) => {
  Logger.log(connection, request);
  const findedDriverId = "D001";
  const driverLat = "40.7128";
  const driverLng = "-74.0060";

  connection.ackn(
    {
      operation: RTTPOperation.REQUEST_RIDE,
      type: RTTPType.ACKN,
      status: 201,
      payload: {
        driverid: findedDriverId,
        driverlat: driverLat,
        driverlng: driverLng,
      },
    },
    request.requestid,
  );
});

console.log(`RTTP Server is listening at localhost:3308`);
