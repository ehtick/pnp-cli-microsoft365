import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import config from '../../../../config.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';
import command from './storageentity-set.js';

describe(commands.STORAGEENTITY_SET, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogToStderrSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

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
    loggerLogToStderrSpy = sinon.spy(logger, 'logToStderr');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      spo.getSpoAdminUrl
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.STORAGEENTITY_SET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('sets tenant property', async () => {
    const postStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] &&
          opts.data) {
          if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="24" ObjectPathId="23" /><ObjectPath Id="26" ObjectPathId="25" /><ObjectPath Id="28" ObjectPathId="27" /><Method Name="SetStorageEntity" Id="29" ObjectPathId="27"><Parameters><Parameter Type="String">Property1</Parameter><Parameter Type="String">Lorem</Parameter><Parameter Type="String">ipsum</Parameter><Parameter Type="String">dolor</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="23" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="25" ParentId="23" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="27" ParentId="25" Name="RootWeb" /></ObjectPaths></Request>`) {
            return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]);
          }
        }
      }
      throw 'Invalid request';
    });
    await command.action(logger, { options: { debug: true, key: 'Property1', value: 'Lorem', description: 'ipsum', comment: 'dolor', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual((postStub.lastCall.args[0].headers as any)['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="24" ObjectPathId="23" /><ObjectPath Id="26" ObjectPathId="25" /><ObjectPath Id="28" ObjectPathId="27" /><Method Name="SetStorageEntity" Id="29" ObjectPathId="27"><Parameters><Parameter Type="String">Property1</Parameter><Parameter Type="String">Lorem</Parameter><Parameter Type="String">ipsum</Parameter><Parameter Type="String">dolor</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="23" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="25" ParentId="23" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="27" ParentId="25" Name="RootWeb" /></ObjectPaths></Request>`);
  });

  it('sets tenant property without description and comment', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { key: 'Property1', value: 'Lorem', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="24" ObjectPathId="23" /><ObjectPath Id="26" ObjectPathId="25" /><ObjectPath Id="28" ObjectPathId="27" /><Method Name="SetStorageEntity" Id="29" ObjectPathId="27"><Parameters><Parameter Type="String">Property1</Parameter><Parameter Type="String">Lorem</Parameter><Parameter Type="String"></Parameter><Parameter Type="String"></Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="23" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="25" ParentId="23" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="27" ParentId="25" Name="RootWeb" /></ObjectPaths></Request>`);

  });

  it('sets tenant property without description and comment (debug)', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, key: 'Property1', value: 'Lorem', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="24" ObjectPathId="23" /><ObjectPath Id="26" ObjectPathId="25" /><ObjectPath Id="28" ObjectPathId="27" /><Method Name="SetStorageEntity" Id="29" ObjectPathId="27"><Parameters><Parameter Type="String">Property1</Parameter><Parameter Type="String">Lorem</Parameter><Parameter Type="String"></Parameter><Parameter Type="String"></Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="23" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="25" ParentId="23" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="27" ParentId="25" Name="RootWeb" /></ObjectPaths></Request>`);
  });

  it('escapes XML in user input', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]);
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { debug: true, key: '<Property1>', value: '\"Lorem\"', description: '"ipsum"', comment: '<dolor & samet>', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="24" ObjectPathId="23" /><ObjectPath Id="26" ObjectPathId="25" /><ObjectPath Id="28" ObjectPathId="27" /><Method Name="SetStorageEntity" Id="29" ObjectPathId="27"><Parameters><Parameter Type="String">&lt;Property1&gt;</Parameter><Parameter Type="String">&quot;Lorem&quot;</Parameter><Parameter Type="String">&quot;ipsum&quot;</Parameter><Parameter Type="String">&lt;dolor &amp; samet&gt;</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="23" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="25" ParentId="23" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="27" ParentId="25" Name="RootWeb" /></ObjectPaths></Request>`);
  });

  it('correctly handles a generic error when setting tenant property', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": {
              "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.PublicCdn.TenantCdnAdministrationException"
            }, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129"
          }
        ]);
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        key: 'Property1',
        value: 'Lorem',
        description: 'ipsum',
        comment: 'dolor',
        appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog'
      }
    } as any), new CommandError('An error has occurred'));
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="24" ObjectPathId="23" /><ObjectPath Id="26" ObjectPathId="25" /><ObjectPath Id="28" ObjectPathId="27" /><Method Name="SetStorageEntity" Id="29" ObjectPathId="27"><Parameters><Parameter Type="String">Property1</Parameter><Parameter Type="String">Lorem</Parameter><Parameter Type="String">ipsum</Parameter><Parameter Type="String">dolor</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="23" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="25" ParentId="23" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="27" ParentId="25" Name="RootWeb" /></ObjectPaths></Request>`);
  });

  it('correctly handles access denied error when setting tenant property', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": {
              "ErrorMessage": "Access denied.", "ErrorValue": null, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.PublicCdn.TenantCdnAdministrationException"
            }, "TraceCorrelationId": "965d299e-a0c6-4000-8546-cc244881a129"
          }
        ]);
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        key: 'Property1',
        value: 'Lorem',
        description: 'ipsum',
        comment: 'dolor',
        appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog'
      }
    } as any), new CommandError('Access denied.'));
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="24" ObjectPathId="23" /><ObjectPath Id="26" ObjectPathId="25" /><ObjectPath Id="28" ObjectPathId="27" /><Method Name="SetStorageEntity" Id="29" ObjectPathId="27"><Parameters><Parameter Type="String">Property1</Parameter><Parameter Type="String">Lorem</Parameter><Parameter Type="String">ipsum</Parameter><Parameter Type="String">dolor</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="23" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="25" ParentId="23" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="27" ParentId="25" Name="RootWeb" /></ObjectPaths></Request>`);
    assert.strictEqual(loggerLogToStderrSpy.calledWithMatch('This error is often caused by invalid URL of the app catalog site'), true);
  });

  it('requires app catalog URL', () => {
    const options = command.options;
    let requiresAppCatalogUrl = false;
    options.forEach(o => {
      if (o.option.indexOf('<appCatalogUrl>') > -1) {
        requiresAppCatalogUrl = true;
      }
    });
    assert(requiresAppCatalogUrl);
  });

  it('requires tenant property name', () => {
    const options = command.options;
    let requiresTenantPropertyName = false;
    options.forEach(o => {
      if (o.option.indexOf('<key>') > -1) {
        requiresTenantPropertyName = true;
      }
    });
    assert(requiresTenantPropertyName);
  });

  it('requires tenant property value', () => {
    const options = command.options;
    let requiresTenantPropertyValue = false;
    options.forEach(o => {
      if (o.option.indexOf('<value>') > -1) {
        requiresTenantPropertyValue = true;
      }
    });
    assert(requiresTenantPropertyValue);
  });

  it('supports setting tenant property description', () => {
    const options = command.options;
    let supportsTenantPropertyDescription = false;
    options.forEach(o => {
      if (o.option.indexOf('[description]') > -1) {
        supportsTenantPropertyDescription = true;
      }
    });
    assert(supportsTenantPropertyDescription);
  });

  it('supports setting tenant property comment', () => {
    const options = command.options;
    let supportsTenantPropertyComment = false;
    options.forEach(o => {
      if (o.option.indexOf('[comment]') > -1) {
        supportsTenantPropertyComment = true;
      }
    });
    assert(supportsTenantPropertyComment);
  });

  it('accepts valid SharePoint Online app catalog URL', async () => {
    const actual = await command.validate({ options: { appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog', key: 'prop', value: 'val' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts valid SharePoint Online site URL', async () => {
    const actual = await command.validate({ options: { appCatalogUrl: 'https://contoso.sharepoint.com', key: 'prop', value: 'val' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('rejects invalid SharePoint Online URL', async () => {
    const url = 'http://contoso';
    const actual = await command.validate({ options: { appCatalogUrl: url, key: 'prop', value: 'val' } }, commandInfo);
    assert.strictEqual(actual, `'${url}' is not a valid SharePoint Online site URL.`);
  });

  it('handles promise rejection', async () => {
    sinon.stub(spo, 'getSpoAdminUrl').rejects(new Error('error'));

    await assert.rejects(command.action(logger, { options: { debug: true, key: 'Property1', value: 'Lorem', description: 'ipsum', comment: 'dolor', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } } as any), new CommandError('error'));
  });
});
