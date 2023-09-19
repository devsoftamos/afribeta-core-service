// This module will resolve once Redis is available.
import Redis, { RedisOptions } from "ioredis";

const waitForListener = (target: Redis, event: string) =>
    new Promise((resolve) => target.once(event, resolve));

export default async function (url: string) {
    const redisOptions: RedisOptions = {
        tls: undefined,
        lazyConnect: false,
        showFriendlyErrorStack: true,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    };

    const client = new Redis(url, redisOptions);

    await waitForListener(client, "connect");
}
