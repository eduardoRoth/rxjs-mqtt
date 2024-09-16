# @eduardoroth/rxjs-mqtt

RxJS Wrapper for [mqtt](https://www.npmjs.com/package/mqtt) with TS support. Based on [async-mqtt](https://www.npmjs.com/package/async-mqtt)

## Install

```
npm i @eduardoroth/rxjs-mqtt
```

## Using it

You first need to call and await the connect function, which will return a `MqttClient` object with updated methods.

The methods for this MqttClient object are the same as one generated with `mqtt` but has the following methods modified:

- **Promises**
  - `.publish()`
  - `.subscribe()`
  - `.unsubscribe()`
  - `.end()`
- **Observables**
  - `.on()`
    - This method returns an observable that emits any time it receives from the event being listened.
  - `.onJsonMessage<T>()` **New method**
    - This is a helper method that extends the `on()` one, getting only the events of `message` sent from the MQTT server, and parsing them to JSON
    - `<T>` is the interface or type that the method will try to parse the received message

In addition to those, I added two more Operator Function helpers that you can chain to the `pipe` method of the Observable returned, that will help you easily parse the received events.

- **Helpers**
  - `parsePayload<T>(parser: (buffer: Buffer) => T | string = (buffer: Buffer) => buffer.toString()`
    - This Operator Function helper allows you to parse the bytes payload received from the MQTT event with a custom function that will convert the bytes to anything.
  - `parsePayloadToJSON()`
    - This Operator Function helper extends the previous function to easily convert the received bytes to JSON.

### Example code

```ts
import { connect } from "@eduardorothdev/rxjs-mqtt";

try {
  const client = await connect("mqtt://test.mosquitto.org", {
    //username: 'user',
    //password: 'pass',
  });
  // subscribe to a topic
  await client.subscribe("some/topic/#");
  const sub = client
    .onJsonMessage<{
      some: string;
      property: string;
      mapping: boolean;
    }>()
    .pipe(
      catchError((err) => {
        // we have to catch the error so the
        // observable pipe doesn't stop sending messages
        return of(null);
      }),
    )
    .subscribe((jsonMessage) => {
      // { some: 'hello', property: 'from mqtt', mapping: true }
      console.log(jsonMessage);
    });

  // later you can unsubscribe when needed.
  // this will unsubscribe from the onJsonMessage observable pipe
  // not from the topic subscription
  // sub.unsubscribe();

  // Unsubscribe from the topic subscription
  // await client.unsubscribe('some/topic/#');
} catch (err) {
  // connection/subscription-to-topic errors
  console.log(err);
}
```

## License

Licensed under [MIT](./LICENSE).
