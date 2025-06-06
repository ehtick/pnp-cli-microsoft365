import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { formatting } from '../../../../utils/formatting.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import { urlUtil } from '../../../../utils/urlUtil.js';
import commands from '../../commands.js';
import command from './listitem-record-declare.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.LISTITEM_RECORD_DECLARE, () => {
  let log: any[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let declareItemAsRecordFakeCalled = false;

  const webUrl = 'https://contoso.sharepoint.com/sites/project-x';
  const listUrl = '/sites/project-x/lists/TestList';
  const listServerRelativeUrl: string = urlUtil.getServerRelativePath(webUrl, listUrl);

  const postFakes = async (opts: any) => {
    if ((opts.url as string).indexOf('_vti_bin/client.svc/ProcessQuery') > -1) {

      // requestObjectIdentity mock
      if (opts.data.indexOf('Name="Current"') > -1) {

        if ((opts.url as string).indexOf('rejectme.sharepoint.com') > -1) {
          throw 'Failed request';
        }

        if ((opts.url as string).indexOf('returnerror.sharepoint.com') > -1) {
          throw 'error occurred';
        }

        return JSON.stringify(
          [
            {
              "SchemaVersion": "15.0.0.0",
              "LibraryVersion": "16.0.7618.1204",
              "ErrorInfo": null,
              "TraceCorrelationId": "3e3e629e-30cc-5000-9f31-cf83b8e70021"
            },
            {
              "_ObjectType_": "SP.Web",
              "_ObjectIdentity_": "d704ae73-d5ed-459e-80b0-b8103c5fb6e0|8f2be65d-f195-4699-b0de-24aca3384ba9:site:0ead8b78-89e5-427f-b1bc-6e5a77ac191c:web:4c076c07-e3f1-49a8-ad01-dbb70b263cd7",
              "ServerRelativeUrl": "\\u002fsites\\u002fprojectx"
            }
          ]);
      }

      if (opts.data.indexOf('Name="DeclareItemAsRecord') > -1 || opts.data.indexOf('Name="DeclareItemAsRecordWithDeclarationDate') > -1) {
        if ((opts.url as string).indexOf('alreadydeclared') > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8713.1223", "ErrorInfo": {
                "ErrorMessage": "This item has already been declared a record.", "ErrorValue": null, "TraceCorrelationId": "9d66cc9e-e0fa-8000-1225-3a9b7ff9284d", "ErrorCode": -2146232832, "ErrorTypeName": "Microsoft.SharePoint.SPException"
              }, "TraceCorrelationId": "9d66cc9e-e0fa-8000-1225-3a9b7ff9284d"
            }
          ]);
        }

        declareItemAsRecordFakeCalled = true;
        return JSON.stringify(
          [
            {
              "SchemaVersion": "15.0.0.0",
              "LibraryVersion": "16.0.8713.1221",
              "ErrorInfo": null,
              "TraceCorrelationId": "9d20cc9e-7077-8000-1225-32482bc95341"
            }
          ]);
      }
    }
    throw 'Invalid request';
  };

  const getFakes = async (opts: any) => {
    if ((opts.url as string).indexOf('/_api/web/lists') > -1 &&
      (opts.url as string).indexOf('$select=Id') > -1) {
      await logger.log('faked!');
      return { Id: '81f0ecee-75a8-46f0-b384-c8f4f9f31d99' };
    }

    if (opts.url === `${webUrl}/_api/web/GetList('${formatting.encodeQueryParameter(listServerRelativeUrl)}')?$select=Id`) {
      return { Id: '81f0ecee-75a8-46f0-b384-c8f4f9f31d99' };
    }

    throw 'Invalid request';
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    sinon.stub(session, 'getId').callsFake(() => '');
    sinon.stub(spo, 'getRequestDigest').callsFake(() => Promise.resolve({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    }));
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
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      request.get,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.LISTITEM_RECORD_DECLARE), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('declares a record using list title is specified', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      debug: true,
      listTitle: 'Test List',
      listItemId: 147,
      webUrl: `https://contoso.sharepoint.com/sites/project-y/`
    };

    declareItemAsRecordFakeCalled = false;
    await command.action(logger, { options: options } as any);
    assert(declareItemAsRecordFakeCalled);
  });

  it('declares a record using list url is specified', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      verbose: true,
      listUrl: listUrl,
      id: 147,
      webUrl: webUrl
    };

    declareItemAsRecordFakeCalled = false;
    await command.action(logger, { options: options } as any);
    assert(declareItemAsRecordFakeCalled);
  });

  it('declares a record using list id is passed as an option', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      listId: '99a14fe8-781c-3ce1-a1d5-c6e6a14561da',
      listItemId: 147,
      webUrl: `https://contoso.sharepoint.com/sites/project-y/`,
      debug: true
    };

    declareItemAsRecordFakeCalled = false;
    await command.action(logger, { options: options } as any);
    assert(declareItemAsRecordFakeCalled);
  });

  it('declares a record when specifying a date in debug mode', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      debug: true,
      listId: '99a14fe8-781c-3ce1-a1d5-c6e6a14561da',
      listItemId: 147,
      date: '2019-03-14',
      webUrl: `https://contoso.sharepoint.com/sites/project-y/`
    };

    declareItemAsRecordFakeCalled = false;
    await command.action(logger, { options: options } as any);
    assert(declareItemAsRecordFakeCalled);
  });

  it('declares a record when specifying a date', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      listId: '99a14fe8-781c-3ce1-a1d5-c6e6a14561da',
      listItemId: 147,
      date: '2019-03-14',
      webUrl: `https://contoso.sharepoint.com/sites/project-y/`
    };

    declareItemAsRecordFakeCalled = false;
    await command.action(logger, { options: options } as any);
    assert(declareItemAsRecordFakeCalled);
  });

  it('it reports an error correctly when an item is already declared', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      debug: true,
      listId: '99a14fe8-781c-3ce1-a1d5-c6e6a14561da',
      listItemId: 147,
      date: '2019-03-14',
      webUrl: `https://alreadydeclared.sharepoint.com/sites/project-y/`
    };

    await assert.rejects(command.action(logger, { options: options } as any), new CommandError('This item has already been declared a record.'));
  });

  it('fails to get _ObjecttIdentity_ when an error is returned by the _ObjectIdentity_ CSOM request', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      debug: true,
      listId: '99a14fe8-781c-3ce1-a1d5-c6e6a14561da',
      listItemId: 147,
      date: '2019-03-14',
      webUrl: `https://returnerror.sharepoint.com/sites/project-y/`
    };

    declareItemAsRecordFakeCalled = false;
    await assert.rejects(command.action(logger, { options: options } as any), new CommandError('error occurred'));
    assert.notStrictEqual(declareItemAsRecordFakeCalled, true);
  });

  it('fails to declare a list item as a record when an error is returned', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      debug: true,
      listTitle: 'Test List',
      listItemId: 147,
      webUrl: 'https://rejectme.sharepoint.com/sites/project-y'
    };

    declareItemAsRecordFakeCalled = false;
    await assert.rejects(command.action(logger, { options: options } as any), new CommandError('Failed request'));
    assert.notStrictEqual(declareItemAsRecordFakeCalled, true);
  });

  it('supports specifying URL', () => {
    const options = command.options;
    let containsTypeOption = false;
    options.forEach(o => {
      if (o.option.indexOf('<webUrl>') > -1) {
        containsTypeOption = true;
      }
    });
    assert(containsTypeOption);
  });

  it('fails validation if listTitle and listId option not specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listItemId: '1' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if listTitle and listId are specified together', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'Test List', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listItemId: '1' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', listTitle: 'Test List', listItemId: '1' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the item ID is not a number', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'Test List', listItemId: 'foo' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the item ID is not a positive number', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'Test List', listItemId: '-1' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the webUrl option is a valid SharePoint site URL and numerical ID specified', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'Test List', listItemId: '1' } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the listId option is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: 'foo', listItemId: '1' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the listId option is a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listItemId: '1', debug: true } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the date passed in is not in ISO format', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listItemId: '1', date: 'foo', debug: true } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the date passed in is in ISO format', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listItemId: '1', date: 'foo', debug: true } }, commandInfo);
    assert(actual);
  });
});
