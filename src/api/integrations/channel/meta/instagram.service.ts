import { NumberBusiness } from '@api/dto/chat.dto';
import {
  ContactMessage,
  MediaMessage,
  Options,
  SendAudioDto,
  SendButtonsDto,
  SendContactDto,
  SendListDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTemplateDto,
  SendTextDto,
} from '@api/dto/sendMessage.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { chatbotController } from '@api/server.module';
import { CacheService } from '@api/services/cache.service';
import { ChannelStartupService } from '@api/services/channel.service';
import { Events, wa } from '@api/types/wa.types';
import { Chatwoot, ConfigService, Database, S3, WaInstagram } from '@config/env.config';
import { BadRequestException, InternalServerErrorException } from '@exceptions';
import { status } from '@utils/renderStatus';
import axios from 'axios';
import { arrayUnique, isURL } from 'class-validator';
import EventEmitter2 from 'eventemitter2';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import mime from 'mime';
import { MessageFormatter } from './formatters/message.formatter';
import * as s3Service from '@api/integrations/storage/s3/libs/minio.server';
import { join } from 'path';

export class InstagramService extends ChannelStartupService {
  constructor(
    public readonly configService: ConfigService,
    public readonly eventEmitter: EventEmitter2,
    public readonly prismaRepository: PrismaRepository,
    public readonly cache: CacheService,
  ) {
    super(configService, eventEmitter, prismaRepository);
  }

  public stateConnection: wa.StateConnection = { state: 'open' };

  public phoneNumber: string;
  public mobile: boolean;

  public get connectionStatus() {
    return this.stateConnection;
  }

  public async closeClient() {
    this.stateConnection = { state: 'close' };
  }

  public get qrCode(): wa.QrCode {
    return {
      pairingCode: this.instance.qrcode?.pairingCode,
      code: this.instance.qrcode?.code,
      base64: this.instance.qrcode?.base64,
      count: this.instance.qrcode?.count,
    };
  }

  public async logoutInstance() {
    await this.closeClient();
  }

  private async post(message: any, params: string) {
    try {
      let urlServer = this.configService.get<WaInstagram>('WA_INSTAGRAM').URL;
      const version = this.configService.get<WaInstagram>('WA_INSTAGRAM').VERSION;
      urlServer = `${urlServer}/${version}/${this.number}/${params}`;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
      const result = await axios.post(urlServer, message, { headers });
      return result.data;
    } catch (e) {
      return e.response?.data?.error;
    }
  }

  public async profilePicture(number: string) {
    const jid = this.createJid(number);

    return {
      wuid: jid,
      profilePictureUrl: null,
    };
  }

  public async getProfileName() {
    return null;
  }

  public async profilePictureUrl() {
    return null;
  }

  public async getProfileStatus() {
    return null;
  }

