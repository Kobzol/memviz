import type { DebugProtocol } from "@vscode/debugprotocol";
import type { Reactor } from "./reactor";

export enum MessageType {
  Incoming = "incoming",
  Outgoing = "outgoing",
}

interface QueueTask {
  type: MessageType;
  message: DebugProtocol.ProtocolMessage;
}

export class MessageQueue {
  private prepQueue: QueueTask[] = [];
  private handler: Reactor | null = null;
  private last: Promise<void> = Promise.resolve();

  setHandler(handler: Reactor) {
    this.handler = handler;

    while (this.prepQueue.length > 0) {
      const task = this.prepQueue.shift();
      if (task) {
        this.enqueue(task.message, task.type);
      }
    }
  }

  enqueue(message: DebugProtocol.ProtocolMessage, type: MessageType) {
    const task: QueueTask = { type, message };

    if (!this.handler) {
      this.prepQueue.push(task);
      return;
    }

    this.handler.applyMessageChanges(message);

    this.last = this.last.then(async () => {
      if (!this.handler) return;

      try {
        if (task.type === MessageType.Incoming) {
          await this.handler.handleMessageFromClient(task.message);
        } else {
          await this.handler.handleMessageToClient(task.message);
        }
      } catch (err) {
        console.error(
          `Error handling ${task.type} message: ${JSON.stringify(task.message)}`,
          err,
        );
      }
    });
  }

  clear() {
    this.handler = null;
    this.prepQueue = [];
    this.last = Promise.resolve();
  }
}
