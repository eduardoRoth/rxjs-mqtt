import { map, OperatorFunction, pipe, tap } from "rxjs";
import { MessagePacket } from "@eduardorothdev/rxjs-mqtt/types";

export type TypedMessage<T> = Omit<MessagePacket, "payload"> & {
  payload: T;
};

function parsePayload<T>(
  parser: (buffer: Buffer) => T,
): OperatorFunction<MessagePacket, TypedMessage<T>> {
  return pipe(
    map((v) => ({
      ...v,
      payload: parser(v.payload),
    })),
  );
}

function parsePayloadToString(): OperatorFunction<
  MessagePacket,
  TypedMessage<string>
> {
  return pipe(
    map((v) => ({
      ...v,
      payload: v.payload.toString(),
    })),
  );
}

function parsePayloadToType<T>(): OperatorFunction<
  MessagePacket,
  TypedMessage<T>
> {
  return pipe(
    map((v) => ({
      ...v,
      payload: JSON.parse(v.payload.toString()),
    })),
  );
}

export { parsePayload, parsePayloadToString, parsePayloadToType };
