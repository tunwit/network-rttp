import { RTTPEncoder } from "./protocal/core/RTTPEncoder";
import type { RTTPConnection } from "./protocal/instance/connection";
import type { RTTPServer } from "./protocal/instance/server";
import { RTTP } from "./protocal/protocal";
import { RTTPOperation, RTTPType } from "./protocal/types/enum";
import { ConnectionRole } from "./protocal/types/type";
import { Logger } from "./protocal/utils/logger";

const server = await RTTP.listen({
  host: "localhost",
  port: 3308,
  locationServer: { host: "127.0.0.1", port: 3309 },
});
server.on(RTTPOperation.ESTAB, (connection, request) => {
  console.log("Client Connected");
});

server.on(RTTPOperation.REGISTER_DRIVER, (connection, request) => {
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
  const passengerId = "P001";

  connection.setRemoteIdentity({
    role: ConnectionRole.PASSENGER,
    id: passengerId,
  });

  connection.ackn(
    {
      operation: RTTPOperation.REGISTER_PASSENGER,
      type: RTTPType.ACKN,
      status: 201,
      payload: { passengerid: passengerId },
    },
    request.requestid,
  );
});

async function waitForDriver(server: RTTPServer): Promise<RTTPConnection> {
  while (true) {
    const driver = server
      .getConnections()
      .find((c) => c.getRemoteIdentity()?.role === ConnectionRole.DRIVER);

    if (driver) return driver;

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
}

server.on(RTTPOperation.REQUEST_RIDE, async (connection, request) => {
  const driverConnect = await waitForDriver(server);

  const driverLat = "40.7128";
  const driverLng = "-74.0060";

  connection.ackn(
    {
      operation: RTTPOperation.REQUEST_RIDE,
      type: RTTPType.ACKN,
      status: 201,
      payload: {
        driverid: driverConnect.getRemoteIdentity()?.id,
        driverlat: driverLat,
        driverlng: driverLng,
      },
    },
    request.requestid,
  );

  driverConnect.inform({
    operation: RTTPOperation.OFFER_RIDE,
    type: RTTPType.INFORM,
  });
});

//Accept ride from driver
server.on(RTTPOperation.OFFER_RIDE, (connection, request) => {
  if (request.type !== RTTPType.ACKN) return;

  connection.inform({
    operation: RTTPOperation.ACCEPT_RIDE,
    type: RTTPType.INFORM,
  });
});

server.on(RTTPOperation.START_LOCATION, (connection, request) => {
  connection.ackn(
    {
      operation: RTTPOperation.START_LOCATION,
      type: RTTPType.ACKN,
      status: 200,
      payload: {
        locationtoken: "abc123",
      },
    },
    request.requestid,
  );
});

server.on(RTTPOperation.END_LOCATION, (connection, request) => {
  connection.ackn(
    {
      operation: RTTPOperation.END_LOCATION,
      type: RTTPType.ACKN,
      status: 200,
    },
    request.requestid,
  );
});

server.on(RTTPOperation.END_RIDE, (connection, request) => {
  if (request.type !== RTTPType.INFORM) return;
  const passenger = server
    .getConnections()
    .find((c) => c.getRemoteIdentity()?.id === "P001");

  connection.ackn(
    {
      operation: RTTPOperation.END_RIDE,
      type: RTTPType.ACKN,
      status: 200,
    },
    request.requestid,
  );

  if (!passenger) return;
  passenger.inform({
    operation: RTTPOperation.END_RIDE,
    type: RTTPType.INFORM,
  });
});

server.on(RTTPOperation.FIN, (connection, request) => {
  connection.ackn(
    {
      operation: RTTPOperation.FIN,
      type: RTTPType.ACKN,
      status: 200,
    },
    request.requestid,
  );
  connection.close();
});

server.onLocationMessage((message, port, addr) => {
  Logger.log(message);
});

server.onMessage((connection, message) => {
  Logger.log(message);
});

console.log(`RTTP Server is listening at localhost:3308`);
console.log(`RTTP Location Server is listening at localhost:3309`);
