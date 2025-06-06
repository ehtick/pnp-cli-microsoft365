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
import command from './site-apppermission-get.js';

describe(commands.SITE_APPPERMISSION_GET, () => {
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
      global.setTimeout
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.SITE_APPPERMISSION_GET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation with an incorrect URL', async () => {
    const actual = await command.validate({
      options: {
        siteUrl: 'https;//contoso,sharepoint:com/sites/sitecollection-name',
        id: 'aTowaS50fG1zLnNwLmV4dHw4OWVhNWM5NC03NzM2LTRlMjUtOTVhZC0zZmE5NWY2MmI2NmVAZGUzNDhiYzctMWFlYi00NDA2LThjYjMtOTdkYjAyMWNhZGI0'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation with a correct URL', async () => {
    const actual = await command.validate({
      options: {
        siteUrl: 'https://contoso.sharepoint.com/sites/sitecollection-name',
        id: 'aTowaS50fG1zLnNwLmV4dHw4OWVhNWM5NC03NzM2LTRlMjUtOTVhZC0zZmE5NWY2MmI2NmVAZGUzNDhiYzctMWFlYi00NDA2LThjYjMtOTdkYjAyMWNhZGI0'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation with a correct URL and a filter value', async () => {
    const actual = await command.validate({
      options: {
        id: 'aTowaS50fG1zLnNwLmV4dHw4OWVhNWM5NC03NzM2LTRlMjUtOTVhZC0zZmE5NWY2MmI2NmVAZGUzNDhiYzctMWFlYi00NDA2LThjYjMtOTdkYjAyMWNhZGI0',
        siteUrl: 'https://contoso.sharepoint.com/sites/sitecollection-name'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('returns a specific application permissions for the site', async () => {
    const site = {
      "id": "contoso.sharepoint.com,00000000-0000-0000-0000-000000000000,00000000-0000-0000-0000-000000000000",
      "displayName": "OneDrive Team Site",
      "name": "1drvteam",
      "createdDateTime": "2017-05-09T20:56:00Z",
      "lastModifiedDateTime": "2017-05-09T20:56:01Z",
      "webUrl": "https://contoso.sharepoint.com/teams/1drvteam"
    };

    const response = {
      "id": "aTowaS50fG1zLnNwLmV4dHxmYzE1MzRlNy0yNTlkLTQ4MmEtODY4OC1kNmEzM2Q5YTBhMmNAZWUyYjdjMGMtZDI1My00YjI3LTk0NmItMDYzZGM4OWNlOGMy",
      "roles": [
        "write"
      ],
      "grantedToIdentities": [
        {
          "application": {
            "displayName": "Selected",
            "id": "fc1534e7-259d-482a-8688-d6a33d9a0a2c"
          }
        }
      ]
    };

    const getRequestStub = sinon.stub(request, 'get');
    getRequestStub.onCall(0)
      .callsFake(async (opts) => {
        if ((opts.url as string).indexOf(":/sites/sitecollection-name") > - 1) {
          return site;
        }
        throw 'Invalid request';
      });

    getRequestStub.onCall(1)
      .callsFake(async (opts) => {
        if ((opts.url as string).indexOf("contoso.sharepoint.com,00000000-0000-0000-0000-000000000000,00000000-0000-0000-0000-000000000000/permissions/") > - 1) {
          return response;
        }
        throw 'Invalid request';
      });

    await command.action(logger, {
      options: {
        siteUrl: 'https://contoso.sharepoint.com/sites/sitecollection-name',
        id: 'aTowaS50fG1zLnNwLmV4dHxmYzE1MzRlNy0yNTlkLTQ4MmEtODY4OC1kNmEzM2Q5YTBhMmNAZWUyYjdjMGMtZDI1My00YjI3LTk0NmItMDYzZGM4OWNlOGMy',
        output: 'json'
      }
    });
    assert(loggerLogSpy.calledWith([{
      appDisplayName: 'Selected',
      appId: 'fc1534e7-259d-482a-8688-d6a33d9a0a2c',
      permissionId: 'aTowaS50fG1zLnNwLmV4dHxmYzE1MzRlNy0yNTlkLTQ4MmEtODY4OC1kNmEzM2Q5YTBhMmNAZWUyYjdjMGMtZDI1My00YjI3LTk0NmItMDYzZGM4OWNlOGMy',
      roles: "write"
    }]));
  });

  it('fails when passing a site that does not exist', async () => {
    const siteError = {
      "error": {
        "code": "itemNotFound",
        "message": "Requested site could not be found",
        "innerError": {
          "date": "2021-03-03T08:58:02",
          "request-id": "4e054f93-0eba-4743-be47-ce36b5f91120",
          "client-request-id": "dbd35b28-0ec3-6496-1279-0e1da3d028fe"
        }
      }
    };
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('non-existing') === -1) {
        return { value: [] };
      }
      throw siteError;
    });

    await assert.rejects(command.action(logger, { options: { siteUrl: 'https://contoso.sharepoint.com/sites/sitecollection-name-non-existing' } } as any), new CommandError('Requested site could not be found'));
  });
});
