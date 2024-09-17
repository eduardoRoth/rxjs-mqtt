import { map, OperatorFunction, pipe } from "rxjs";
import { MessagePacket } from "@eduardorothdev/rxjs-mqtt/types";

export type typedMessage<T> = Omit<MessagePacket, "payload"> & {
  payload: T | string;
};

function parsePayload<T>(
  parser: (buffer: Buffer) => T | string = (buffer: Buffer) =>
    buffer.toString(),
): OperatorFunction<MessagePacket, typedMessage<T>> {
  return pipe(
    map(
      (v): typedMessage<T> => ({
        ...v,
        payload: parser(v.payload),
      }),
    ),
  );
}

function parsePayloadToJSON<T>(): OperatorFunction<
  MessagePacket,
  typedMessage<T>
> {
  return parsePayload<T>((buffer) => JSON.parse(buffer.toString()));
}

export { parsePayload, parsePayloadToJSON };
