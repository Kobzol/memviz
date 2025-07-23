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
  private queue = this.createQueue();
  private handler: Reactor | null = null;

  private createQueue() {
    return async.queue<QueueTask>(this.worker.bind(this), 1);
  }

  private async worker(task: QueueTask, completed: () => void) {
    if (!this.handler) return;

    const { type, message } = task;

    try {
      if (type === MessageType.Incoming) {
        await this.handler.handleMessageFromClient(message);
      } else {
        await this.handler.handleMessageToClient(message);
      }
    } catch (err) {
      console.error("Error processing message", err);
    } finally {
      completed();
    }
  }

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
      this.handler.applyMessageChanges(message);
      this.queue.push(task);
    }
  }

  clear() {
    this.handler = null;
    this.queue.kill();
    this.queue = this.createQueue();
    this.prepQueue = [];
  }
}
