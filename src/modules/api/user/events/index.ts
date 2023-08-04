import { EventEmitter } from "events";

import { Injectable } from "@nestjs/common";
import { UserEventMap } from "../interfaces";

@Injectable()
export class UserEvent extends EventEmitter {
    constructor() {
        // private userService: UserService // @Inject(forwardRef(() => UserService))
        super();
    }

    emit<K extends keyof UserEventMap>(
        eventName: K,
        payload: UserEventMap[K]
    ): boolean {
        return super.emit(eventName, payload);
    }

    on<K extends keyof UserEventMap>(
        eventName: K,
        listener: (payload: UserEventMap[K]) => void
    ) {
        return super.on(eventName, listener);
    }
}
