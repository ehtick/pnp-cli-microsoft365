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
import command from './file-checkout.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.FILE_CHECKOUT, () => {
  let log: any[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  const stubPostResponses: any = (getFileByServerRelativeUrlResp: any = null, getFileByIdResp: any = null) => {
    return sinon.stub(request, 'post').callsFake(async (opts) => {
      if (getFileByServerRelativeUrlResp) {
        throw getFileByServerRelativeUrlResp;
      }
      else {
        if ((opts.url as string).indexOf('/_api/web/GetFileByServerRelativePath(DecodedUrl=') > -1) {
          return;
        }
      }

      if (getFileByIdResp) {
        throw getFileByIdResp;
      }
      else {
        if ((opts.url as string).indexOf('/_api/web/GetFileById(') > -1) {
          return;
        }
      }

      throw 'Invalid request';
    });
  };

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
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.FILE_CHECKOUT);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('command correctly handles file get reject request', async () => {
    const err = 'An error has occurred';
    const error = {
      error: {
        'odata.error': {
          code: '-1, Microsoft.SharePoint.Client.InvalidOperationException',
          message: {
            value: err
          }
        }
      }
    };
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/web/GetFileById') > -1) {
        throw error;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com',
        id: 'f09c4efe-b8c0-4e89-a166-03418661b89b'
      }
    }), new CommandError(err));
  });

  it('should handle checked out by someone else file', async () => {
    const expectedError: any = JSON.stringify({ "odata.error": { "code": "-2130575306, Microsoft.SharePoint.SPFileCheckOutException", "message": { "lang": "en-US", "value": "The file \"https://contoso.sharepoint.com/sites/xx/Shared Documents/abc.txt\" is checked out for editing by i:0#.f|membership|xx" } } });
    stubPostResponses(expectedError);

    const actionId: string = '0CD891EF-AFCE-4E55-B836-FCE03286CCCF';

    await assert.rejects(command.action(logger, {
      options: {
        verbose: true,
        id: actionId,
        webUrl: 'https://contoso.sharepoint.com/sites/project-x'
      }
    }), new CommandError(expectedError));
  });

  it('should handle file does not exist', async () => {
    const expectedError: any = JSON.stringify({ "odata.error": { "code": "-2130575338, Microsoft.SharePoint.SPException", "message": { "lang": "en-US", "value": "Error: File Not Found." } } });
    stubPostResponses(null, expectedError);

    const actionId: string = '0CD891EF-AFCE-4E55-B836-FCE03286CCCF';

    await assert.rejects(command.action(logger, {
      options: {
        verbose: true,
        id: actionId,
        webUrl: 'https://contoso.sharepoint.com/sites/project-x'
      }
    }), new CommandError(expectedError));
  });

  it('should call the correct API url when UniqueId option is passed', async () => {
    const postStub: sinon.SinonStub = stubPostResponses();

    const actionId: string = '0CD891EF-AFCE-4E55-B836-FCE03286CCCF';

    await command.action(logger, {
      options: {
        verbose: true,
        id: actionId,
        webUrl: 'https://contoso.sharepoint.com/sites/project-x'
      }
    });
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/project-x/_api/web/GetFileById(\'0CD891EF-AFCE-4E55-B836-FCE03286CCCF\')/checkout');
  });

  it('should call the correct API url when URL option is passed', async () => {
    const postStub: sinon.SinonStub = stubPostResponses();

    await command.action(logger, {
      options: {
        url: '/sites/project-x/Documents/Test1.docx',
        webUrl: 'https://contoso.sharepoint.com/sites/project-x'
      }
    });
    assert.strictEqual(postStub.lastCall.args[0].url, "https://contoso.sharepoint.com/sites/project-x/_api/web/GetFileByServerRelativePath(DecodedUrl='%2Fsites%2Fproject-x%2FDocuments%2FTest1.docx')/checkout");
  });

  it('should call the correct API url when tenant root URL option is passed', async () => {
    const postStub: sinon.SinonStub = stubPostResponses();

    await command.action(logger, {
      options: {
        url: '/Documents/Test1.docx',
        webUrl: 'https://contoso.sharepoint.com'
      }
    });
    assert.strictEqual(postStub.lastCall.args[0].url, "https://contoso.sharepoint.com/_api/web/GetFileByServerRelativePath(DecodedUrl='%2FDocuments%2FTest1.docx')/checkout");
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', id: 'f09c4efe-b8c0-4e89-a166-03418661b89b' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the webUrl option is a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: 'f09c4efe-b8c0-4e89-a166-03418661b89b' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if the id option is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: '12345' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the id option is a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: 'f09c4efe-b8c0-4e89-a166-03418661b89b' } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the id or url option not specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both id and url options are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: 'f09c4efe-b8c0-4e89-a166-03418661b89b', url: '/sites/project-x/documents' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });
});
