import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './tenant-appcatalogurl-get.js';

describe(commands.TENANT_APPCATALOGURL_GET, () => {
  let log: any[];
  let requests: any[];
  let logger: Logger;

  let loggerLogSpy: sinon.SinonSpy;
  let loggerLogToStderrSpy: sinon.SinonSpy;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
  });

  beforeEach(() => {
    log = [];
    requests = [];
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
    loggerLogToStderrSpy = sinon.spy(logger, 'logToStderr');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.TENANT_APPCATALOGURL_GET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('handles promise error while getting tenant appcatalog', async () => {
    // get tenant app catalog
    sinon.stub(request, 'get').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf('SP_TenantSettings_Current') > -1) {
        throw 'An error has occurred';
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: {} } as any), new CommandError('An error has occurred'));
  });

  it('gets the tenant appcatalog url (debug)', async () => {
    // get tenant app catalog
    sinon.stub(request, 'get').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf('SP_TenantSettings_Current') > -1) {
        return JSON.stringify({ "CorporateCatalogUrl": "https://contoso.sharepoint.com/sites/apps" });
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true
      }
    });
    assert(loggerLogSpy.lastCall.args[0] === 'https://contoso.sharepoint.com/sites/apps');
  });

  it('handles if tenant appcatalog is null or not exist', async () => {
    // get tenant app catalog
    sinon.stub(request, 'get').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf('SP_TenantSettings_Current') > -1) {
        return JSON.stringify({ "CorporateCatalogUrl": null });
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
      }
    });
  });

  it('handles if tenant appcatalog is null or not exist (debug)', async () => {
    // get tenant app catalog
    sinon.stub(request, 'get').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf('SP_TenantSettings_Current') > -1) {
        return JSON.stringify({ "CorporateCatalogUrl": null });
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true
      }
    });
    assert(loggerLogToStderrSpy.calledWith('Tenant app catalog is not configured.'));
  });
});
