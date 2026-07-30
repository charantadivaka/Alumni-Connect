'use strict';

const EventEmitter = require('events');

class InternalEventBus extends EventEmitter {}

// Export a singleton instance of the event bus
const eventBus = new InternalEventBus();

module.exports = eventBus;