  public async connectToInstagram(data?: any): Promise<any> {
    if (!data) return;

    const content = data.entry[0].changes[0].value;

    try {
      this.loadChatwoot();

      this.eventHandler(content);

      this.phoneNumber = this.createJid(
        content.messages ? content.messages[0].from : content.statuses[0]?.recipient_id,
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  private renderMessageType(type: string, message?: any) {
    let messageType: string;

    switch (type) {
      case 'text':
        messageType = 'conversation';
        break;
      case 'image':
        messageType = 'imageMessage';
        break;
      case 'sticker':
        messageType = 'stickerMessage';
        break;
      case 'video':
        messageType = 'videoMessage';
        break;
      case 'audio':
        messageType = 'audioMessage';
        break;
      case 'document':
        messageType = 'documentMessage';
        break;
      case 'template':
        messageType = 'conversation';
        break;
      case 'contacts':
        if (message?.contact) return 'contactMessage';
        if (message?.contactsArrayMessage) return 'contactsArrayMessage';
        return 'contacts';
      default:
        messageType = 'conversation';
        break;
    }

    return messageType;
  }

  protected async messageHandle(received: any, database: Database, settings: any) {
    if (received.messages) {
      const message = received.messages[0];

      if (message.instagram) {
        let transformedPayload: any = {
          key: {
            remoteJid: message.from,
            fromMe: message.from === this.instance.number,
            id: message.id
          },
          messageTimestamp: Math.floor(message.timestamp / 1000).toString(),
          status: "PENDING",
          source: 'instagram',
          channel: 'instagram',
          instanceId: this.instanceId
        };

        if (message.type === 'text') {
          transformedPayload = MessageFormatter.formatTextMessage(
            transformedPayload,
            message.text.body
          );
        } else if (message[message.type]) {
          transformedPayload = MessageFormatter.formatMediaMessage(
            transformedPayload,
            message[message.type],
            message.type
          );
        }

        this.eventMessageHandle(transformedPayload, database, settings);
      } else {
        this.eventMessageHandle(received, database, settings);
      }
    } else {
      this.logger.log(JSON.stringify(received));
    }
  }

  private getMimeType(type: string): string {
    switch (type) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mp4';
      case 'file':
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }

  private async downloadMediaMessage(message: any) {
    try {
      if (!message || !message.type) {
        this.logger.error('Mensagem inválida ou tipo não encontrado');
        return null;
      }

      const id = message[message.type]?.id;
      if (!id) {
        this.logger.error('ID da mídia não encontrado na mensagem');
        return null;
      }

      let urlServer = this.configService.get<WaInstagram>('WA_INSTAGRAM').URL;
      const version = this.configService.get<WaInstagram>('WA_INSTAGRAM').VERSION;
      urlServer = `${urlServer}/${version}/${id}`;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
      let result = await axios.get(urlServer, { headers });
      result = await axios.get(result.data.url, { headers, responseType: 'arraybuffer' });
      return result.data;
    } catch (e) {
      this.logger.error(['Erro ao baixar mídia', e?.message, e?.stack]);
      return null;
    }
  }

  protected async eventMessageHandle(received: any, database: Database, settings: any) {
    this.logger.debug(`Received Message: ${JSON.stringify(received)}`);

    try {
      let messageRaw: any;
      let pushName: string | undefined;

      try {
        const urlServer = "https://graph.instagram.com";
        const version = "v21.0";
        const instaToken = this.configService.get<WaInstagram>('WA_INSTAGRAM').INSTA_TOKEN;

        const url = `${urlServer}/${version}/${received.key.remoteJid}?fields=name&access_token=${this.instance.token}`;
        this.logger.debug(`Fetching profile from URL: ${url}`);

        const profileResponse = await axios.get(url);
        this.logger.debug(`Profile response: ${JSON.stringify(profileResponse.data)}`);

        pushName = profileResponse.data?.name || received.key.remoteJid;
      } catch (error) {
        this.logger.error(`Error fetching Instagram profile: ${error}`);
        pushName = received.key.remoteJid;
      }

      messageRaw = {
        ...received,
        pushName
      };
      if (this.configService.get<S3>('S3').ENABLE) {
        try {
          let urlServer = received.message[received.messageType].url;

          const buffer = await axios.get(urlServer, { responseType: 'arraybuffer' });

          let mediaType = '';

          switch (received.messageType) {
            case 'imageMessage':
              mediaType = 'image';
              break;
            case 'videoMessage':
              mediaType = 'video';
              break;
            case 'audioMessage':
              mediaType = 'audio';
              break;
          }

          const mimetype = received.message[received.messageType].mimetype;

          let fileName = `${received.key.id}.${mimetype.split('/')[1]}`;

          const size = buffer.headers['content-length'];

          const fullName = join(`${this.instance.id}`, received.key.remoteJid, mediaType, fileName);

          await s3Service.uploadFile(fullName, buffer.data, size, {
            'Content-Type': mimetype,
          });

          const mediaUrl = await s3Service.getObjectUrl(fullName);

          this.logger.debug(`Media URL: ${mediaUrl}`);

          messageRaw.message[received.messageType].mediaUrl = mediaUrl;
          messageRaw.message[received.messageType].mediaType = mediaType;
          messageRaw.message[received.messageType].fullName = fullName;
          messageRaw.message[received.messageType].mimetype = mimetype;
        } catch (error) {
          this.logger.error(['Error on upload file to minio', error?.message, error?.stack]);
        }
      } else {
        try {
          const buffer = received.messages && received.messages[0] ?
            await this.downloadMediaMessage(received.messages[0]) :
            received.message ? await this.downloadMediaMessage(received) : null;

          if (buffer && received.message?.type) {
            messageRaw.message[`${received.message.type}Message`].base64 = buffer.toString('base64');
            messageRaw.message[`${received.message.type}Message`].type = 'base64';
          }
        } catch (error) {
          this.logger.error(['Error downloading media message', error?.message, error?.stack]);
        }
      }

      if (messageRaw) {
        this.sendDataWebhook(Events.MESSAGES_UPSERT, messageRaw);

        await chatbotController.emit({
          instance: { instanceName: this.instance.name, instanceId: this.instanceId },
          remoteJid: messageRaw.key.remoteJid,
          msg: messageRaw,
          pushName: messageRaw.pushName,
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
          const chatwootSentMessage = await this.chatwootService.eventWhatsapp(
            Events.MESSAGES_UPSERT,
            { instanceName: this.instance.name, instanceId: this.instanceId },
            messageRaw,
          );

          if (chatwootSentMessage?.id) {
            messageRaw.chatwootMessageId = chatwootSentMessage.id;
            messageRaw.chatwootInboxId = chatwootSentMessage.id;
            messageRaw.chatwootConversationId = chatwootSentMessage.id;
          }
        }

        if (this.configService.get<Database>('DATABASE').SAVE_DATA.NEW_MESSAGE) {
          await this.prismaRepository.message.create({
            data: messageRaw,
          });
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private convertMessageToRaw(message: any, content: any) {
    let convertMessage: any;

    if (message?.conversation) {
      if (content?.context?.message_id) {
        convertMessage = {
          ...message,
          contextInfo: { stanzaId: content.context.message_id },
        };
        return convertMessage;
      }
      convertMessage = message;
      return convertMessage;
    }

    if (message?.mediaType === 'image') {
      if (content?.context?.message_id) {
        convertMessage = {
          imageMessage: message,
          contextInfo: { stanzaId: content.context.message_id },
        };
        return convertMessage;
      }
      return {
        imageMessage: message,
      };
    }

    if (message?.mediaType === 'video') {
      if (content?.context?.message_id) {
        convertMessage = {
          videoMessage: message,
          contextInfo: { stanzaId: content.context.message_id },
        };
        return convertMessage;
      }
      return {
        videoMessage: message,
      };
    }

    if (message?.mediaType === 'audio') {
      if (content?.context?.message_id) {
        convertMessage = {
          audioMessage: message,
          contextInfo: { stanzaId: content.context.message_id },
        };
        return convertMessage;
      }
      return {
        audioMessage: message,
      };
    }

    if (message?.mediaType === 'document') {
      if (content?.context?.message_id) {
        convertMessage = {
          documentMessage: message,
          contextInfo: { stanzaId: content.context.message_id },
        };
        return convertMessage;
      }
      return {
        documentMessage: message,
      };
    }

    if (message.contactsArrayMessage) {
      return {
        contactsArrayMessage: message.contactsArrayMessage,
      };
    }

    if (message.contact) {
      return {
        contactMessage: message.contact,
      };
    }

    return message;
  }

  protected async eventHandler(content: any) {
    const database = this.configService.get<Database>('DATABASE');
    const settings = await this.findSettings();

    this.messageHandle(content, database, settings);
  }

  protected async sendMessageWithTyping(InstagramNumber: string, message: any, options?: Options, isIntegration = false) {
    try {
      let quoted: any;
      let webhookUrl: any;
      const linkPreview = options?.linkPreview != false ? undefined : false;

      if (options?.quoted) {
        quoted = options.quoted.key;
        if (!quoted) {
          throw 'Message not found';
        }
      }

      if (options?.webhookUrl) {
        webhookUrl = options.webhookUrl;
      }

      let content: any;
      const messageSent = await (async () => {
        if (message['conversation']) {
          content = {
            recipient: { id: InstagramNumber.replace(/\D/g, '') },
            message: {
              text: message['conversation']
            }
          };
          return await this.post(content, 'messages');
        }
        if (message['audio'] && message['mediaType'] === 'audio') {
          content = {
            recipient: { id: InstagramNumber.replace(/\D/g, '') },
            message: {
              attachment: {
                type: "audio",
                payload: {
                  url: message.audio,
                  is_reusable: "true"
                }
              }
            }
          };
          return await this.post(content, 'messages');
        }
        if (message['media'] && message['mediaType'] === 'image') {
          content = {
            recipient: { id: InstagramNumber.replace(/\D/g, '') },
            message: {
              attachment: {
                type: "image",
                payload: {
                  url: message.media,
                  is_reusable: "true"
                }
              }
            }
          };
          return await this.post(content, 'messages');
        }
        if (message['media'] && message['mediaType'] === 'video') {
          content = {
            recipient: { id: InstagramNumber.replace(/\D/g, '') },
            message: {
              attachment: {
                type: "video",
                payload: {
                  url: message.media,
                  is_reusable: "true"
                }
              }
            }
          };
          return await this.post(content, 'messages');
        }
        if (message['template']) {
        }

        return await this.post(content, 'messages');
      })();

      if (messageSent?.error_data) {
        this.logger.error(`Error sent message for Meta: ${String(messageSent)}`);
        return messageSent;
      }

      const messageRaw: any = {
        key: { fromMe: true, id: messageSent.message_id, remoteJid: InstagramNumber },
        message: this.convertMessageToRaw(message, content),
        messageType: this.renderMessageType(content.message?.attachment?.type) || "text",
        messageTimestamp: Math.round(new Date().getTime() / 1000),
        instanceId: this.instanceId,
        webhookUrl,
        status: status[1],
        source: 'unknown',
      };

      messageRaw.contextInfo = {
        ...(messageRaw.contextInfo || {}),
        contextInfoCustom: message['contextInfoCustom'],
      };

      this.logger.log(messageRaw);

      this.sendDataWebhook(Events.SEND_MESSAGE, messageRaw);

      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled && !isIntegration) {
        this.chatwootService.eventWhatsapp(
          Events.SEND_MESSAGE,
          { instanceName: this.instance.name, instanceId: this.instanceId },
          messageRaw,
        );
      }

      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled && isIntegration)
        await chatbotController.emit({
          instance: { instanceName: this.instance.name, instanceId: this.instanceId },
          remoteJid: messageRaw.key.remoteJid,
          msg: messageRaw,
          pushName: messageRaw.pushName,
        });

      await this.prismaRepository.message.create({
        data: messageRaw,
      });

      return messageRaw;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  public async textMessage(data: SendTextDto, isIntegration = false) {
    const res = await this.sendMessageWithTyping(
      data.number,
      {
        conversation: data.text,
        contextInfoCustom: data?.contextInfoCustom || null,
      },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
      isIntegration,
    );
    return res;
  }

  private async getIdMedia(mediaMessage: any) {
    const formData = new FormData();

    const fileStream = createReadStream(mediaMessage.media);

    formData.append('file', fileStream, { filename: 'media', contentType: mediaMessage.mimetype });
    formData.append('typeFile', mediaMessage.mimetype);
    formData.append('messaging_product', 'instagram');

    const headers = { Authorization: `Bearer ${this.token}` };
    const res = await axios.post(
      process.env.API_URL + '/' + process.env.VERSION + '/' + this.number + '/media',
      formData,
      { headers },
    );
    return res.data.id;
  }

  protected async prepareMediaMessage(mediaMessage: MediaMessage) {
    try {
      return MessageFormatter.formatMediaMessageForSending(mediaMessage);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString() || error);
    }
  }

  public async mediaMessage(data: SendMediaDto, file?: any, isIntegration = false) {
    const mediaData: SendMediaDto = { ...data };

    if (file) mediaData.media = file.buffer.toString('base64');

    const message = await this.prepareMediaMessage(mediaData);

    const mediaSent = await this.sendMessageWithTyping(
      data.number,
      { ...message },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
      isIntegration,
    );

    return mediaSent;
  }

  public async processAudio(audio: string, number: string) {
    number = number.replace(/\D/g, '');
    const hash = `${number}-${new Date().getTime()}`;

    let mimetype: string;

    const prepareMedia: any = {
      fileName: `${hash}.mp3`,
      mediaType: 'audio',
      audio: audio,
      media: audio,
    };

    if (isURL(audio)) {
      mimetype = mime.getType(audio);
      prepareMedia.id = audio;
      prepareMedia.type = 'link';
    } else {
      mimetype = mime.getType(prepareMedia.fileName);
      const id = await this.getIdMedia(prepareMedia);
      prepareMedia.id = id;
      prepareMedia.type = 'id';
    }

    prepareMedia.mimetype = mimetype;

    return prepareMedia;
  }

  public async audioWhatsapp(data: SendAudioDto, file?: any, isIntegration = false) {
    const mediaData: SendAudioDto = { ...data };

    if (file?.buffer) {
      mediaData.audio = file.buffer.toString('base64');
    } else if (!isURL(mediaData.audio)) {
      throw new Error('File or buffer is undefined');
    }

    const message = await this.processAudio(mediaData.audio, data.number);

    const audioSent = await this.sendMessageWithTyping(
      data.number,
      { ...message },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
      isIntegration,
    );

    return audioSent;
  }

  public async buttonMessage(data: SendButtonsDto) {
    const embeddedMedia: any = {};

    const btnItems = {
      text: data.buttons.map((btn) => btn.displayText),
      ids: data.buttons.map((btn) => btn.id),
    };

    if (!arrayUnique(btnItems.text) || !arrayUnique(btnItems.ids)) {
      throw new BadRequestException('Button texts cannot be repeated', 'Button IDs cannot be repeated.');
    }

    return await this.sendMessageWithTyping(
      data.number,
      {
        text: !embeddedMedia?.mediaKey ? data.title : undefined,
        buttons: data.buttons.map((button) => {
          return {
            type: 'reply',
            reply: {
              title: button.displayText,
              id: button.id,
            },
          };
        }),
        [embeddedMedia?.mediaKey]: embeddedMedia?.message,
      },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
    );
  }

  public async locationMessage(data: SendLocationDto) {
    return await this.sendMessageWithTyping(
      data.number,
      {
        locationMessage: {
          degreesLatitude: data.latitude,
          degreesLongitude: data.longitude,
          name: data?.name,
          address: data?.address,
        },
      },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
    );
  }

  public async listMessage(data: SendListDto) {
    const sectionsItems = {
      title: data.sections.map((list) => list.title),
    };

    if (!arrayUnique(sectionsItems.title)) {
      throw new BadRequestException('Section tiles cannot be repeated');
    }

    const sendData: any = {
      listMessage: {
        title: data.title,
        description: data.description,
        footerText: data?.footerText,
        buttonText: data?.buttonText,
        sections: data.sections.map((section) => {
          return {
            title: section.title,
            rows: section.rows.map((row) => {
              return {
                title: row.title,
                description: row.description.substring(0, 72),
                id: row.rowId,
              };
            }),
          };
        }),
      },
    };

    return await this.sendMessageWithTyping(data.number, sendData, {
      delay: data?.delay,
      presence: 'composing',
      quoted: data?.quoted,
      linkPreview: data?.linkPreview,
      mentionsEveryOne: data?.mentionsEveryOne,
      mentioned: data?.mentioned,
    });
  }

  public async templateMessage(data: SendTemplateDto, isIntegration = false) {
    const res = await this.sendMessageWithTyping(
      data.number,
      {
        template: {
          name: data.name,
          language: data.language,
          components: data.components,
        },
      },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
        webhookUrl: data?.webhookUrl,
      },
      isIntegration,
    );
    return res;
  }

  public async contactMessage(data: SendContactDto) {
    const message: any = {};

    const vcard = (contact: ContactMessage) => {
      let result = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + `N:${contact.fullName}\n` + `FN:${contact.fullName}\n`;

      if (contact.organization) {
        result += `ORG:${contact.organization};\n`;
      }

      if (contact.email) {
        result += `EMAIL:${contact.email}\n`;
      }

      if (contact.url) {
        result += `URL:${contact.url}\n`;
      }

      if (!contact.wuid) {
        contact.wuid = this.createJid(contact.phoneNumber);
      }

      result += `item1.TEL;waid=${contact.wuid}:${contact.phoneNumber}\n` + 'item1.X-ABLabel:Celular\n' + 'END:VCARD';

      return result;
    };

    if (data.contact.length === 1) {
      message.contact = {
        displayName: data.contact[0].fullName,
        vcard: vcard(data.contact[0]),
      };
    } else {
      message.contactsArrayMessage = {
        displayName: `${data.contact.length} contacts`,
        contacts: data.contact.map((contact) => {
          return {
            displayName: contact.fullName,
            vcard: vcard(contact),
          };
        }),
      };
    }
    return await this.sendMessageWithTyping(
      data.number,
      {
        contacts: data.contact.map((contact) => {
          return {
            name: { formatted_name: contact.fullName, first_name: contact.fullName },
            phones: [{ phone: contact.phoneNumber }],
            urls: [{ url: contact.url }],
            emails: [{ email: contact.email }],
            org: { company: contact.organization },
          };
        }),
        message,
      },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
    );
  }

  public async reactionMessage(data: SendReactionDto) {
    return await this.sendMessageWithTyping(data.key.remoteJid, {
      reactionMessage: {
        key: data.key,
        text: data.reaction,
      },
    });
  }

  public async getBase64FromMediaMessage(data: any) {
    try {
      const msg = data.message;
      const messageType = msg.messageType.includes('Message') ? msg.messageType : msg.messageType + 'Message';
      const mediaMessage = msg.message[messageType];

      return {
        mediaType: msg.messageType,
        fileName: mediaMessage?.fileName,
        caption: mediaMessage?.caption,
        size: {
          fileLength: mediaMessage?.fileLength,
          height: mediaMessage?.fileLength,
          width: mediaMessage?.width,
        },
        mimetype: mediaMessage?.mime_type,
        base64: msg.message.base64,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }
}
