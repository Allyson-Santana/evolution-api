export interface InstagramWebhook {
  object: string
  entry: Entry[]
}

export interface Entry {
  time: number
  id: string
  messaging: Messaging[]
}

export interface Messaging {
  sender: Sender
  recipient: Recipient
  timestamp: number
  message: Message
}

export interface Sender {
  id: string
}

export interface Recipient {
  id: string
}

export interface Message {
  mid: string
  text?: string
}
