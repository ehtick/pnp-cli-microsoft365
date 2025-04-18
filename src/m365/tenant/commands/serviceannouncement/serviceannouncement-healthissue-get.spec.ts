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
import command from './serviceannouncement-healthissue-get.js';

describe(commands.SERVICEANNOUNCEMENT_HEALTHISSUE_GET, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;

  const jsonOutput = {
    "startDateTime": "2021-08-02T14:36:00Z",
    "endDateTime": "2021-08-06T20:25:00Z",
    "lastModifiedDateTime": "2021-08-06T20:28:36.537Z",
    "title": "Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.",
    "id": "CR275975",
    "impactDescription": "Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.",
    "classification": "advisory",
    "origin": "microsoft",
    "status": "serviceRestored",
    "service": "Dynamics 365 Apps",
    "feature": "Other",
    "featureGroup": "Other",
    "isResolved": true,
    "highImpact": null,
    "details": [],
    "posts": [
      {
        "createdDateTime": "2021-08-06T17:49:34.54Z",
        "postType": "regular",
        "description": {
          "contentType": "html",
          "content": "Title: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.User Impact: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.We are aware of an emerging issue in which a custom connector previously added to a DLP policy using PowerShell may be removed if the DLP policy is edited through the Power Platform Admin Center. We are investigating the issue and will provide another update within the next 30 minutes.This information is preliminary and may be subject to changes, corrections, and updates."
        }
      },
      {
        "createdDateTime": "2021-08-06T18:13:57.923Z",
        "postType": "regular",
        "description": {
          "contentType": "html",
          "content": "Title: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.User Impact: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.More Info:This only affects the legacy experience; DLP policies created through the Power Platform admin center are unaffected.To more easily manage custom connectors in your tenant-level DLP policy, you can now use the Custom Connector URL Patterns feature (currently in preview). Please <a href=\"https://docs.microsoft.com/en-us/power-platform/admin/dlp-custom-connector-parity\">review the following documentation.</a>You can verify whether your custom connector is still in the policy using PowerShell. Please see the following <a href=\"https://docs.microsoft.com/en-us/powershell/module/microsoft.powerapps.administration.powershell/get-dlppolicy?view=pa-ps-latest\">documentation</a>.Current Status: We are currently examining service telemetry and recent service updates to determine the root cause of this issue.Incident Start Time: Monday, August 2, 2021, at 2:36 PM UTCNext Update: Friday, August 6, 2021, at 9:00 PM UTC, to allow time for additional investigation."
        }
      },
      {
        "createdDateTime": "2021-08-06T20:28:36.537Z",
        "postType": "regular",
        "description": {
          "contentType": "html",
          "content": "Title: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.User Impact: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.More Info:This only affects the unsupported legacy experience; DLP policies created through the Power Platform admin center are unaffected.To manage custom connectors in your tenant-level DLP policy, you can now use the Custom Connector URL Patterns feature (currently in preview). Please <a href=\"https://docs.microsoft.com/en-us/power-platform/admin/dlp-custom-connector-parity\">review the following documentation.</a>You can verify whether your custom connector is still in the policy using PowerShell. Please see the following <a href=\"https://docs.microsoft.com/en-us/powershell/module/microsoft.powerapps.administration.powershell/get-dlppolicy?view=pa-ps-latest\">documentation</a>.Final Status: After our investigation, we have determined that this is a known bug that only occurs using the unsupported legacy PowerShell experience. The issue occurs when the following steps are performed:1. An admin opens the DLP policies page in the Power Platform Admin Center in a web browser.2. A custom connector is added to the policy using the \"Add-CustomConnectorToPolicy\" PowerShell cmdlet.3. Without refreshing the policy list, the admin then edits and saves the same policy in Power Platform Admin Center.4. The previously-added custom connector gets removed from the policy.We recommend avoiding the above process and perform DLP policy updates using the Power Platform admin center interface.As this rarely occurs in the above scenario using unsupported methods, we are treating this issue as a known bug that will be addressed in a future service update.Incident Start Time: Monday, August 2, 2021, at 2:36 PM UTCIncident End Time: Friday, August 6, 2021, at 8:25 PM UTCPreliminary Root Cause: A known bug that occurs when a custom connector is added to a DLP policy via legacy  PowerShell cmdlet and then edited using a cached version of the DLP policies page in the Power Platform Admin Center.Next Steps: We are developing a patch  to correct this issue to be included in a future service update.This is the final update on the incident."
        }
      }
    ]
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
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
    assert.strictEqual(command.name, commands.SERVICEANNOUNCEMENT_HEALTHISSUE_GET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('handles promise error while getting a specified service health issue for tenant', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if ((opts.url as string).indexOf('/admin/serviceAnnouncement/issues/') > -1) {
        throw 'An error has occurred';
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { id: 'invalid' } } as any), new CommandError('An error has occurred'));
  });

  it('gets the specified service health issue for tenant', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/admin/serviceAnnouncement/issues/') > -1) {
        return jsonOutput;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        id: 'CR275975',
        debug: true
      }
    });
    assert(loggerLogSpy.calledWith(jsonOutput));
  });
});
