import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../Auth.js';
import { cli } from '../../../cli/cli.js';
import { CommandInfo } from '../../../cli/CommandInfo.js';
import { Logger } from '../../../cli/Logger.js';
import { CommandError } from '../../../Command.js';
import request from '../../../request.js';
import { telemetry } from '../../../telemetry.js';
import { pid } from '../../../utils/pid.js';
import { session } from '../../../utils/session.js';
import { sinonUtil } from '../../../utils/sinonUtil.js';
import commands from '../commands.js';
import { ResultTableRow } from './search/datatypes/ResultTableRow.js';
import { SearchResult } from './search/datatypes/SearchResult.js';
import command from './spo-search.js';

enum TestID {
  None,
  QueryAll_NoParameterTest,
  QueryAll_WithQueryTemplateTest,
  QueryDocuments_WithStartRow0Test,
  QueryDocuments_WithStartRow1Test,
  QueryDocuments_NoStartRowTest,
  QueryDocuments_NoParameterTest,
  QueryDocuments_WithDocId0Test,
  QueryDocuments_WithDocId1Test,
  QueryDocuments_WithDocId2Test,
  QueryDocuments_WithDocIdAllTest,
  QueryAll_WithRowLimitTest,
  QueryAll_WithSourceIdTest,
  QueryAll_WithTrimDuplicatesTest,
  QueryAll_WithEnableStemmingTest,
  QueryAll_WithCultureTest,
  QueryAll_WithRefinementFiltersTest,
  QueryAll_SortListTest,
  QueryAll_WithRankingModelIdTest,
  QueryAll_WithStartRowTest,
  QueryAll_WithPropertiesTest,
  QueryAll_WithSourceNameAndPreviousPropertiesTest,
  QueryAll_WithSourceNameAndNoPreviousPropertiesTest,
  QueryAll_WithRefinersTest,
  QueryAll_WithWebTest,
  QueryAll_WithHiddenConstraintsTest,
  QueryAll_WithClientTypeTest,
  QueryAll_WithEnablePhoneticTest,
  QueryAll_WithProcessBestBetsTest,
  QueryAll_WithEnableQueryRulesTest,
  QueryAll_WithProcessPersonalFavoritesTest
}

