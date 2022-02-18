const { ImapFlow } = require('imapflow');
const pino = require('pino');

const transport = pino.transport({
  pipeline: [
    {
      target: 'pino-syslog',
      level: 'info',
      options: {
      }
    }
  ]
})
pino(transport);

const auth = {
  user: 'user@example.com',
  pass: 'G3heim!!'
}

const client = new ImapFlow({
    host: 'imap.example.com',
    port: 993,
    secure: true,
    logger: transport,
    auth: auth
});

var imapFolders = [];
let totalMessages = 0;
let totalUnseen = 0;

// flatten subfolder tree into an array
function addSubFolders(sub) {
  for (var i = 0; i < sub.length; i++) {
    imapFolders.push(sub[i].path);
    if (!!sub[i].folders) {
      addSubFolders(sub[i].folders);
    }
  }
}

const main = async () => {
    // Wait until client connects and authorizes
    await client.connect();
    let tree = await client.listTree();

    console.log("getting stats for ", auth.user);
    console.log(" ");

    addSubFolders(tree.folders);

    for (var i = 0; i < imapFolders.length; i++) {
      let status = await client.status(imapFolders[i], {messages:true, unseen: true});

      console.log("Folder: " + imapFolders[i] + "   messages: " + status.messages + "  unread: " + status.unseen);

      totalUnseen = totalUnseen + status.unseen;
      totalMessages = totalMessages + status.messages;
    }

    console.log(" ");
    console.log("totalMessages: ", totalMessages);
    console.log("totalUnread: ", totalUnseen);

    // log out and close connection
    await client.logout();
};

main().catch(err => console.error(err));
