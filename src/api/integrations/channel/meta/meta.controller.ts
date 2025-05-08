import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import axios from 'axios';

import { ChannelController, ChannelControllerInterface } from '../channel.controller';
import { Entry } from '@api/types/instagram.types';

export class MetaController extends ChannelController implements ChannelControllerInterface {
  private readonly logger = new Logger('MetaController');

  constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService) {
    super(prismaRepository, waMonitor);
  }

  integrationEnabled: boolean;

  public async receiveWebhook(data: any) {
    if (data.object === 'whatsapp_business_account') {
      if (data.entry[0]?.changes[0]?.field === 'message_template_status_update') {
        const template = await this.prismaRepository.template.findFirst({
          where: { templateId: `${data.entry[0].changes[0].value.message_template_id}` },
        });

        if (!template) {
          console.log('template not found');
          return;
        }

        const { webhookUrl } = template;

        await axios.post(webhookUrl, data.entry[0].changes[0].value, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return;
      }

      data.entry?.forEach(async (entry: any) => {
        const numberId = entry.changes[0].value.metadata.phone_number_id;

        if (!numberId) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> numberId not found');
          return {
            status: 'success',
          };
        }

        const instance = await this.prismaRepository.instance.findFirst({
          where: { number: numberId },
        });

        if (!instance) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> instance not found');
          return {
            status: 'success',
          };
        }

        await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);

        return {
          status: 'success',
        };
      });
    }

    if (data.object === 'instagram') {
      if (data.entry && data.entry[0]?.messaging) {

        for (const entry of data.entry as Entry[]) {
          const instagramId = entry.id;

          if (!instagramId) {
            this.logger.error('WebhookService -> receiveWebhookInstagram -> instagramId não encontrado');
            continue;
          }

          const instance = await this.prismaRepository.instance.findFirst({
            where: { businessId: instagramId, integration: 'INSTAGRAM' },
          });

          if (!instance) {
            this.logger.error(`WebhookService -> receiveWebhookInstagram -> instância não encontrada para ID: ${instagramId}`);
            continue;
          }

          for (const messagingEvent of entry.messaging) {
            const formattedData = this.formatInstagramWebhookData(instagramId, messagingEvent);
            await this.waMonitor.waInstances[instance.name].connectToWhatsapp(formattedData);
          }
        }

        return {
          status: 'success',
        };
      }
      else if (data.entry && data.entry[0]?.changes) {
        if (data.entry[0]?.changes[0]?.field === 'message_template_status_update') {
          const template = await this.prismaRepository.template.findFirst({
            where: { templateId: `${data.entry[0].changes[0].value.message_template_id}` },
          });

          if (!template) {
            console.log('template not found');
            return;
          }

          const { webhookUrl } = template;

          await axios.post(webhookUrl, data.entry[0].changes[0].value, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          return;
        }
      }
    }
  }

  private formatInstagramWebhookData(instagramId: string, messagingEvent: any) {
    const senderInfo = messagingEvent.sender || {};
    const message = messagingEvent.message || {};
    const timestamp = messagingEvent.timestamp || Date.now();

    let formattedMessage: any = {
      object: 'instagram',
      entry: [
        {
          id: instagramId,
          time: timestamp,
          changes: [
            {
              value: {
                metadata: {
                  instagram_id: instagramId,
                  sender_id: senderInfo.id
                },
                messages: [
                  {
                    id: message.mid || `ig-${Date.now()}`,
                    from: senderInfo.id,
                    timestamp: timestamp,
                    instagram: true
                  }
                ]
              }
            }
          ]
        }
      ]
    };


    if (message.text) {
      formattedMessage.entry[0].changes[0].value.messages[0].text = {
        body: message.text
      };
      formattedMessage.entry[0].changes[0].value.messages[0].type = 'text';
    }

    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];

      formattedMessage.entry[0].changes[0].value.messages[0].type = attachment.type;
      formattedMessage.entry[0].changes[0].value.messages[0][attachment.type] = {
        url: attachment.payload?.url,
        mime_type: this.getMimeTypeFromAttachmentType(attachment.type),
        id: message.mid || `ig-media-${Date.now()}`
      };
    }

    if (message.reply_to) {
      formattedMessage.entry[0].changes[0].value.messages[0].context = {
        id: message.reply_to.mid || message.reply_to.story?.id
      };
    }

    if (message.is_deleted) {
      formattedMessage.entry[0].changes[0].value.statuses = [
        {
          id: message.mid,
          recipient_id: senderInfo.id,
          status: "deleted"
        }
      ];
    }

    return formattedMessage;
  }

  private getMimeTypeFromAttachmentType(type: string): string {
    switch (type) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      case 'file':
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }
}