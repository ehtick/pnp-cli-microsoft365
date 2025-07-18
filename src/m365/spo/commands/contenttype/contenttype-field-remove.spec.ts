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
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';

import command from './contenttype-field-remove.js';
import { settingsNames } from '../../../../settingsNames.js';
const WEB_URL = 'https://contoso.sharepoint.com';
const FIELD_LINK_ID = "5ee2dd25-d941-455a-9bdb-7f2c54aed11b";
const CONTENT_TYPE_ID = "0x0100558D85B7216F6A489A499DB361E1AE2F";
const LIST_CONTENT_TYPE_ID = "0x0100CA0FA0F5DAEF784494B9C6020C3020A60062F089A38C867747942DB2C3FC50FF6A";
const LIST_ID = "8c7a0fcd-9d64-4634-85ea-ce2b37b2ec0c";
const WEB_ID = "d1b7a30d-7c22-4c54-a686-f1c298ced3c7";
const SITE_ID = "50720268-eff5-48e0-835e-de588b007927";
const LIST_TITLE = "TEST";
const LIST_URL = "/shared documents";

describe(commands.CONTENTTYPE_FIELD_REMOVE, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;
  let promptIssued: boolean = false;

  const getStubCalls = async (opts: any) => {
    if ((opts.url as string).indexOf(`_api/site?$select=Id`) > -1) {
      return { "Id": SITE_ID };
    }
    if ((opts.url as string).indexOf(`_api/web?$select=Id`) > -1) {
      return { "Id": WEB_ID };
    }
    if ((opts.url as string).indexOf(`/_api/web/lists/getByTitle('${LIST_TITLE}')?$select=Id`) > -1) {
      return { "Id": LIST_ID };
    }
    if (opts.url === 'https://contoso.sharepoint.com/_api/web/GetList(\'%2Fshared%20documents\')?$select=Id') {
      return { "Id": LIST_ID };
    }

    throw 'Invalid request';
  };
  const postStubSuccCalls = async (opts: any) => {
    if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
      // Web CT
      if (opts.data.toLowerCase() === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName=".NET Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="77" ObjectPathId="76" /><ObjectPath Id="79" ObjectPathId="78" /><Method Name="DeleteObject" Id="80" ObjectPathId="78" /><Method Name="Update" Id="81" ObjectPathId="24"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Property Id="76" ParentId="24" Name="FieldLinks" /><Method Id="78" ParentId="76" Name="GetById"><Parameters><Parameter Type="Guid">{${FIELD_LINK_ID}}</Parameter></Parameters></Method><Identity Id="24" Name="6b3ec69e-00a7-0000-55a3-61f8d779d2b3|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:${SITE_ID}:web:${WEB_ID}:contenttype:${CONTENT_TYPE_ID}" /></ObjectPaths></Request>`.toLowerCase()) {
        return `[
            {
              "SchemaVersion": "15.0.0.0",
              "LibraryVersion": "16.0.7911.1206",
              "ErrorInfo": null,
              "TraceCorrelationId": "73557d9e-007f-0000-22fb-89971360c85c"
            }
          ]`;
      }
      // Web CT with update child CTs
      else if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName=".NET Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="77" ObjectPathId="76" /><ObjectPath Id="79" ObjectPathId="78" /><Method Name="DeleteObject" Id="80" ObjectPathId="78" /><Method Name="Update" Id="81" ObjectPathId="24"><Parameters><Parameter Type="Boolean">true</Parameter></Parameters></Method></Actions><ObjectPaths><Property Id="76" ParentId="24" Name="FieldLinks" /><Method Id="78" ParentId="76" Name="GetById"><Parameters><Parameter Type="Guid">{${FIELD_LINK_ID}}</Parameter></Parameters></Method><Identity Id="24" Name="6b3ec69e-00a7-0000-55a3-61f8d779d2b3|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:${SITE_ID}:web:${WEB_ID}:contenttype:${CONTENT_TYPE_ID}" /></ObjectPaths></Request>`) {
        return `[
            {
              "SchemaVersion": "15.0.0.0",
              "LibraryVersion": "16.0.7911.1206",
              "ErrorInfo": null,
              "TraceCorrelationId": "73557d9e-007f-0000-22fb-89971360c85c"
            }
          ]`;
      }
      // List CT
      else if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName=".NET Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="18" ObjectPathId="17" /><ObjectPath Id="20" ObjectPathId="19" /><Method Name="DeleteObject" Id="21" ObjectPathId="19" /><Method Name="Update" Id="22" ObjectPathId="15"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Property Id="17" ParentId="15" Name="FieldLinks" /><Method Id="19" ParentId="17" Name="GetById"><Parameters><Parameter Type="Guid">{${FIELD_LINK_ID}}</Parameter></Parameters></Method><Identity Id="15" Name="09eec89e-709b-0000-558c-c222dcaf9162|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:${SITE_ID}:web:${WEB_ID}:list:${LIST_ID}:contenttype:${LIST_CONTENT_TYPE_ID}" /></ObjectPaths></Request>`) {
        return `[
            {
              "SchemaVersion": "15.0.0.0",
              "LibraryVersion": "16.0.7911.1206",
              "ErrorInfo": null,
              "TraceCorrelationId": "73557d9e-007f-0000-22fb-89971360c85c"
            }
          ]`;
      }
    }

    throw 'Invalid request';
  };
  const postStubFailedCalls = async (opts: any) => {
    if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
      // WEB CT
      if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName=".NET Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="77" ObjectPathId="76" /><ObjectPath Id="79" ObjectPathId="78" /><Method Name="DeleteObject" Id="80" ObjectPathId="78" /><Method Name="Update" Id="81" ObjectPathId="24"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Property Id="76" ParentId="24" Name="FieldLinks" /><Method Id="78" ParentId="76" Name="GetById"><Parameters><Parameter Type="Guid">{${FIELD_LINK_ID}}</Parameter></Parameters></Method><Identity Id="24" Name="6b3ec69e-00a7-0000-55a3-61f8d779d2b3|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:${SITE_ID}:web:${WEB_ID}:contenttype:${CONTENT_TYPE_ID}" /></ObjectPaths></Request>`) {
        return `[
          {
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7911.1206",
            "ErrorInfo": {
              "ErrorMessage": "Unknown Error", "ErrorValue": null, "TraceCorrelationId": "b33c489e-009b-5000-8240-a8c28e5fd8b4", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.Client.UnknownError"
            },
            "TraceCorrelationId": "e5547d9e-705d-0000-22fb-8faca5696ed8"
          }
        ]`;
      }
      // Web CT without update child CTs
      else if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName=".NET Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="77" ObjectPathId="76" /><ObjectPath Id="79" ObjectPathId="78" /><Method Name="DeleteObject" Id="80" ObjectPathId="78" /><Method Name="Update" Id="81" ObjectPathId="24"><Parameters><Parameter Type="Boolean">true</Parameter></Parameters></Method></Actions><ObjectPaths><Property Id="76" ParentId="24" Name="FieldLinks" /><Method Id="78" ParentId="76" Name="GetById"><Parameters><Parameter Type="Guid">{${FIELD_LINK_ID}}</Parameter></Parameters></Method><Identity Id="24" Name="6b3ec69e-00a7-0000-55a3-61f8d779d2b3|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:${SITE_ID}:web:${WEB_ID}:contenttype:${CONTENT_TYPE_ID}" /></ObjectPaths></Request>`) {
        return `[
          {
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7911.1206",
            "ErrorInfo": {
              "ErrorMessage": "Unknown Error", "ErrorValue": null, "TraceCorrelationId": "b33c489e-009b-5000-8240-a8c28e5fd8b4", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.Client.UnknownError"
            },
            "TraceCorrelationId": "e5547d9e-705d-0000-22fb-8faca5696ed8"
          }
        ]`;
      }
      // LIST CT
      else if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName=".NET Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="18" ObjectPathId="17" /><ObjectPath Id="20" ObjectPathId="19" /><Method Name="DeleteObject" Id="21" ObjectPathId="19" /><Method Name="Update" Id="22" ObjectPathId="15"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Property Id="17" ParentId="15" Name="FieldLinks" /><Method Id="19" ParentId="17" Name="GetById"><Parameters><Parameter Type="Guid">{${FIELD_LINK_ID}}</Parameter></Parameters></Method><Identity Id="15" Name="09eec89e-709b-0000-558c-c222dcaf9162|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:${SITE_ID}:web:${WEB_ID}:list:${LIST_ID}:contenttype:${LIST_CONTENT_TYPE_ID}" /></ObjectPaths></Request>`) {
        return `[
          {
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7911.1206",
            "ErrorInfo": {
              "ErrorMessage": "Unknown Error", "ErrorValue": null, "TraceCorrelationId": "b33c489e-009b-5000-8240-a8c28e5fd8b4", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.Client.UnknownError"
            },
            "TraceCorrelationId": "e5547d9e-705d-0000-22fb-8faca5696ed8"
          }
        ]`;
      }

    }
    throw 'Invalid request';
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
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
    sinon.stub(cli, 'promptForConfirmation').callsFake(() => {
      promptIssued = true;
      return Promise.resolve(false);
    });

    promptIssued = false;
    loggerLogSpy = sinon.spy(logger, 'log');
    (command as any).requestDigest = '';
    (command as any).webId = '';
    (command as any).siteId = '';
    (command as any).listId = '';
    (command as any).id = '';
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.post,
      cli.promptForConfirmation,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CONTENTTYPE_FIELD_REMOVE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('configures command types', () => {
    assert.notStrictEqual(typeof command.types, 'undefined', 'command types undefined');
    assert.notStrictEqual(command.types.string, 'undefined', 'command string types undefined');
  });

  it('configures contentTypeId as string option', () => {
    const types = command.types;
    ['i', 'contentTypeId'].forEach(o => {
      assert.notStrictEqual((types.string as string[]).indexOf(o), -1, `option ${o} not specified as string`);
    });
  });

  // WEB CT
  it('removes the field link from web content type', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        force: true
      }
    } as any);
    assert(postCallbackStub.called);
  });
  it('removes the field link from web content type - prompt', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        force: false
      }
    } as any);

    assert(promptIssued);
  });
  it('removes the field link from web content type - prompt: confirmed', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);
    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false
      }
    } as any);
    assert(postCallbackStub.called);
  });
  it('doesnt remove the field link from web content type - prompt: declined', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true
      }
    } as any);
    assert(postCallbackStub.notCalled);
  });

  it('removes the field link from web content type with debug - prompt', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        force: false,
        debug: true
      }
    } as any);
    assert(promptIssued);
  });

  it(`doesn't remove the field link from web content type with debug - prompt: declined`, async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        debug: true
      }
    } as any);
    assert(postCallbackStub.notCalled);
  });

  // WEB CT: with update child content types
  it('removes the field link from web content type with update child content types', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: true
      }
    } as any);
    assert(loggerLogSpy.notCalled);
  });
  it('removes the field link from web content type with update child content types - prompt', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true
      }
    } as any);
    assert(promptIssued);
  });
  it('removes the field link from web content type with update child content types - prompt: confirmed', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: false
      }
    } as any);
    assert(postCallbackStub.called);
  });
  it('doesnt remove the field link from web content type with update child content types - prompt: declined', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: false
      }
    } as any);
    assert(postCallbackStub.notCalled);
  });

  it('removes the field link from web content type with update child content types with debug - prompt', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: false,
        debug: true
      }
    } as any);
    assert(promptIssued);
  });

  it('doesnt remove the field link from web content type with update child content types with debug - prompt: confirmed', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: false,
        debug: true
      }
    } as any);
    assert(postCallbackStub.called);
  });

  it('doesnt remove the field link from web content type with update child content types with debug - prompt: declined', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: false,
        debug: true
      }
    } as any);
    assert(postCallbackStub.notCalled);
  });

  // LIST CT
  it('removes the field link from list (retrieved by title) content type', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        force: true
      }
    } as any);
    assert(postCallbackStub.called);
    assert(loggerLogSpy.notCalled);
  });

  it('removes the field link from list (retrieved by id) content type', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listId: LIST_ID, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        force: true
      }
    } as any);
    assert(postCallbackStub.called);
    assert(loggerLogSpy.notCalled);
  });

  it('removes the field link from list (retrieved by url) content type', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listUrl: LIST_URL, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        force: true
      }
    } as any);
    assert(postCallbackStub.called);
    assert(loggerLogSpy.notCalled);
  });

  it('removes the field link from list (retrieved by title) content type - prompt', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID
      }
    } as any);

    assert(promptIssued);
  });

  it('removes the field link from list (retrieved by title) content type - prompt: confirmed', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        force: true
      }
    } as any);
    assert(postCallbackStub.called);
    assert(loggerLogSpy.notCalled);
  });

  it('removes the field link from list (retrieved by title) content type - prompt: declined', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        force: false
      }
    } as any);
    assert(postCallbackStub.notCalled);
    assert(loggerLogSpy.notCalled);
  });

  // LIST CT with debug
  it('removes the field link from list (retrieved by title) content type with debug', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        force: true,
        debug: true
      }
    } as any);
    assert(postCallbackStub.called);
  });
  it('removes the field link from list (retrieved by title) content type with debug - prompt', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        debug: true
      }
    } as any);

    assert(promptIssued);
  });
  it('removes the field link from list (retrieved by title) content type with debug - prompt: confirmed', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        debug: true
      }
    } as any);
    assert(postCallbackStub.called);
  });

  it('removes the field link from list (retrieved by id) content type with debug - prompt: confirmed', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listId: LIST_ID, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        debug: true
      }
    } as any);
    assert(postCallbackStub.called);
  });

  it('removes the field link from list (retrieved by url) content type with debug - prompt: confirmed', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listUrl: LIST_URL, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        debug: true
      }
    } as any);
    assert(postCallbackStub.called);
  });
  it('removes the field link from list (retrieved by title) content type with debug - prompt: declined', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    const postCallbackStub = sinon.stub(request, 'post').callsFake(postStubSuccCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        webUrl: WEB_URL, listTitle: LIST_TITLE, contentTypeId: LIST_CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: false,
        debug: true
      }
    } as any);
    assert(postCallbackStub.notCalled);
  });

  // Handles error
  it('handles error when remove the field link from web content type with update child content types', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubFailedCalls);

    await assert.rejects(command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: true
      }
    } as any), new CommandError('Unknown Error'));
  });

  it('handles error when remove the field link from web content type with update child content types (debug)', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubFailedCalls);

    await assert.rejects(command.action(logger, { options: { debug: true, webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID, updateChildContentTypes: true, force: true } } as any),
      new CommandError('Unknown Error'));
  });

  it('handles error when remove the field link from web content type with update child content types with prompt', async () => {
    sinon.stub(request, 'get').callsFake(getStubCalls);
    sinon.stub(request, 'post').callsFake(postStubFailedCalls);

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await assert.rejects(command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: false
      }
    } as any), new CommandError('Unknown Error'));
  });

  it('correctly handles a random API error', async () => {
    sinon.stub(request, 'get').callsFake(() => Promise.reject('An error has occurred'));
    sinon.stub(request, 'post').callsFake(() => Promise.reject('An error has occurred'));

    await assert.rejects(command.action(logger, {
      options: {
        webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID, id: FIELD_LINK_ID,
        updateChildContentTypes: true,
        force: true
      }
    } as any), new CommandError('An error has occurred'));
  });

  // Fails validation
  it('fails validation if id is not passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if webUrl is not passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { id: FIELD_LINK_ID, contentTypeId: CONTENT_TYPE_ID } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if webUrl is not correct', async () => {
    const actual = await command.validate({ options: { id: FIELD_LINK_ID, contentTypeId: CONTENT_TYPE_ID, webUrl: "test" } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if listId is not correct', async () => {
    const actual = await command.validate({ options: { id: FIELD_LINK_ID, contentTypeId: CONTENT_TYPE_ID, webUrl: WEB_URL, listId: 'foo' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if id is not valid GUID', async () => {
    const actual = await command.validate({ options: { id: 'xxx', webUrl: WEB_URL, contentTypeId: CONTENT_TYPE_ID } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  // Passes validation
  it('passes validation', async () => {
    const actual = await command.validate({ options: { listTitle: 'List', id: FIELD_LINK_ID, contentTypeId: CONTENT_TYPE_ID, webUrl: WEB_URL, debug: true } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
