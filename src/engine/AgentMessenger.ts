/**
 * AgentMessenger — Telegram/Slack-like messaging for agent nodes.
 *
 * Mental model:
 *   Each agent has a messenger app. Connected nodes via "in" and "out"
 *   handles are the agent's contacts. A special "system" contact delivers
 *   commands like terminate, pause, shutdown.
 *
 *   "Knocking" = someone is calling you (maps to the existing knockSide
 *   animation in node components).
 *
 * Usage:
 *   const messenger = new AgentMessenger('node-a')
 *   messenger.addContact({ id: 'node-b', name: 'Code Runner', direction: 'out' })
 *   messenger.send('node-b', 'text', 'Hello!')
 *   messenger.onMessage(msg => console.log(msg))
 */

// ── Types ───────────────────────────────────────────────────────────────────────

/** ID of a contact — either a connected node ID or 'system' */
export type ContactId = string

/** Types of messages that can be exchanged */
export type MessageType = 'text' | 'knock' | 'data' | 'command'

/** System-level commands delivered via the 'system' contact */
export type SystemCommand = 'terminate' | 'pause' | 'shutdown' | 'resume'

/** A single message in the messenger */
export interface Message {
    id: string
    from: ContactId
    to: ContactId
    type: MessageType
    payload: unknown
    timestamp: number
    read: boolean
}

/** A contact in the messenger — represents a connected node or the system */
export interface Contact {
    id: ContactId
    name: string
    direction: 'in' | 'out' | 'internal' | 'system'
    online: boolean
}

// ── Messenger ───────────────────────────────────────────────────────────────────

let _msgIdCounter = 0

export class AgentMessenger {
    readonly nodeId: string
    private contacts: Map<string, Contact> = new Map()
    private inbox: Message[] = []
    private messageListeners: Set<(msg: Message) => void> = new Set()
    private systemListeners: Set<(cmd: SystemCommand) => void> = new Set()

    constructor(nodeId: string) {
        this.nodeId = nodeId

        // Every messenger has a 'system' contact by default
        this.contacts.set('system', {
            id: 'system',
            name: 'System',
            direction: 'system',
            online: true,
        })
    }

    // ── Contacts ────────────────────────────────────────────────────────────

    /** Add a contact (connected node) */
    addContact(contact: Omit<Contact, 'online'> & { online?: boolean }): void {
        this.contacts.set(contact.id, {
            ...contact,
            online: contact.online ?? true,
        })
    }

    /** Remove a contact */
    removeContact(id: ContactId): void {
        if (id === 'system') return // can't remove system
        this.contacts.delete(id)
    }

    /** Get all contacts */
    getContacts(): Contact[] {
        return Array.from(this.contacts.values())
    }

    /** Get a specific contact */
    getContact(id: ContactId): Contact | undefined {
        return this.contacts.get(id)
    }

    /** Get contacts connected to the "in" handle (incoming) */
    getInContacts(): Contact[] {
        return this.getContacts().filter(c => c.direction === 'in')
    }

    /** Get contacts connected to the "out" handle (outgoing) */
    getOutContacts(): Contact[] {
        return this.getContacts().filter(c => c.direction === 'out')
    }

    /** Get internal contacts (subagents used as tools) */
    getInternalContacts(): Contact[] {
        return this.getContacts().filter(c => c.direction === 'internal')
    }

    /** Set a contact's online status */
    setOnline(id: ContactId, online: boolean): void {
        const contact = this.contacts.get(id)
        if (contact) contact.online = online
    }

    // ── Messaging ───────────────────────────────────────────────────────────

    /** Send a message to a contact */
    send(to: ContactId, type: MessageType, payload?: unknown): Message {
        const msg: Message = {
            id: `msg-${++_msgIdCounter}`,
            from: this.nodeId,
            to,
            type,
            payload: payload ?? null,
            timestamp: Date.now(),
            read: false,
        }
        // Dispatch to listeners (the recipient's messenger would pick this up)
        this.notifyMessage(msg)
        return msg
    }

    /** Receive a message into the inbox */
    receive(msg: Message): void {
        this.inbox.push(msg)
        this.notifyMessage(msg)

        // If it's a system command, also dispatch to system listeners
        if (msg.from === 'system' && msg.type === 'command') {
            this.notifySystem(msg.payload as SystemCommand)
        }
    }

    /** Get all messages in the inbox */
    getInbox(): Message[] {
        return [...this.inbox]
    }

    /** Get unread messages */
    getUnread(): Message[] {
        return this.inbox.filter(m => !m.read)
    }

    /** Get messages from a specific contact */
    getMessagesFrom(contactId: ContactId): Message[] {
        return this.inbox.filter(m => m.from === contactId)
    }

    /** Mark a message as read */
    markRead(messageId: string): void {
        const msg = this.inbox.find(m => m.id === messageId)
        if (msg) msg.read = true
    }

    /** Mark all messages as read */
    markAllRead(): void {
        this.inbox.forEach(m => { m.read = true })
    }

    /** Clear inbox */
    clearInbox(): void {
        this.inbox = []
    }

    // ── Knock (formalized existing concept) ─────────────────────────────────

    /**
     * "Knock" a contact — like calling them on the messenger.
     * This sends a 'knock' type message.
     */
    knock(to: ContactId): Message {
        return this.send(to, 'knock')
    }

    /** Check if this agent is currently being knocked (has unread knock messages) */
    isBeingKnocked(): boolean {
        return this.inbox.some(m => m.type === 'knock' && !m.read)
    }

    /** Get who is knocking */
    getKnocker(): ContactId | null {
        const knockMsg = this.inbox.find(m => m.type === 'knock' && !m.read)
        return knockMsg?.from ?? null
    }

    // ── System Commands ─────────────────────────────────────────────────────

    /**
     * Listen for system commands (terminate, pause, shutdown, resume).
     * Returns unsubscribe function.
     */
    onSystem(handler: (cmd: SystemCommand) => void): () => void {
        this.systemListeners.add(handler)
        return () => { this.systemListeners.delete(handler) }
    }

    /** Send a system command to this agent */
    systemCommand(cmd: SystemCommand): void {
        const msg: Message = {
            id: `msg-${++_msgIdCounter}`,
            from: 'system',
            to: this.nodeId,
            type: 'command',
            payload: cmd,
            timestamp: Date.now(),
            read: false,
        }
        this.receive(msg)
    }

    // ── Events ──────────────────────────────────────────────────────────────

    /** Listen for any incoming message. Returns unsubscribe function. */
    onMessage(handler: (msg: Message) => void): () => void {
        this.messageListeners.add(handler)
        return () => { this.messageListeners.delete(handler) }
    }

    private notifyMessage(msg: Message): void {
        this.messageListeners.forEach(fn => fn(msg))
    }

    private notifySystem(cmd: SystemCommand): void {
        this.systemListeners.forEach(fn => fn(cmd))
    }

    // ── Utility ─────────────────────────────────────────────────────────────

    /** Get a summary of the messenger state (useful for debugging) */
    toString(): string {
        const contactCount = this.contacts.size - 1 // exclude system
        const unread = this.getUnread().length
        return `Messenger[${this.nodeId}] — ${contactCount} contacts, ${this.inbox.length} messages (${unread} unread)`
    }
}
