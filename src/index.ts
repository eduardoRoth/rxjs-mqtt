import {
  IClientOptions,
  IClientReconnectOptions,
  IConnackPacket,
  IPacket,
  ISubscriptionMap,
  MqttClient,
  Packet,
  PacketCallback,
  connect as syncConnect,
  IPublishPacket,
} from "mqtt";
import { Observable, Subscriber } from "rxjs";
import { MessagePacket } from "@eduardorothdev/rxjs-mqtt/types";
import { parsePayloadToJSON } from "@eduardorothdev/rxjs-mqtt/parsers";

class ObsClient {
  _client: MqttClient;

  constructor(client: MqttClient) {
    this._client = client;
  }

  set handleMessage(newHandler: (packet: Packet, cb: PacketCallback) => void) {
    this._client.handleMessage = newHandler;
  }

  get handleMessage() {
    return this._client.handleMessage;
  }

  get connected() {
    return this._client.connected;
  }

  get reconnecting() {
    return this._client.reconnecting;
  }

  publish(...args: [string, string | Buffer]) {
    return new Promise((resolve, reject) => {
      this._client.publish(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  subscribe(...args: [string | string[] | ISubscriptionMap]) {
    return new Promise((resolve, reject) => {
      this._client.subscribe(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  unsubscribe(...args: [string | string[]]) {
    return new Promise((resolve, reject) => {
      this._client.unsubscribe(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  end(force: boolean = false) {
    return new Promise<void>((resolve) => {
      this._client.end(force, () => {
        resolve();
      });
    });
  }

  reconnect(opts: IClientReconnectOptions) {
    return this._client.reconnect(opts);
  }

  addListener(event: string | symbol, listener: (...args: any[]) => void) {
    return this._client.addListener(event, listener);
  }

  emit(event: string | symbol, ...args: any[]) {
    return this._client.emit(event, ...args);
  }

  eventNames() {
    return this._client.eventNames();
  }

  getLastMessageId() {
    return this._client.getLastMessageId();
  }

  getMaxListeners() {
    return this._client.getMaxListeners();
  }

  listenerCount(
    event: string,
    listener?: (...args: any[]) => void | undefined,
  ) {
    return this._client.listenerCount(event, listener);
  }

  listeners(eventName: string | symbol) {
    return this._client.listeners(eventName);
  }

  off(event: string, listener: (...args: any[]) => void) {
    return this._client.off(event, listener);
  }

  on(event: string) {
    return new Observable<MessagePacket>((observer) => {
      const onEvent = receiveMessage(observer);
      this._client.on(event, onEvent);
      return {
        unsubscribe: () => {
          this._client.off(event, onEvent);
        },
      };
    });
  }

  onJsonMessage<T>() {
    return new Observable<MessagePacket>((observer) => {
      const onEvent = receiveMessage(observer);
      this._client.on("message", onEvent);
      return {
        unsubscribe: () => {
          this._client.off("message", onEvent);
        },
      };
    }).pipe(parsePayloadToJSON());
  }

  once(event: string) {
    return new Observable((observer) => {
      this._client.once(
        event,
        (topic: string, message: Buffer, packet: IPacket) => {
          observer.next({ topic, message, packet });
          observer.complete();
        },
      );
    });
  }

  prependListener(event: string, listener: (...args: any[]) => void) {
    return this._client.prependListener(event, listener);
  }

  prependOnceListener(event: string, listener: (...args: any[]) => void) {
    return this._client.prependOnceListener(event, listener);
  }

  rawListeners(event: string) {
    return this._client.rawListeners(event);
  }

  removeAllListeners(eventName?: string | symbol | undefined) {
    return this._client.removeAllListeners(eventName);
  }

  removeListener(event: string, listener: (...args: any[]) => void) {
    return this._client.removeListener(event, listener);
  }

  removeOutgoingMessage(mid: number) {
    return this._client.removeOutgoingMessage(mid);
  }

  setMaxListeners(n: number) {
    return this._client.setMaxListeners(n);
  }
}

function connect(
  brokerURL: string,
  opts: IClientOptions,
  allowRetries = true,
): Promise<ObsClient> {
  const client = syncConnect(brokerURL, opts);
  const obsClient = new ObsClient(client);
  return new Promise((resolve, reject) => {
    const promiseResolutionListeners: {
      connect: (...args: any[]) => void;
      end: (...args: any[]) => void;
      error: (...args: any[]) => void;
      close?: (...args: any[]) => void | undefined;
    } = {
      connect: (connack: IConnackPacket) => {
        removePromiseResolutionListeners();
        resolve(obsClient);
      },
      end: () => {
        removePromiseResolutionListeners();
        resolve(obsClient);
      },
      error: (err: Error) => {
        removePromiseResolutionListeners();
        client.end();
        reject(err);
      },
    };

    if (!allowRetries) {
      promiseResolutionListeners.close = () => {
        promiseResolutionListeners.error(
          new Error("Couldn't connect to the server"),
        );
      };
    }

    function removePromiseResolutionListeners() {
      for (const [eventName, eventFunction] of Object.entries(
        promiseResolutionListeners,
      )) {
        client.removeListener(eventName, eventFunction);
      }
    }

    for (const [eventName, eventFunction] of Object.entries(
      promiseResolutionListeners,
    )) {
      client.on(eventName, eventFunction);
    }
  });
}

function receiveMessage(observer: Subscriber<MessagePacket>) {
  return (topic: string, payload: Buffer, packet: IPublishPacket) => {
    observer.next({ topic, payload, packet });
  };
}

export { connect, ObsClient as MqttClient };

export type {
  // mqtt/types/lib/client
  ISubscriptionGrant,
  ISubscriptionRequest,
  ISubscriptionMap,
  OnMessageCallback,
  OnPacketCallback,
  OnErrorCallback,
  IStream,
  IClientOptions,
  IClientReconnectOptions,
  PacketCallback,

  // mqtt-packet
  QoS,
  PacketCmd,
  IPacket,
  IConnectPacket,
  IPublishPacket,
  IConnackPacket,
  ISubscription,
  ISubscribePacket,
  ISubackPacket,
  IUnsubscribePacket,
  IUnsubackPacket,
  IPubackPacket,
  IPubcompPacket,
  IPubrelPacket,
  IPubrecPacket,
  IPingreqPacket,
  IPingrespPacket,
  IDisconnectPacket,
  Packet,
} from "mqtt";
