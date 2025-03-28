import assert from 'assert';
import fs from 'fs';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './m365group-recyclebinitem-clear.js';

describe(commands.M365GROUP_RECYCLEBINITEM_CLEAR, () => {
  let log: string[];
  let logger: Logger;
  let promptIssued: boolean = false;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(fs, 'readFileSync').returns('abc');
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
    sinon.stub(cli, 'promptForConfirmation').callsFake(() => {
      promptIssued = true;
      return Promise.resolve(false);
    });

    promptIssued = false;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.delete,
      cli.promptForConfirmation
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.M365GROUP_RECYCLEBINITEM_CLEAR);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('clears the recycle bin items without prompting for confirmation when --force option specified', async () => {
    const deleteStub = sinon.stub(request, 'delete').resolves();

    // Stub representing the get deleted items operation
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$filter=groupTypes/any(c:c+eq+'Unified')&$top=100`) {
        return {
          "value": [
            {
              "id": "010d2f0a-0c17-4ec8-b694-e85bbe607013",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-07T13:58:01Z",
              "description": "Team 1",
              "displayName": "Team 1",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_1@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_1",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_1@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-07T13:58:01Z",
              "securityEnabled": false,
              "visibility": "Private"
            },
            {
              "id": "0157132c-bf82-48ff-99e4-b19a74950fe0",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-17T13:30:42Z",
              "description": "Team 2",
              "displayName": "Team 2",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_2@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_2",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_2@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-17T13:30:42Z",
              "securityEnabled": false,
              "visibility": "Private"
            }
          ]
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, { options: { force: true } });
    assert(deleteStub.calledTwice);
  });

  it('clears the recycle bin items when deleted items data is served in pages and --force option specified', async () => {
    const deleteStub = sinon.stub(request, 'delete').resolves();

    // Stub representing the get deleted items operation
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$filter=groupTypes/any(c:c+eq+'Unified')&$top=100`) {
        return {
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$filter=groupTypes/any(c:c+eq+'Unified')&$top=100&$skiptoken=X%2744537074090001000000000000000014000000C233BFA08475B84E8BF8C40335F8944D01000000000000000000000000000017312E322E3834302E3131333535362E312E342E32333331020000000000017D06501DC4C194438D57CFE494F81C1E%27",
          "value": [
            {
              "id": "010d2f0a-0c17-4ec8-b694-e85bbe607013",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-07T13:58:01Z",
              "description": "Team 1",
              "displayName": "Team 1",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_1@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_1",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_1@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-07T13:58:01Z",
              "securityEnabled": false,
              "visibility": "Private"
            },
            {
              "id": "0157132c-bf82-48ff-99e4-b19a74950fe0",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-17T13:30:42Z",
              "description": "Team 2",
              "displayName": "Team 2",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_2@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_2",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_2@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-17T13:30:42Z",
              "securityEnabled": false,
              "visibility": "Private"
            }
          ]
        };
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$filter=groupTypes/any(c:c+eq+'Unified')&$top=100&$skiptoken=X%2744537074090001000000000000000014000000C233BFA08475B84E8BF8C40335F8944D01000000000000000000000000000017312E322E3834302E3131333535362E312E342E32333331020000000000017D06501DC4C194438D57CFE494F81C1E%27`) {
        return {
          "value": [
            {
              "id": "310d2f0a-0c17-4ec8-b694-e85bbe607013",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-07T13:58:01Z",
              "description": "Team 3",
              "displayName": "Team 3",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_1@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_3",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_1@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-07T13:58:01Z",
              "securityEnabled": false,
              "visibility": "Private"
            }
          ]
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { force: true } });
    assert(deleteStub.calledThrice);
  });

  it('does not call delete when there are no items in the M365 group recycle bin', async () => {

    const deleteStub = sinon.stub(request, 'delete').resolves();

    // Stub representing the get deleted items operation
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$filter=groupTypes/any(c:c+eq+'Unified')&$top=100`) {
        return { "value": [] };
      }
      throw 'Invalid request';
    });

    await command.action(logger, { options: { force: true } });
    assert(deleteStub.notCalled);
  });

  it('prompts before clearing the M365 Group recycle bin items when --force option is not passed', async () => {
    await command.action(logger, { options: {} });

    assert(promptIssued);
  });

  it('aborts clearing the M365 Group recyclebin items when prompt not confirmed', async () => {
    const deleteSpy = sinon.spy(request, 'delete');
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);
    await command.action(logger, { options: {} });
    assert(deleteSpy.notCalled);
  });

  it('aborts clearing the recycle bin items when prompt not confirmed (debug)', async () => {
    const deleteSpy = sinon.spy(request, 'delete');
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);
    await command.action(logger, { options: { debug: true } });
    assert(deleteSpy.notCalled);
  });

  it('clears the M365 Group recycle bin items when prompt is confirmed', async () => {
    const deleteStub = sinon.stub(request, 'delete').resolves();

    // Stub representing the get deleted items operation
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$filter=groupTypes/any(c:c+eq+'Unified')&$top=100`) {
        return {
          "value": [
            {
              "id": "010d2f0a-0c17-4ec8-b694-e85bbe607013",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-07T13:58:01Z",
              "description": "Team 1",
              "displayName": "Team 1",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_1@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_1",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_1@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-07T13:58:01Z",
              "securityEnabled": false,
              "visibility": "Private"
            },
            {
              "id": "0157132c-bf82-48ff-99e4-b19a74950fe0",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-17T13:30:42Z",
              "description": "Team 2",
              "displayName": "Team 2",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_2@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_2",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_2@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-17T13:30:42Z",
              "securityEnabled": false,
              "visibility": "Private"
            }
          ]
        };
      }
      throw 'Invalid request';
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);
    await command.action(logger, { options: {} });
    assert(deleteStub.calledTwice);
  });


  it('clears the M365 Group recycle bin items when prompt is confirmed (debug)', async () => {
    const deleteStub = sinon.stub(request, 'delete').resolves();

    // Stub representing the get deleted items operation
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$filter=groupTypes/any(c:c+eq+'Unified')&$top=100`) {
        return {
          "value": [
            {
              "id": "010d2f0a-0c17-4ec8-b694-e85bbe607013",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-07T13:58:01Z",
              "description": "Team 1",
              "displayName": "Team 1",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_1@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_1",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_1@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-07T13:58:01Z",
              "securityEnabled": false,
              "visibility": "Private"
            },
            {
              "id": "0157132c-bf82-48ff-99e4-b19a74950fe0",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-17T13:30:42Z",
              "description": "Team 2",
              "displayName": "Team 2",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_2@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_2",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_2@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-17T13:30:42Z",
              "securityEnabled": false,
              "visibility": "Private"
            },
            {
              "id": "269f3774-ec52-4ef7-a220-6940fb7b0325",
              "deletedDateTime": null,
              "classification": null,
              "createdDateTime": "2017-12-17T13:30:42Z",
              "description": "Team 3",
              "displayName": "Team 3",
              "groupTypes": [
                "Unified"
              ],
              "mail": "team_3@contoso.onmicrosoft.com",
              "mailEnabled": true,
              "mailNickname": "team_3",
              "onPremisesLastSyncDateTime": null,
              "onPremisesProvisioningErrors": [],
              "onPremisesSecurityIdentifier": null,
              "onPremisesSyncEnabled": null,
              "preferredDataLocation": null,
              "proxyAddresses": [
                "SMTP:team_2@contoso.onmicrosoft.com"
              ],
              "renewedDateTime": "2017-12-17T13:30:42Z",
              "securityEnabled": false,
              "visibility": "Private"
            }
          ]
        };
      }
      throw 'Invalid request';
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);
    await command.action(logger, { options: { debug: true } });
    assert(deleteStub.calledThrice);
  });

  it('handles random API error', async () => {
    const errorMessage = 'Something went wrong';
    sinon.stub(request, 'get').rejects(new Error(errorMessage));

    await assert.rejects(command.action(logger, { options: { force: true } }), new CommandError(errorMessage));
  });

  it('supports specifying confirmation flag', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--force') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});
