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
import command from './serviceannouncement-health-get.js';

describe(commands.SERVICEANNOUNCEMENT_HEALTH_GET, () => {
  const serviceHealthResponse = {
    "service": "Exchange Online",
    "status": "serviceOperational",
    "id": "Exchange"
  };

  const serviceHealthResponseCSV = `service,status,id
    Exchange Online,serviceDegradation,Exchange`;

  const serviceHealthIssueResponse = [
    {
      "service": "Exchange Online",
      "status": "serviceOperational",
      "id": "Exchange",
      "issues": [
        {
          "startDateTime": "2020-11-04T00:00:00Z",
          "endDateTime": "2020-11-20T17:00:00Z",
          "lastModifiedDateTime": "2020-11-20T17:56:31.39Z",
          "title": "Admins are unable to migrate some user mailboxes from IMAP using the Exchange admin center or PowerShell",
          "id": "EX226574",
          "impactDescription": "Admins attempting to migrate some user mailboxes using the Exchange admin center or PowerShell experienced failures.",
          "classification": "Advisory",
          "origin": "Microsoft",
          "status": "ServiceRestored",
          "service": "Exchange Online",
          "feature": "Tenant Administration (Provisioning, Remote PowerShell)",
          "featureGroup": "Management and Provisioning",
          "isResolved": true,
          "details": [],
          "posts": [
            {
              "createdDateTime": "2020-11-12T07:07:38.97Z",
              "postType": "Regular",
              "description": {
                "contentType": "Text",
                "content": "Title: Exchange Online service has login issue. We'll provide an update within 30 minutes."
              }
            }
          ]
        }
      ]
    }
  ];

  let log: string[];
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
    (command as any).items = [];
    (command as any).planId = undefined;
    (command as any).bucketId = undefined;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.SERVICEANNOUNCEMENT_HEALTH_GET), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('passes validation when command called', async () => {
    const actual = await command.validate({
      options: {
        serviceName: "Exchange Online"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when command called with issues', async () => {
    const actual = await command.validate({
      options: {
        serviceName: "Exchange Online",
        issues: true
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('correctly returns service health', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews/Exchange Online`) {
        return serviceHealthResponse;
      }

      throw 'Invalid request';
    });

    const options: any = {
      serviceName: "Exchange Online"
    };

    await command.action(logger, { options } as any);
    assert(loggerLogSpy.calledWith(serviceHealthResponse));
  });


  it('correctly returns service health as csv with issues flag', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews/Exchange Online`) {
        return serviceHealthResponseCSV;
      }

      throw 'Invalid request';
    });

    const options: any = {
      serviceName: "Exchange Online",
      issues: true,
      output: "csv"
    };

    await command.action(logger, { options } as any);
    assert(loggerLogSpy.calledWith(serviceHealthResponseCSV));
  });

  it('correctly returns service health with issues', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews/Exchange Online?$expand=issues`) {
        return serviceHealthIssueResponse;
      }

      throw 'Invalid request';
    });

    const options: any = {
      serviceName: "Exchange Online",
      issues: true
    };

    await command.action(logger, { options } as any);
    assert(loggerLogSpy.calledWith(serviceHealthIssueResponse));
  });

  it('correctly handles random API error', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').rejects(new Error('An error has occurred'));

    await assert.rejects(command.action(logger, { options: {} } as any), new CommandError('An error has occurred'));
  });
});
