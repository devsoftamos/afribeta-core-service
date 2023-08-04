import { EventEmitter } from "events";

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UserService } from "../../user/services";
import { AgentCreationEventOptions, UserEventMap } from "../interfaces";

@Injectable()
export class UserEvent extends EventEmitter {
    constructor(
        @Inject(forwardRef(() => UserService))
        private userService: UserService
    ) {
        super();
        this.on("agent-creation", this.onAgentCreation);
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

    async onAgentCreation(_options: AgentCreationEventOptions) {
        //handle async process
        this.userService;
    }
}
