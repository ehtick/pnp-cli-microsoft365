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
import command from './contenttype-list.js';

describe(commands.CONTENTTYPE_LIST, () => {
  const ctResponse = {
    "value": [
      {
        "Parent": {
          "StringId": "0x01000B1208C5D23DF",
          "Name": "Item",
          "Group": "List items",
          "Id": { "StringId": "0x01000B1208C5D23DF" }
        },
        "Description": "Create a new document.",
        "DisplayFormTemplateName": "DocumentLibraryForm",
        "DisplayFormUrl": "",
        "DocumentTemplate": "/Shared Documents/Forms/template.dotx",
        "DocumentTemplateUrl": "/Shared Documents/Forms/template.dotx",
        "EditFormTemplateName": "DocumentLibraryForm",
        "EditFormUrl": "",
        "Group": "Document Content Types",
        "Hidden": false,
        "Id": {
          "StringValue": "0x010100260C61709CD8E548948F9BF605F8F54F"
        },
        "JSLink": "",
        "MobileDisplayFormUrl": "",
        "MobileEditFormUrl": "",
        "MobileNewFormUrl": "",
        "Name": "Document",
        "NewFormTemplateName": "DocumentLibraryForm",
        "NewFormUrl": "",
        "ReadOnly": false,
        "SchemaXml": "<ContentType ID=\"0x010100260C61709CD8E548948F9BF605F8F54F\" Name=\"Document\" Group=\"Document Content Types\" Description=\"Create a new document.\" V2ListTemplateName=\"doclib\" Version=\"0\" DelayActivateTemplateBinding=\"GROUP,SPSPERS,SITEPAGEPUBLISHING\" FeatureId=\"{695b6570-a48b-4a8e-8ea5-26ea7fc1d162}\"><Fields><Field ID=\"{c042a256-787d-4a6f-8a8a-cf6ab767f12d}\" Type=\"Computed\" DisplayName=\"Content Type\" Name=\"ContentType\" DisplaceOnUpgrade=\"TRUE\" RenderXMLUsingPattern=\"TRUE\" Sortable=\"FALSE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"ContentType\" Group=\"_Hidden\" PITarget=\"MicrosoftWindowsSharePointServices\" PIAttribute=\"ContentTypeID\" FromBaseType=\"TRUE\"><FieldRefs><FieldRef Name=\"ContentTypeId\"/></FieldRefs><DisplayPattern><MapToContentType><Column Name=\"ContentTypeId\"/></MapToContentType></DisplayPattern></Field><Field ID=\"{5f47e085-2150-41dc-b661-442f3027f552}\" ReadOnly=\"TRUE\" Type=\"Computed\" Name=\"SelectFilename\" DisplayName=\"Select\" Hidden=\"TRUE\" CanToggleHidden=\"TRUE\" Sortable=\"FALSE\" Filterable=\"FALSE\" AuthoringInfo=\"(web part connection)\" HeaderImage=\"blank.gif\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"SelectFilename\" FromBaseType=\"TRUE\"><FieldRefs><FieldRef Name=\"ID\"/></FieldRefs><DisplayPattern><IfEqual><Expr1><GetVar Name=\"SelectedID\"/></Expr1><Expr2><Column Name=\"ID\"/></Expr2><Then><HTML><![CDATA[<img align=\"absmiddle\" style=\"cursor: pointer\" src=\"/_layouts/15/images/rbsel.gif?rev=44\" alt=\"]]></HTML><HTML>Selected</HTML><HTML><![CDATA[\"/>]]></HTML></Then><Else><HTML><![CDATA[<a href=\"javascript:SelectField(']]></HTML><GetVar Name=\"View\"/><HTML><![CDATA[',']]></HTML><ScriptQuote NotAddingQuote=\"TRUE\"><Column Name=\"ID\"/></ScriptQuote><HTML><![CDATA[');return false;\" onclick=\"javascript:SelectField(']]></HTML><GetVar Name=\"View\"/><HTML><![CDATA[',']]></HTML><ScriptQuote NotAddingQuote=\"TRUE\"><Column Name=\"ID\"/></ScriptQuote><HTML><![CDATA[');return false;\" target=\"_self\">]]></HTML><HTML><![CDATA[<img border=\"0\" align=\"absmiddle\" style=\"cursor: pointer\" src=\"/_layouts/15/images/rbunsel.gif?rev=44\"  alt=\"]]></HTML><HTML>Normal</HTML><HTML><![CDATA[\"/>]]></HTML><HTML><![CDATA[</a>]]></HTML></Else></IfEqual></DisplayPattern></Field><Field ID=\"{8553196d-ec8d-4564-9861-3dbe931050c8}\" ShowInFileDlg=\"FALSE\" ShowInVersionHistory=\"FALSE\" Type=\"File\" Name=\"FileLeafRef\" DisplayName=\"Name\" AuthoringInfo=\"(for use in forms)\" List=\"Docs\" FieldRef=\"ID\" ShowField=\"LeafName\" JoinColName=\"DoclibRowId\" JoinRowOrdinal=\"0\" JoinType=\"INNER\" Required=\"TRUE\" NoCustomize=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"FileLeafRef\" FromBaseType=\"TRUE\"/><Field ID=\"{8c06beca-0777-48f7-91c7-6da68bc07b69}\" ColName=\"tp_Created\" RowOrdinal=\"0\" ReadOnly=\"TRUE\" Type=\"DateTime\" Name=\"Created\" DisplayName=\"Created\" StorageTZ=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"Created\" FromBaseType=\"TRUE\" Hidden=\"TRUE\"/><Field ID=\"{fa564e0f-0c70-4ab9-b863-0177e6ddd247}\" Type=\"Text\" Name=\"Title\" ShowInNewForm=\"FALSE\" ShowInFileDlg=\"FALSE\" DisplayName=\"Title\" Sealed=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"Title\" ColName=\"nvarchar8\" Required=\"FALSE\" ShowInEditForm=\"TRUE\"/><Field ID=\"{28cf69c5-fa48-462a-b5cd-27b6f9d2bd5f}\" ColName=\"tp_Modified\" RowOrdinal=\"0\" ReadOnly=\"TRUE\" Type=\"DateTime\" Name=\"Modified\" DisplayName=\"Modified\" StorageTZ=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"Modified\" FromBaseType=\"TRUE\" Hidden=\"TRUE\"/><Field ID=\"{822c78e3-1ea9-4943-b449-57863ad33ca9}\" ReadOnly=\"TRUE\" Hidden=\"FALSE\" Type=\"Text\" Name=\"Modified_x0020_By\" DisplayName=\"Document Modified By\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"Modified_x0020_By\" FromBaseType=\"TRUE\" ColName=\"nvarchar1\"/><Field ID=\"{4dd7e525-8d6b-4cb4-9d3e-44ee25f973eb}\" ReadOnly=\"TRUE\" Hidden=\"FALSE\" Type=\"Text\" Name=\"Created_x0020_By\" DisplayName=\"Document Created By\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"Created_x0020_By\" FromBaseType=\"TRUE\" ColName=\"nvarchar2\"/></Fields><XmlDocuments><XmlDocument NamespaceURI=\"http://schemas.microsoft.com/sharepoint/v3/contenttype/forms\"><FormTemplates xmlns=\"http://schemas.microsoft.com/sharepoint/v3/contenttype/forms\"><Display>DocumentLibraryForm</Display><Edit>DocumentLibraryForm</Edit><New>DocumentLibraryForm</New></FormTemplates></XmlDocument></XmlDocuments><Folder TargetName=\"Forms/Document\"/></ContentType>",
        "Scope": "/Shared Documents",
        "Sealed": false,
        "StringId": "0x010100260C61709CD8E548948F9BF605F8F54F"
      },
      {
        "Parent": {
          "StringId": "0x01000B1208C5D23DF",
          "Name": "Item",
          "Group": "List items",
          "Id": { "StringId": "0x01000B1208C5D23DF" }
        },
        "Description": "Create a new folder.",
        "DisplayFormTemplateName": "ListForm",
        "DisplayFormUrl": "",
        "DocumentTemplate": "",
        "DocumentTemplateUrl": "",
        "EditFormTemplateName": "ListForm",
        "EditFormUrl": "",
        "Group": "Folder Content Types",
        "Hidden": false,
        "Id": {
          "StringValue": "0x0120000EAD53EDAD7C6647B0D976EEC953F99E"
        },
        "JSLink": "",
        "MobileDisplayFormUrl": "",
        "MobileEditFormUrl": "",
        "MobileNewFormUrl": "",
        "Name": "Folder",
        "NewFormTemplateName": "ListForm",
        "NewFormUrl": "",
        "ReadOnly": false,
        "SchemaXml": "<ContentType ID=\"0x0120000EAD53EDAD7C6647B0D976EEC953F99E\" Name=\"Folder\" Group=\"Folder Content Types\" Description=\"Create a new folder.\" Sealed=\"TRUE\" Version=\"0\" DelayActivateTemplateBinding=\"GROUP,SPSPERS,SITEPAGEPUBLISHING\" FeatureId=\"{695b6570-a48b-4a8e-8ea5-26ea7fc1d162}\"><Fields><Field ID=\"{c042a256-787d-4a6f-8a8a-cf6ab767f12d}\" Type=\"Computed\" DisplayName=\"Content Type\" Name=\"ContentType\" DisplaceOnUpgrade=\"TRUE\" RenderXMLUsingPattern=\"TRUE\" Sortable=\"FALSE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"ContentType\" Group=\"_Hidden\" PITarget=\"MicrosoftWindowsSharePointServices\" PIAttribute=\"ContentTypeID\" FromBaseType=\"TRUE\"><FieldRefs><FieldRef Name=\"ContentTypeId\"/></FieldRefs><DisplayPattern><MapToContentType><Column Name=\"ContentTypeId\"/></MapToContentType></DisplayPattern></Field><Field ID=\"{fa564e0f-0c70-4ab9-b863-0177e6ddd247}\" Type=\"Text\" Name=\"Title\" ShowInNewForm=\"FALSE\" ShowInFileDlg=\"FALSE\" DisplayName=\"Title\" Sealed=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"Title\" ColName=\"nvarchar8\" Required=\"FALSE\" Hidden=\"TRUE\"/><Field ID=\"{8553196d-ec8d-4564-9861-3dbe931050c8}\" ShowInFileDlg=\"FALSE\" ShowInVersionHistory=\"FALSE\" Type=\"File\" Name=\"FileLeafRef\" DisplayName=\"Name\" AuthoringInfo=\"(for use in forms)\" List=\"Docs\" FieldRef=\"ID\" ShowField=\"LeafName\" JoinColName=\"DoclibRowId\" JoinRowOrdinal=\"0\" JoinType=\"INNER\" Required=\"TRUE\" NoCustomize=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"FileLeafRef\" FromBaseType=\"TRUE\" Hidden=\"FALSE\"/><Field ID=\"{b824e17e-a1b3-426e-aecf-f0184d900485}\" Name=\"ItemChildCount\" DisplaceOnUpgrade=\"TRUE\" ReadOnly=\"TRUE\" ShowInFileDlg=\"FALSE\" Type=\"Lookup\" DisplayName=\"Item Child Count\" List=\"Docs\" FieldRef=\"ID\" ShowField=\"ItemChildCount\" JoinColName=\"DoclibRowId\" JoinRowOrdinal=\"0\" JoinType=\"INNER\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"ItemChildCount\" FromBaseType=\"TRUE\"/><Field ID=\"{960ff01f-2b6d-4f1b-9c3f-e19ad8927341}\" Name=\"FolderChildCount\" DisplaceOnUpgrade=\"TRUE\" ReadOnly=\"TRUE\" ShowInFileDlg=\"FALSE\" Type=\"Lookup\" DisplayName=\"Folder Child Count\" List=\"Docs\" FieldRef=\"ID\" ShowField=\"FolderChildCount\" JoinColName=\"DoclibRowId\" JoinRowOrdinal=\"0\" JoinType=\"INNER\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"FolderChildCount\" FromBaseType=\"TRUE\"/></Fields><XmlDocuments><XmlDocument NamespaceURI=\"http://schemas.microsoft.com/sharepoint/v3/contenttype/forms\"><FormTemplates xmlns=\"http://schemas.microsoft.com/sharepoint/v3/contenttype/forms\"><Display>ListForm</Display><Edit>ListForm</Edit><New>ListForm</New></FormTemplates></XmlDocument></XmlDocuments></ContentType>",
        "Scope": "/Shared Documents",
        "Sealed": true,
        "StringId": "0x0120000EAD53EDAD7C6647B0D976EEC953F99E"
      }
    ]
  };

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
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CONTENTTYPE_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['StringId', 'Name', 'Hidden', 'ReadOnly', 'Sealed']);
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the webUrl option is a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert(actual);
  });

  it('passes validation if the category option is defined', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', category: 'List Content Types' } }, commandInfo);
    assert(actual);
  });

  it('command correctly handles reject request', async () => {
    const err = 'Error occured...';
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_api/web/ContentTypes?$expand=Parent') {
        throw err;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com'
      }
    }), new CommandError(err));
  });

  it('retrieves all content types (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/sites/test/_api/web/ContentTypes?$expand=Parent') {
        if (opts.headers &&
          opts.headers.accept &&
          (opts.headers.accept as string).indexOf('application/json') === 0) {
          return ctResponse;
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com/sites/test'
      }
    });
    assert(loggerLogSpy.calledWith(ctResponse.value));
  });

  it('retrieves all content types', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/test/_api/web/ContentTypes?$expand=Parent`) {
        if (opts.headers &&
          opts.headers.accept &&
          (opts.headers.accept as string).indexOf('application/json') === 0) {
          return ctResponse;
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        webUrl: 'https://contoso.sharepoint.com/sites/test'
      }
    });
    assert(loggerLogSpy.calledWith(ctResponse.value));
  });

  it('retrieves all content types by category (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/test/_api/web/ContentTypes?$expand=Parent&$filter=Group eq 'List%20Content%20Types'`) {
        if (opts.headers &&
          opts.headers.accept &&
          (opts.headers.accept as string).indexOf('application/json') === 0) {
          return ctResponse;
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        category: 'List Content Types',
        webUrl: 'https://contoso.sharepoint.com/sites/test'
      }
    });
    assert(loggerLogSpy.calledWith(ctResponse.value));
  });

  it('retrieves all content types by category', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/test/_api/web/ContentTypes?$expand=Parent&$filter=Group eq 'List%20Content%20Types'`) {
        if (opts.headers &&
          opts.headers.accept &&
          (opts.headers.accept as string).indexOf('application/json') === 0) {
          return ctResponse;
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        category: 'List Content Types',
        webUrl: 'https://contoso.sharepoint.com/sites/test'
      }
    });
    assert(loggerLogSpy.calledWith(ctResponse.value));
  });
});