describe(commands.SEARCH, () => {
  let log: any[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let returnArrayLength = 0;
  let executedTest: TestID = TestID.None;
  const urlContains = (opts: any, substring: string): boolean => {
    return opts.url.toUpperCase().indexOf(substring.toUpperCase()) > -1;
  };
  const filterRows = (rows: ResultTableRow[], key: string, value: string) => {
    return rows.filter(row => {
      return row.Cells.filter(cell => {
        return (cell.Key.toUpperCase() === key.toUpperCase() && cell.Value.toUpperCase() === value.toUpperCase());
      }).length > 0;
    });
  };
  const getFakeRows = (): ResultTableRow[] => {
    return [
      {
        "Cells": [
          { "Key": "Rank", "Value": "1", "ValueType": "Edm.Double" },
          { "Key": "DocId", "Value": "1", "ValueType": "Edm.Int64" },
          { "Key": "Path", "Value": "MyPath-item1", "ValueType": "Edm.String" },
          { "Key": "Author", "Value": "myAuthor-item1", "ValueType": "Edm.String" },
          { "Key": "FileType", "Value": "docx", "ValueType": "Edm.String" },
          { "Key": "OriginalPath", "Value": "myOriginalPath-item1", "ValueType": "Edm.String" },
          { "Key": "PartitionId", "Value": "00000000-0000-0000-0000-000000000000", "ValueType": "Edm.Guid" },
          { "Key": "UrlZone", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "Culture", "Value": "en-US", "ValueType": "Edm.String" },
          { "Key": "ResultTypeId", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "IsDocument", "Value": "true", "ValueType": "Edm.Boolean" },
          { "Key": "RenderTemplateId", "Value": "~sitecollection/_catalogs/masterpage/Display Templates/Search/Item_Default.js", "ValueType": "Edm.String" }
        ]
      },
      {
        "Cells": [
          { "Key": "Rank", "Value": "2", "ValueType": "Edm.Double" },
          { "Key": "DocId", "Value": "2", "ValueType": "Edm.Int64" },
          { "Key": "Path", "Value": "MyPath-item2", "ValueType": "Edm.String" },
          { "Key": "Author", "Value": "myAuthor-item2", "ValueType": "Edm.String" },
          { "Key": "FileType", "Value": "docx", "ValueType": "Edm.String" },
          { "Key": "OriginalPath", "Value": "myOriginalPath-item2", "ValueType": "Edm.String" },
          { "Key": "PartitionId", "Value": "00000000-0000-0000-0000-000000000000", "ValueType": "Edm.Guid" },
          { "Key": "UrlZone", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "Culture", "Value": "en-US", "ValueType": "Edm.String" },
          { "Key": "ResultTypeId", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "IsDocument", "Value": "true", "ValueType": "Edm.Boolean" },
          { "Key": "RenderTemplateId", "Value": "~sitecollection/_catalogs/masterpage/Display Templates/Search/Item_Default.js", "ValueType": "Edm.String" }
        ]
      },
      {
        "Cells": [
          { "Key": "Rank", "Value": "3", "ValueType": "Edm.Double" },
          { "Key": "DocId", "Value": "3", "ValueType": "Edm.Int64" },
          { "Key": "Path", "Value": "MyPath-item3", "ValueType": "Edm.String" },
          { "Key": "Author", "Value": "myAuthor-item3", "ValueType": "Edm.String" },
          { "Key": "FileType", "Value": "aspx", "ValueType": "Edm.String" },
          { "Key": "OriginalPath", "Value": "myOriginalPath-item3", "ValueType": "Edm.String" },
          { "Key": "PartitionId", "Value": "00000000-0000-0000-0000-000000000000", "ValueType": "Edm.Guid" },
          { "Key": "UrlZone", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "Culture", "Value": "en-US", "ValueType": "Edm.String" },
          { "Key": "ResultTypeId", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "IsDocument", "Value": "false", "ValueType": "Edm.Boolean" },
          { "Key": "RenderTemplateId", "Value": "~sitecollection/_catalogs/masterpage/Display Templates/Search/Item_Default.js", "ValueType": "Edm.String" }
        ]
      },
      {
        "Cells": [
          { "Key": "Rank", "Value": "4", "ValueType": "Edm.Double" },
          { "Key": "DocId", "Value": "4", "ValueType": "Edm.Int64" },
          { "Key": "Path", "Value": "MyPath-item4", "ValueType": "Edm.String" },
          { "Key": "Author", "Value": "myAuthor-item4", "ValueType": "Edm.String" },
          { "Key": "FileType", "Value": "aspx", "ValueType": "Edm.String" },
          { "Key": "OriginalPath", "Value": "myOriginalPath-item4", "ValueType": "Edm.String" },
          { "Key": "PartitionId", "Value": "00000000-0000-0000-0000-000000000000", "ValueType": "Edm.Guid" },
          { "Key": "UrlZone", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "Culture", "Value": "nl-NL", "ValueType": "Edm.String" },
          { "Key": "ResultTypeId", "Value": "0", "ValueType": "Edm.Int32" },
          { "Key": "IsDocument", "Value": "false", "ValueType": "Edm.Boolean" },
          { "Key": "RenderTemplateId", "Value": "~sitecollection/_catalogs/masterpage/Display Templates/Search/Item_Default.js", "ValueType": "Edm.String" }
        ]
      }
    ];
  };
  const fakeRows: ResultTableRow[] = getFakeRows();
  const getQueryResult = (rows: ResultTableRow[], totalRows?: number): SearchResult => {
    returnArrayLength = totalRows ? totalRows : rows.length;

    return {
      "ElapsedTime": 83,
      "PrimaryQueryResult": {
        "CustomResults": [],
        "QueryId": "00000000-0000-0000-0000-000000000000",
        "QueryRuleId": "00000000-0000-0000-0000-000000000000",
        "RefinementResults": null,
        "RelevantResults": {
          "GroupTemplateId": null,
          "ItemTemplateId": null,
          "Properties": [
            {
              "Key": "GenerationId",
              "Value": "9223372036854775806",
              "ValueType": "Edm.Int64"
            }
          ],
          "ResultTitle": null,
          "ResultTitleUrl": null,
          "RowCount": rows.length,
          "Table": {
            "Rows": rows
          },
          "TotalRows": returnArrayLength,
          "TotalRowsIncludingDuplicates": returnArrayLength
        },
        "SpecialTermResults": null
      },
      "Properties": [
        {
          "Key": "RowLimit",
          "Value": "10",
          "ValueType": "Edm.Int32"
        }
      ],
      "SecondaryQueryResults": [],
      "SpellingSuggestion": "",
      "TriggeredRules": []
    };
  };
  const getFakes = async (opts: any) => {
    if (urlContains(opts, 'QUERYTEXT=\'ISDOCUMENT:1\'')) {
      const rows = filterRows(fakeRows, 'ISDOCUMENT', 'TRUE');

      if (urlContains(opts, 'ROWLIMIT=1')) {
        if (urlContains(opts, 'STARTROW=0')) {
          executedTest = TestID.QueryDocuments_WithStartRow0Test;
          return getQueryResult([rows[0]], 2);
        }
        else if (urlContains(opts, 'STARTROW=1')) {
          executedTest = TestID.QueryDocuments_WithStartRow1Test;
          return getQueryResult([rows[1]], 2);
        }
        else {
          executedTest = TestID.QueryDocuments_NoStartRowTest;
          return getQueryResult([]);
        }
      }

      executedTest = TestID.QueryDocuments_NoParameterTest;
      return getQueryResult(rows);
    }
    if (urlContains(opts, `QUERYTEXT=\'ISDOCUMENT:1 INDEXDOCID>0\'`)) {
      const rows = filterRows(fakeRows, 'ISDOCUMENT', 'TRUE');

      if (urlContains(opts, 'ROWLIMIT=500')) {
        executedTest = TestID.QueryDocuments_WithDocIdAllTest;
        return getQueryResult(rows, 4);
      }
      else {
        executedTest = TestID.QueryDocuments_WithDocId0Test;
        return getQueryResult([rows[0]], 2);
      }
    }
    if (urlContains(opts, `QUERYTEXT=\'ISDOCUMENT:1 INDEXDOCID>1\'`)) {
      const rows = filterRows(fakeRows, 'ISDOCUMENT', 'TRUE');
      executedTest = TestID.QueryDocuments_WithDocId1Test;
      return getQueryResult([rows[1]], 1);
    }
    if (urlContains(opts, `QUERYTEXT=\'ISDOCUMENT:1 INDEXDOCID>2\'`)) {
      executedTest = TestID.QueryDocuments_WithDocId2Test;
      return getQueryResult([], 0);
    }
    if (urlContains(opts, 'QUERYTEXT=\'*\'')) {
      let rows = fakeRows;
      if (urlContains(opts, 'ROWLIMIT=1')) {
        executedTest = TestID.QueryAll_WithRowLimitTest;
        return getQueryResult([rows[0]]);
      }
      if (urlContains(opts, 'SOURCEID=\'6E71030E-5E16-4406-9BFF-9C1829843083\'')) {
        executedTest = TestID.QueryAll_WithSourceIdTest;
        return getQueryResult([rows[3]]);
      }
      if (urlContains(opts, 'TRIMDUPLICATES=TRUE')) {
        executedTest = TestID.QueryAll_WithTrimDuplicatesTest;
        return getQueryResult([rows[2], rows[3]]);
      }
      if (urlContains(opts, 'ENABLESTEMMING=FALSE')) {
        executedTest = TestID.QueryAll_WithEnableStemmingTest;
        return getQueryResult([rows[2], rows[3]]);
      }
      if (urlContains(opts, 'CULTURE=1043')) {
        rows = filterRows(fakeRows, 'CULTURE', 'NL-NL');

        executedTest = TestID.QueryAll_WithCultureTest;
        return getQueryResult(rows);
      }
      if (urlContains(opts, 'refinementfilters=\'fileExtension:equals("docx")\'')) {
        rows = filterRows(fakeRows, 'FILETYPE', 'DOCX');

        executedTest = TestID.QueryAll_WithRefinementFiltersTest;
        return getQueryResult(rows);
      }
      if (urlContains(opts, 'queryTemplate=\'{searchterms} fileType:docx\'')) {
        rows = filterRows(fakeRows, 'FILETYPE', 'DOCX');

        executedTest = TestID.QueryAll_WithQueryTemplateTest;
        return getQueryResult(rows);
      }
      if (urlContains(opts, 'sortList=\'Rank%3Aascending\'')) {
        executedTest = TestID.QueryAll_SortListTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'rankingModelId=\'d4ac6500-d1d0-48aa-86d4-8fe9a57a74af\'')) {
        executedTest = TestID.QueryAll_WithRankingModelIdTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'startRow=1')) {
        executedTest = TestID.QueryAll_WithStartRowTest;
        const rowsToReturn = fakeRows.slice();
        rowsToReturn.splice(0, 1);
        return getQueryResult(rowsToReturn);
      }
      if (urlContains(opts, 'properties=\'termid:guid\'')) {
        executedTest = TestID.QueryAll_WithPropertiesTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'properties=\'SourceName:Local SharePoint Results,SourceLevel:SPSite\'')) {
        executedTest = TestID.QueryAll_WithSourceNameAndNoPreviousPropertiesTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'properties=\'some:property,SourceName:Local SharePoint Results,SourceLevel:SPSite\'')) {
        executedTest = TestID.QueryAll_WithSourceNameAndPreviousPropertiesTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'refiners=\'author,size\'')) {
        executedTest = TestID.QueryAll_WithRefinersTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'https://contoso.sharepoint.com/sites/subsite')) {
        executedTest = TestID.QueryAll_WithWebTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'hiddenConstraints=\'developer\'')) {
        executedTest = TestID.QueryAll_WithHiddenConstraintsTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'clientType=\'custom\'')) {
        executedTest = TestID.QueryAll_WithClientTypeTest;
        return getQueryResult(fakeRows);
      }

      if (urlContains(opts, 'enablephonetic=true')) {
        executedTest = TestID.QueryAll_WithEnablePhoneticTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'processBestBets=true')) {
        executedTest = TestID.QueryAll_WithProcessBestBetsTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'enableQueryRules=false')) {
        executedTest = TestID.QueryAll_WithEnableQueryRulesTest;
        return getQueryResult(fakeRows);
      }
      if (urlContains(opts, 'processPersonalFavorites=true')) {
        executedTest = TestID.QueryAll_WithProcessPersonalFavoritesTest;
        return getQueryResult(fakeRows);
      }

      executedTest = TestID.QueryAll_NoParameterTest;
      return getQueryResult(rows);
    }
    returnArrayLength = 0;
    throw 'Invalid request';
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
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
    assert.strictEqual(command.name, commands.SEARCH);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('executes search request', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'json',
        debug: true,
        queryText: '*'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_NoParameterTest);
  });

  it('executes search request with output option text', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: 'IsDocument:1'
      }
    });
    assert.strictEqual(returnArrayLength, 2);
    assert.strictEqual(executedTest, TestID.QueryDocuments_NoParameterTest);
  });

  it('executes search request with output option text and \'allResults\'', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: 'IsDocument:1',
        allResults: true,
        rowLimit: 1
      }
    });
    assert.strictEqual(executedTest, TestID.QueryDocuments_WithDocId2Test);
  });

  it('executes search request with trimDuplicates', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        trimDuplicates: true
      }
    });
    assert.strictEqual(returnArrayLength, 2);
    assert.strictEqual(executedTest, TestID.QueryAll_WithTrimDuplicatesTest);
  });

  it('executes search request with sortList', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        sortList: 'Rank:ascending'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_SortListTest);
  });

  it('executes search request with enableStemming=false', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        enableStemming: false
      }
    });
    assert.strictEqual(returnArrayLength, 2);
    assert.strictEqual(executedTest, TestID.QueryAll_WithEnableStemmingTest);
  });

  it('executes search request with enableStemming=true', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        enableStemming: true
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_NoParameterTest);
  });

  it('executes search request with culture', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        culture: 1043
      }
    });
    assert.strictEqual(returnArrayLength, 1);
    assert.strictEqual(executedTest, TestID.QueryAll_WithCultureTest);
  });

  it('executes search request with output option json and \'allResults\'', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'json',
        queryText: 'IsDocument:1',
        allResults: true,
        verbose: true,
        rowLimit: 1
      }
    });
    assert.strictEqual(executedTest, TestID.QueryDocuments_WithDocId2Test);
  });

  it('executes search request with \'allResults\' and no rowlimit', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'json',
        queryText: 'IsDocument:1',
        allResults: true,
        verbose: true
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryDocuments_WithDocIdAllTest);
  });

  it('executes search request with selectProperties', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: 'IsDocument:1',
        selectProperties: 'Path'
      }
    });
    assert.strictEqual(returnArrayLength, 2);
    assert.strictEqual(executedTest, TestID.QueryDocuments_NoParameterTest);
  });

  it('executes search request with refinementFilters', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        refinementFilters: 'fileExtension:equals("docx")'
      }
    });
    assert.strictEqual(returnArrayLength, 2);
    assert.strictEqual(executedTest, TestID.QueryAll_WithRefinementFiltersTest);
  });

  it('executes search request with queryTemplate', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        queryTemplate: '{searchterms} fileType:docx'
      }
    });
    assert.strictEqual(returnArrayLength, 2);
    assert.strictEqual(executedTest, TestID.QueryAll_WithQueryTemplateTest);
  });

  it('executes search request with sourceId', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        sourceId: '6e71030e-5e16-4406-9bff-9c1829843083'
      }
    });
    assert.strictEqual(returnArrayLength, 1);
    assert.strictEqual(executedTest, TestID.QueryAll_WithSourceIdTest);
  });

  it('executes search request with rankingModelId', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        queryText: '*',
        rankingModelId: 'd4ac6500-d1d0-48aa-86d4-8fe9a57a74af'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithRankingModelIdTest);
  });

  it('executes search request with rowLimits defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        rowLimit: 1
      }
    });
    assert.strictEqual(returnArrayLength, 1);
    assert.strictEqual(executedTest, TestID.QueryAll_WithRowLimitTest);
  });

  it('executes search request with startRow defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        startRow: 1
      }
    });
    assert.strictEqual(returnArrayLength, 3);
    assert.strictEqual(executedTest, TestID.QueryAll_WithStartRowTest);
  });

  it('executes search request with properties defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        properties: 'termid:guid'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithPropertiesTest);
  });

  it('executes search request with sourceName defined and no previous properties', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        sourceName: 'Local SharePoint Results'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithSourceNameAndNoPreviousPropertiesTest);
  });

  it('executes search request with sourceName defined and previous properties (ends with \',\')', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        properties: 'some:property,',
        sourceName: 'Local SharePoint Results'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithSourceNameAndPreviousPropertiesTest);
  });

  it('executes search request with sourceName defined and previous properties (Doesn\'t end with \',\')', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        properties: 'some:property',
        sourceName: 'Local SharePoint Results'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithSourceNameAndPreviousPropertiesTest);
  });

  it('executes search request with refiners defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        refiners: 'author,size'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithRefinersTest);
  });

  it('executes search request with web defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        webUrl: 'https://contoso.sharepoint.com/sites/subsite'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithWebTest);
  });

  it('executes search request with hiddenConstraints defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        hiddenConstraints: 'developer'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithHiddenConstraintsTest);
  });

  it('executes search request with clientType defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        clientType: 'custom'
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithClientTypeTest);
  });

  it('executes search request with enablePhonetic defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        enablePhonetic: true
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithEnablePhoneticTest);
  });

  it('executes search request with processBestBets defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        processBestBets: true
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithProcessBestBetsTest);
  });

  it('executes search request with enableQueryRules defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        enableQueryRules: false
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithEnableQueryRulesTest);
  });

  it('executes search request with processPersonalFavorites defined', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'text',
        debug: true,
        queryText: '*',
        processPersonalFavorites: true
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_WithProcessPersonalFavoritesTest);
  });

  it('executes search request with parameter rawOutput', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    await command.action(logger, {
      options: {
        output: 'json',
        debug: true,
        queryText: '*',
        rawOutput: true
      }
    });
    assert.strictEqual(returnArrayLength, 4);
    assert.strictEqual(executedTest, TestID.QueryAll_NoParameterTest);
  });

  it('fails validation if the sourceId is not a valid GUID', async () => {
    const actual = await command.validate({
      options: {
        sourceId: '123',
        queryText: '*'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the sourceId is a valid GUID', async () => {
    const actual = await command.validate({
      options: {
        sourceId: '1caf7dcd-7e83-4c3a-94f7-932a1299c844',
        queryText: '*'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if the rankingModelId is not a valid GUID', async () => {
    const actual = await command.validate({
      options: {
        rankingModelId: '123',
        queryText: '*'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the rankingModelId is a valid GUID', async () => {
    const actual = await command.validate({
      options: {
        rankingModelId: 'd4ac6500-d1d0-48aa-86d4-8fe9a57a74af',
        queryText: '*'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if the rowLimit is not a valid number', async () => {
    const actual = await command.validate({
      options: {
        rowLimit: '1X',
        queryText: '*'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the startRow is not a valid number', async () => {
    const actual = await command.validate({
      options: {
        startRow: '1X',
        queryText: '*'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if startRow is set together with allResults', async () => {
    const actual = await command.validate({
      options: {
        startRow: 1,
        allResults: true,
        queryText: '*'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the culture is not a valid number', async () => {
    const actual = await command.validate({
      options: {
        culture: '1X',
        queryText: '*'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('command correctly handles reject request', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/contextinfo') > -1) {
        return {
          FormDigestValue: 'abc'
        };
      }

      throw 'Invalid request';
    });

    const err = 'Invalid request';
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/web/webs') > -1) {
        throw err;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com'
      }
    } as any), new CommandError(err));
  });

  it('supports specifying queryText', () => {
    const options = command.options;
    let containsTypeOption = false;
    options.forEach(o => {
      if (o.option.indexOf('<queryText>') > -1) {
        containsTypeOption = true;
      }
    });
    assert(containsTypeOption);
  });

  it('passes validation if all options are provided', async () => {
    const actual = await command.validate({ options: { queryText: '*' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if sortList is in an invalid format', async () => {
    const actual = await command.validate({ options: { queryText: '*', sortList: 'property1:wrongvalue' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if sortList is in a valid format', async () => {
    const actual = await command.validate({ options: { queryText: '*', sortList: 'property1:ascending,property2:descending' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
}); 
