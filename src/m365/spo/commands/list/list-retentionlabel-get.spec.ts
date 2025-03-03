import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './list-retentionlabel-get.js';

describe(commands.LIST_RETENTIONLABEL_GET, () => {
  let log: any[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogSpy = sinon.spy(logger, 'log');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.post
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.LIST_RETENTIONLABEL_GET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('gets the label from the given list if title option is passed (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/SP_CompliancePolicy_SPPolicyStoreProxy_GetListComplianceTag`) > -1) {
        return {
          "AcceptMessagesOnlyFromSendersOrMembers": false,
          "AccessType": null,
          "AllowAccessFromUnmanagedDevice": null,
          "AutoDelete": false,
          "BlockDelete": false,
          "BlockEdit": false,
          "ContainsSiteLabel": false,
          "DisplayName": "",
          "EncryptionRMSTemplateId": null,
          "HasRetentionAction": false,
          "IsEventTag": false,
          "Notes": null,
          "RequireSenderAuthenticationEnabled": false,
          "ReviewerEmail": null,
          "SharingCapabilities": null,
          "SuperLock": false,
          "TagDuration": 0,
          "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
          "TagName": "Sensitive",
          "TagRetentionBasedOn": null
        };
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/web/lists/GetByTitle('MyLibrary')`) > -1) {
        return { "RootFolder": { "Exists": true, "IsWOPIEnabled": false, "ItemCount": 0, "Name": "MyLibrary", "ProgID": null, "ServerRelativeUrl": "/sites/team1/MyLibrary", "TimeCreated": "2019-01-11T10:03:19Z", "TimeLastModified": "2019-01-11T10:03:20Z", "UniqueId": "faaa6af2-0157-4e9a-a352-6165195923c8", "WelcomePage": "" } };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listTitle: 'MyLibrary'
      }
    });
    const expected = {
      "AcceptMessagesOnlyFromSendersOrMembers": false,
      "AccessType": null,
      "AllowAccessFromUnmanagedDevice": null,
      "AutoDelete": false,
      "BlockDelete": false,
      "BlockEdit": false,
      "ContainsSiteLabel": false,
      "DisplayName": "",
      "EncryptionRMSTemplateId": null,
      "HasRetentionAction": false,
      "IsEventTag": false,
      "Notes": null,
      "RequireSenderAuthenticationEnabled": false,
      "ReviewerEmail": null,
      "SharingCapabilities": null,
      "SuperLock": false,
      "TagDuration": 0,
      "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
      "TagName": "Sensitive",
      "TagRetentionBasedOn": null
    };
    const actual = log[log.length - 1];
    assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
  });

  it('gets the label from the given list if title option is passed', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/`) > -1) {
        return {
          "AcceptMessagesOnlyFromSendersOrMembers": false,
          "AccessType": null,
          "AllowAccessFromUnmanagedDevice": null,
          "AutoDelete": false,
          "BlockDelete": false,
          "BlockEdit": false,
          "ContainsSiteLabel": false,
          "DisplayName": "",
          "EncryptionRMSTemplateId": null,
          "HasRetentionAction": false,
          "IsEventTag": false,
          "Notes": null,
          "RequireSenderAuthenticationEnabled": false,
          "ReviewerEmail": null,
          "SharingCapabilities": null,
          "SuperLock": false,
          "TagDuration": 0,
          "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
          "TagName": "Sensitive",
          "TagRetentionBasedOn": null
        };
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/web/lists/GetByTitle('MyLibrary')`) > -1) {
        return { "RootFolder": { "Exists": true, "IsWOPIEnabled": false, "ItemCount": 0, "Name": "MyLibrary", "ProgID": null, "ServerRelativeUrl": "/sites/team1/MyLibrary", "TimeCreated": "2019-01-11T10:03:19Z", "TimeLastModified": "2019-01-11T10:03:20Z", "UniqueId": "faaa6af2-0157-4e9a-a352-6165195923c8", "WelcomePage": "" } };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listTitle: 'MyLibrary'
      }
    });
    const expected = {
      "AcceptMessagesOnlyFromSendersOrMembers": false,
      "AccessType": null,
      "AllowAccessFromUnmanagedDevice": null,
      "AutoDelete": false,
      "BlockDelete": false,
      "BlockEdit": false,
      "ContainsSiteLabel": false,
      "DisplayName": "",
      "EncryptionRMSTemplateId": null,
      "HasRetentionAction": false,
      "IsEventTag": false,
      "Notes": null,
      "RequireSenderAuthenticationEnabled": false,
      "ReviewerEmail": null,
      "SharingCapabilities": null,
      "SuperLock": false,
      "TagDuration": 0,
      "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
      "TagName": "Sensitive",
      "TagRetentionBasedOn": null
    };
    const actual = log[log.length - 1];
    assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
  });

  it('gets the label from the given list if list id option is passed (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/SP_CompliancePolicy_SPPolicyStoreProxy_GetListComplianceTag`) > -1) {
        return {
          "AcceptMessagesOnlyFromSendersOrMembers": false,
          "AccessType": null,
          "AllowAccessFromUnmanagedDevice": null,
          "AutoDelete": false,
          "BlockDelete": false,
          "BlockEdit": false,
          "ContainsSiteLabel": false,
          "DisplayName": "",
          "EncryptionRMSTemplateId": null,
          "HasRetentionAction": false,
          "IsEventTag": false,
          "Notes": null,
          "RequireSenderAuthenticationEnabled": false,
          "ReviewerEmail": null,
          "SharingCapabilities": null,
          "SuperLock": false,
          "TagDuration": 0,
          "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
          "TagName": "Sensitive",
          "TagRetentionBasedOn": null
        };
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/web/lists(guid'fb4b0cf8-c006-4802-a1ea-57e0e4852188')`) > -1) {
        return { "RootFolder": { "Exists": true, "IsWOPIEnabled": false, "ItemCount": 0, "Name": "MyLibrary", "ProgID": null, "ServerRelativeUrl": "/sites/team1/MyLibrary", "TimeCreated": "2019-01-11T10:03:19Z", "TimeLastModified": "2019-01-11T10:03:20Z", "UniqueId": "faaa6af2-0157-4e9a-a352-6165195923c8", "WelcomePage": "" } };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listId: 'fb4b0cf8-c006-4802-a1ea-57e0e4852188'
      }
    });
    const expected = {
      "AcceptMessagesOnlyFromSendersOrMembers": false,
      "AccessType": null,
      "AllowAccessFromUnmanagedDevice": null,
      "AutoDelete": false,
      "BlockDelete": false,
      "BlockEdit": false,
      "ContainsSiteLabel": false,
      "DisplayName": "",
      "EncryptionRMSTemplateId": null,
      "HasRetentionAction": false,
      "IsEventTag": false,
      "Notes": null,
      "RequireSenderAuthenticationEnabled": false,
      "ReviewerEmail": null,
      "SharingCapabilities": null,
      "SuperLock": false,
      "TagDuration": 0,
      "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
      "TagName": "Sensitive",
      "TagRetentionBasedOn": null

    };
    const actual = log[log.length - 1];
    assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
  });

  it('gets the label from the given list if list id option is passed', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/SP_CompliancePolicy_SPPolicyStoreProxy_GetListComplianceTag`) > -1) {
        return {
          "AcceptMessagesOnlyFromSendersOrMembers": false,
          "AccessType": null,
          "AllowAccessFromUnmanagedDevice": null,
          "AutoDelete": false,
          "BlockDelete": false,
          "BlockEdit": false,
          "ContainsSiteLabel": false,
          "DisplayName": "",
          "EncryptionRMSTemplateId": null,
          "HasRetentionAction": false,
          "IsEventTag": false,
          "Notes": null,
          "RequireSenderAuthenticationEnabled": false,
          "ReviewerEmail": null,
          "SharingCapabilities": null,
          "SuperLock": false,
          "TagDuration": 0,
          "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
          "TagName": "Sensitive",
          "TagRetentionBasedOn": null
        };
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/web/lists(guid'fb4b0cf8-c006-4802-a1ea-57e0e4852188')`) > -1) {
        return { "RootFolder": { "Exists": true, "IsWOPIEnabled": false, "ItemCount": 0, "Name": "MyLibrary", "ProgID": null, "ServerRelativeUrl": "/sites/team1/MyLibrary", "TimeCreated": "2019-01-11T10:03:19Z", "TimeLastModified": "2019-01-11T10:03:20Z", "UniqueId": "faaa6af2-0157-4e9a-a352-6165195923c8", "WelcomePage": "" } };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listId: 'fb4b0cf8-c006-4802-a1ea-57e0e4852188'
      }
    });
    const expected = {
      "AcceptMessagesOnlyFromSendersOrMembers": false,
      "AccessType": null,
      "AllowAccessFromUnmanagedDevice": null,
      "AutoDelete": false,
      "BlockDelete": false,
      "BlockEdit": false,
      "ContainsSiteLabel": false,
      "DisplayName": "",
      "EncryptionRMSTemplateId": null,
      "HasRetentionAction": false,
      "IsEventTag": false,
      "Notes": null,
      "RequireSenderAuthenticationEnabled": false,
      "ReviewerEmail": null,
      "SharingCapabilities": null,
      "SuperLock": false,
      "TagDuration": 0,
      "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
      "TagName": "Sensitive",
      "TagRetentionBasedOn": null
    };
    const actual = log[log.length - 1];
    assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
  });

  it('gets the label from the given list if url option is passed (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/`) > -1) {
        return {
          "AcceptMessagesOnlyFromSendersOrMembers": false,
          "AccessType": null,
          "AllowAccessFromUnmanagedDevice": null,
          "AutoDelete": false,
          "BlockDelete": false,
          "BlockEdit": false,
          "ContainsSiteLabel": false,
          "DisplayName": "",
          "EncryptionRMSTemplateId": null,
          "HasRetentionAction": false,
          "IsEventTag": false,
          "Notes": null,
          "RequireSenderAuthenticationEnabled": false,
          "ReviewerEmail": null,
          "SharingCapabilities": null,
          "SuperLock": false,
          "TagDuration": 0,
          "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
          "TagName": "Sensitive",
          "TagRetentionBasedOn": null
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listUrl: 'sites/team1/documents'
      }
    });
    const expected = {
      "AcceptMessagesOnlyFromSendersOrMembers": false,
      "AccessType": null,
      "AllowAccessFromUnmanagedDevice": null,
      "AutoDelete": false,
      "BlockDelete": false,
      "BlockEdit": false,
      "ContainsSiteLabel": false,
      "DisplayName": "",
      "EncryptionRMSTemplateId": null,
      "HasRetentionAction": false,
      "IsEventTag": false,
      "Notes": null,
      "RequireSenderAuthenticationEnabled": false,
      "ReviewerEmail": null,
      "SharingCapabilities": null,
      "SuperLock": false,
      "TagDuration": 0,
      "TagId": "4d535433-2a7b-40b0-9dad-8f0f8f3b3841",
      "TagName": "Sensitive",
      "TagRetentionBasedOn": null
    };
    const actual = log[log.length - 1];
    assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
  });

  it('correctly handles the case when no label has been set on the specified list', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/SP_CompliancePolicy_SPPolicyStoreProxy_GetListComplianceTag`) > -1) {
        return {
          "odata.null": true
        };
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/web/lists(guid'fb4b0cf8-c006-4802-a1ea-57e0e4852188')`) > -1) {
        return { "RootFolder": { "Exists": true, "IsWOPIEnabled": false, "ItemCount": 0, "Name": "MyLibrary", "ProgID": null, "ServerRelativeUrl": "/sites/team1/MyLibrary", "TimeCreated": "2019-01-11T10:03:19Z", "TimeLastModified": "2019-01-11T10:03:20Z", "UniqueId": "faaa6af2-0157-4e9a-a352-6165195923c8", "WelcomePage": "" } };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listId: 'fb4b0cf8-c006-4802-a1ea-57e0e4852188'
      }
    } as any);
    assert(loggerLogSpy.notCalled);
  });

  it('correctly handles error when trying to get label for the list', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/SP_CompliancePolicy_SPPolicyStoreProxy_GetListComplianceTag`) > -1) {
        throw {
          error: {
            'odata.error': {
              code: '-1, Microsoft.SharePoint.Client.InvalidOperationException',
              message: {
                value: 'An error has occurred'
              }
            }
          }
        };
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/web/lists/GetByTitle('MyLibrary')`) > -1) {
        return { "RootFolder": { "Exists": true, "IsWOPIEnabled": false, "ItemCount": 0, "Name": "MyLibrary", "ProgID": null, "ServerRelativeUrl": "/sites/team1/MyLibrary", "TimeCreated": "2019-01-11T10:03:19Z", "TimeLastModified": "2019-01-11T10:03:20Z", "UniqueId": "faaa6af2-0157-4e9a-a352-6165195923c8", "WelcomePage": "" } };
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listTitle: 'MyLibrary'
      }
    } as any), new CommandError("An error has occurred"));
  });

  it('correctly handles error when trying to get label from a list that doesn\'t exist', async () => {
    const error = {
      error: {
        'odata.error': {
          code: '-1, Microsoft.SharePoint.Client.InvalidOperationException',
          message: {
            value: '404 - File not found'
          }
        }
      }
    };

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/SP_CompliancePolicy_SPPolicyStoreProxy_GetListComplianceTag`) > -1) {
        return [];
      }

      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://contoso.sharepoint.com/sites/team1/_api/web/lists(guid'dfddade1-4729-428d-881e-7fedf3cae50d')`) > -1) {
        throw error;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        webUrl: 'https://contoso.sharepoint.com/sites/team1',
        listId: 'dfddade1-4729-428d-881e-7fedf3cae50d'
      }
    } as any), new CommandError(error.error['odata.error'].message.value));
  });

  it('fails validation if the url option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', listId: 'cc27a922-8224-4296-90a5-ebbc54da2e85' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the url option is a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF' } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the listid option is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: 'XXXXX' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the listid option is a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: 'cc27a922-8224-4296-90a5-ebbc54da2e85' } }, commandInfo);
    assert(actual);
  });
});
