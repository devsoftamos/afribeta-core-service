// This module will resolve once Redis is available.
import { isProdEnvironment, RedisConfig } from "@/config";
import Redis, { RedisOptions } from "ioredis";

const waitForListener = (target: Redis, event: string) =>
    new Promise((resolve) => target.once(event, resolve));

export default async function (config: RedisConfig) {
    const redisOptions: RedisOptions = {
        lazyConnect: false,
        showFriendlyErrorStack: true,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: isProdEnvironment ? {} : undefined,
        host: config.host,
        username: config.user,
        password: config.password,
        port: config.port,
    };

    const client = new Redis(redisOptions);

    await waitForListener(client, "connect");
}
