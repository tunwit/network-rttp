export type ConnectionOptions = {
  host: string;
  port: number;
  locationServer: {
    host: string;
    port: number;
  };
};
export type ServerOptions = {
  host: string;
  port: number;

  locationServer: {
    host: string;
    port: number;
  };
};

export type ConnectionIdentity = {
  role: ConnectionRole;
  id: string | null;
};

export enum ConnectionRole {
  DRIVER = "DRIVER",
  PASSENGER = "PASSENGER",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}
export type Pair<T, U> = [T, U];
