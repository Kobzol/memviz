import type { DebugProtocol } from "@vscode/debugprotocol";
import async from "async";
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
  private queue = async.queue<QueueTask>(
    (task: QueueTask, completed: () => void) => {
      if (!this.handler) return;

      const { type, message } = task;

      (async () => {
        try {
          if (type === MessageType.Incoming) {
            await this.handler?.handleMessageFromClient(message);
          } else {
            this.handler?.handleMessageToClient(message);
          }
        } catch (err) {
          console.error("Error processing message", err);
        } finally {
          completed();
        }
      })();
    },
    1,
  );

  private handler: Reactor | null = null;

  setHandler(handler: Reactor) {
    this.handler = handler;

    while (this.prepQueue.length > 0) {
      this.queue.push(this.prepQueue.shift()!);
    }
  }

  async enqueue(message: DebugProtocol.ProtocolMessage, type: MessageType) {
    const task: QueueTask = { type, message };

    if (!this.handler) {
      this.prepQueue.push(task);
    } else {
      this.queue.push(task);
    }
  }
}
