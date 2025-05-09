import { MediaMessage } from '@api/dto/sendMessage.dto';
import { isURL } from 'class-validator';
import mime from 'mime';

export class MessageFormatter {
  static formatBaseMessage(from: string, id: string, instanceId: string) {
    return {
      key: {
        remoteJid: from,
        fromMe: false,
        id: id
      },
      messageTimestamp: Math.floor(Date.now() / 1000).toString(),
      status: "PENDING",
      source: 'instagram',
      channel: 'instagram',
      instanceId: instanceId
    };
  }

  static formatTextMessage(baseMessage: any, text: string) {
    return {
      ...baseMessage,
      message: {
        conversation: text
      },
      messageType: 'conversation'
    };
  }

  static formatMediaMessage(baseMessage: any, mediaMessage: any, type: string) {
    return {
      ...baseMessage,
      message: {
        [`${type}Message`]: {
          url: mediaMessage.url,
          mediaUrl: mediaMessage.url,
          mimetype: this.getMimeType(type),
          caption: mediaMessage.caption || '',
          fileLength: mediaMessage.fileLength || '0',
          height: mediaMessage.height || 0,
          width: mediaMessage.width || 0,
          mediaKeyTimestamp: Math.floor(Date.now() / 1000).toString(),
          contextInfo: {}
        }
      },
      messageType: `${type}Message`
    };
  }

  static getMimeType(type: string): string {
    switch (type) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mp4';
      case 'file':
      case 'document':
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }

  static formatMediaMessageForSending(mediaMessage: MediaMessage) {
    if (mediaMessage.mediatype === 'document' && !mediaMessage.fileName) {
      const regex = new RegExp(/.*\/(.+?)\./);
      const arrayMatch = regex.exec(mediaMessage.media);
      mediaMessage.fileName = arrayMatch[1];
    }

    if (mediaMessage.mediatype === 'image' && !mediaMessage.fileName) {
      mediaMessage.fileName = 'image.png';
    }

    if (mediaMessage.mediatype === 'video' && !mediaMessage.fileName) {
      mediaMessage.fileName = 'video.mp4';
    }

    const prepareMedia: any = {
      caption: mediaMessage?.caption,
      fileName: mediaMessage.fileName,
      mediaType: mediaMessage.mediatype,
      media: mediaMessage.media,
      gifPlayback: false,
    };

    if (isURL(mediaMessage.media)) {
      const mimetype = mime.getType(mediaMessage.media);
      prepareMedia.id = mediaMessage.media;
      prepareMedia.type = 'link';
      prepareMedia.mimetype = mimetype;
    } else {
      const mimetype = mime.getType(mediaMessage.fileName);
      prepareMedia.type = 'id';
      prepareMedia.mimetype = mimetype;
    }

    return prepareMedia;
  }

  static formatMessageContent(type: string, message: any, number: string) {
    const baseContent = {
      messaging_product: 'instagram',
      recipient_type: 'individual',
      to: number.replace(/\D/g, ''),
      type: type
    };

    switch (type) {
      case 'text':
        return {
          ...baseContent,
          text: {
            body: message.conversation,
            preview_url: message.preview_url
          }
        };

      case 'media':
        return {
          ...baseContent,
          type: message.mediaType,
          [message.mediaType]: {
            [message.type]: message.id,
            preview_url: message.preview_url,
            ...(message.fileName && message.mediatype === 'document' && { filename: message.fileName }),
            caption: message.caption
          }
        };

      case 'template':
        return {
          ...baseContent,
          template: {
            name: message.template.name,
            language: {
              code: message.template.language || 'en_US'
            },
            components: message.template.components
          }
        };

      default:
        return baseContent;
    }
  }
} 