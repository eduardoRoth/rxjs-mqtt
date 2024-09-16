import { IPublishPacket } from "mqtt";

export type MessagePacket = {
  topic: string;
  payload: Buffer;
  packet: IPublishPacket;
};
