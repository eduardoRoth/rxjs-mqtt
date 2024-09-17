import { map, OperatorFunction, pipe } from "rxjs";
import { MessagePacket } from "@eduardorothdev/rxjs-mqtt/types";

function parsePayload<T>(
  parser: (buffer: Buffer) => T | string = (buffer: Buffer) =>
    buffer.toString(),
): OperatorFunction<
  MessagePacket,
  Omit<MessagePacket, "payload"> & { payload: T | string }
> {
  return pipe(
    map((v) => ({
      ...v,
      payload: parser(v.payload),
    })),
  );
}

function parsePayloadToJSON<T>() {
  return parsePayload<T | JSON>((buffer) => JSON.parse(buffer.toString()));
}

export { parsePayload, parsePayloadToJSON };
