const urlBase = 'http://localhost:8080';
// const urlBase = 'https://recato-evolution.elasticcode.com.br';

function sendMessageFromWebHookBailyes() {}

function sendMessageFromWebHookBusiness() {
  const webhookUrl = `${urlBase}/webhook/meta`;

  const payload = [
    {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '105219425550598',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '5511991513460',
                  phone_number_id: '106229588791797',
                },
                contacts: [
                  {
                    profile: {
                      name: 'Allyson',
                    },
                    wa_id: '5513988289998',
                  },
                ],
                messages: [
                  {
                    context: {
                      forwarded: true,
                    },
                    from: '5513988289998',
                    id: 'wamid.HBgNNTUxMzk4ODI4OTk5OBUCABIYIDBDOUJCQjJBQTExRTAwN0Y0RDY1NkZDRUJERERERjE2AA==',
                    timestamp: '1741819927',
                    type: 'video',
                    video: {
                      mime_type: 'video/mp4',
                      sha256: 'q6hSW5XFXCtEwAbKzH/Qe5Sggn46TSP3WXKnrON8B6o=',
                      id: '1675701439694753',
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
    {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '105219425550598',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '5511991513460',
                  phone_number_id: '106229588791797',
                },
                contacts: [
                  {
                    profile: {
                      name: 'Allyson',
                    },
                    wa_id: '5513988289998',
                  },
                ],
                messages: [
                  {
                    context: {
                      forwarded: true,
                    },
                    from: '5513988289998',
                    id: 'wamid.HBgNNTUxMzk4ODI4OTk5OBUCABIYIEM1Qjc1QjMzNzIwMDVGRjQ4MkQ0RTc5MDQ1RDg1RjM1AA==',
                    timestamp: '1741819927',
                    type: 'document',
                    document: {
                      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      sha256: 'sewoLwDBikJZr3yMx+fOsfa+o9SJYRPkzxemMlPi014=',
                      id: '3922154011398180',
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
    {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '105219425550598',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '5511991513460',
                  phone_number_id: '106229588791797',
                },
                contacts: [
                  {
                    profile: {
                      name: 'Allyson',
                    },
                    wa_id: '5513988289998',
                  },
                ],
                messages: [
                  {
                    context: {
                      forwarded: true,
                    },
                    from: '5513988289998',
                    id: 'wamid.HBgNNTUxMzk4ODI4OTk5OBUCABIYIEQxMjA2RDA0NkZGOUUxRkEyMjhCNUY3Q0NGRDQ4RkFFAA==',
                    timestamp: '1741819928',
                    type: 'image',
                    image: {
                      mime_type: 'image/jpeg',
                      sha256: '+fCZBLgA8ykAKCx9OEiBMF/mzGX/GqZXk0j9ZjgrrUY=',
                      id: '1197607631996246',
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
    {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '105219425550598',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '5511991513460',
                  phone_number_id: '106229588791797',
                },
                contacts: [
                  {
                    profile: {
                      name: 'Allyson',
                    },
                    wa_id: '5513988289998',
                  },
                ],
                messages: [
                  {
                    context: {
                      forwarded: true,
                    },
                    from: '5513988289998',
                    id: 'wamid.HBgNNTUxMzk4ODI4OTk5OBUCABIYIEM4OEM3NzdFOUMwODRDOTAxMjcyOTZFNTQ5MUU5QjUzAA==',
                    timestamp: '1741819928',
                    type: 'audio',
                    audio: {
                      mime_type: 'audio/ogg; codecs=opus',
                      sha256: 'Ol3gCezP8WuFGANyHptgyyuOYAiGpoD7A8kbn7+cMSQ=',
                      id: '485015024542465',
                      voice: false,
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
    {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '105219425550598',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '5511991513460',
                  phone_number_id: '106229588791797',
                },
                contacts: [
                  {
                    profile: {
                      name: 'Anonimous',
                    },
                    wa_id: '5513988289998',
                  },
                ],
                messages: [
                  {
                    from: '5513988289998',
                    id: 'wamid.HBgNNTUxMzk4ODI4OTk5OBUCABIYIEI2Nzc2NzJEMTVCNDRBQ0EzQTUzNzE0NjE4Q0ZGRTgwAA==',
                    timestamp: '1741805434',
                    text: {
                      body: `Testteeee de cargaa`,
                    },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
  ];

  for (const message of payload) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
      .then((response) => {
        if (!response.ok) {
          console.log(`Erro ao enviar mensagem: ${response.status}`);
        }
      })
      .catch((error) => {
        console.error('Erro de conexão:', error);
      });
  }
}

function sendMessageTextFromEvo(instanceName) {
  const url = `${urlBase}/message/sendText/${instanceName}`;
  const payload = {
    number: '5513988289998',
    text: `Testteeee de cargaa`,
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: 'z9iO3BwBB1EbAnFaVJwRY7Ag',
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        console.log(`Erro ao enviar mensagem de texto: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('Erro de conexão:', error);
    });
}

function sendMessageMediaImageFromEvo(instanceName) {
  const url = `${urlBase}/message/sendMedia/${instanceName}`;
  const payload = {
    number: '5513988289998',
    media:
      'https://recato-evolution-media.s3.us-east-2.amazonaws.com/evolution-api/062234d5-2471-4d5c-ad47-ee6f22d0de92/5571920025024%40s.whatsapp.net/3EB091DE093E873070245AB4187182B0C7E1D10B/imageMessage/3EB091DE093E873070245AB4187182B0C7E1D10B.png',
    fileName: 'bla.png',
    mediatype: 'image',
    mimetype: 'image/png',
    caption: 'Teste de caption',
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: 'z9iO3BwBB1EbAnFaVJwRY7Ag',
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        console.log(`Erro ao enviar mensagem de texto: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('Erro de conexão:', error);
    });
}

function sendMessageAudioFromEvo(instanceName) {
  const url = `${urlBase}/message/sendWhatsAppAudio/${instanceName}`;
  const payload = {
    number: '5513988289998',
    audio:
      'recato-evolution-media.s3.us-east-2.amazonaws.com/evolution-api/08121019-d912-41c5-b3cd-1bd820c82a02/5571920025024%40s.whatsapp.net/3EB05649617FC07E85DB4A8EF9CF149342C14FB8/audioMessage/3EB05649617FC07E85DB4A8EF9CF149342C14FB8.oga',
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: 'z9iO3BwBB1EbAnFaVJwRY7Ag',
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        console.log(`Erro ao enviar mensagem de texto: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('Erro de conexão:', error);
    });
}

function sendMessageMediaDocFromEvo(instanceName) {
  const url = `${urlBase}/message/sendMedia/${instanceName}`;
  const payload = {
    number: '5513988289998',
    media:
      'recato-evolution-media.s3.us-east-2.amazonaws.com/evolution-api/08121019-d912-41c5-b3cd-1bd820c82a02/5571920025024%40s.whatsapp.net/3EB06FB9DD94AD16EBFD40EE91C4BD26287708AD/documentMessage/Homologa%C3%A7%C3%A3o+ID+0603.docx',
    fileName: 'bla.docx',
    mediatype: 'document',
    mimetype: 'application/docx',
    caption: 'Teste de caption',
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: 'z9iO3BwBB1EbAnFaVJwRY7Ag',
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        console.log(`Erro ao enviar mensagem de texto: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('Erro de conexão:', error);
    });
}

function sendMessageMediaVideoFromEvo(instanceName) {
  const url = `${urlBase}/message/sendMedia/${instanceName}`;
  const payload = {
    number: '5513988289998',
    mediatype: 'video', // image, video or document
    mimetype: 'video/mp4',
    caption: 'Teste de caption',
    fileName: 'bla.mp4',
    media:
      'https://recato-evolution-media.s3.us-east-2.amazonaws.com/evolution-api/15be7ebf-c3bd-4ac2-a6be-1e8c9eaca0a5/5513981764301%40s.whatsapp.net/3EB0A5D0BF4F9C3BE100AFD25D5C9AC43D66F501/videoMessage/3EB0A5D0BF4F9C3BE100AFD25D5C9AC43D66F501.mp4',
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: 'z9iO3BwBB1EbAnFaVJwRY7Ag',
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        console.log(`Erro ao enviar mensagem de texto: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('Erro de conexão:', error);
    });
}

const qtd_max = 1; // for each 1 are sent 6 messages types, so 1 = 6 messages sent

let messages_sent_count = 0;
let count = 0;

console.time('send-message');

while (count < qtd_max) {
  sendMessageFromWebHookBusiness(); // from Meta by WebHook (simulation);
  messages_sent_count += 6;

  // // TODO
  sendMessageFromWebHookBailyes(); // from Bailyes by websocket (simulation);
  messages_sent_count += 6;

  const instanceNames = ['elasticcode']; // instances already created/integrate in evolution
  // Sent from evo to Meta through Evolution-Api
  for (const instanceName of instanceNames) {
    sendMessageTextFromEvo(instanceName);
    sendMessageMediaImageFromEvo(instanceName);
    sendMessageAudioFromEvo(instanceName);
    sendMessageMediaDocFromEvo(instanceName);
    sendMessageMediaVideoFromEvo(instanceName);
    messages_sent_count += 6;
  }

  count++;
}

console.timeEnd('send-message');
console.log('Messages Sent: ', messages_sent_count);
