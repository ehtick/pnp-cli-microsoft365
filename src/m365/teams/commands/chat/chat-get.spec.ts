import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { accessToken } from '../../../../utils/accessToken.js';
import { formatting } from '../../../../utils/formatting.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './chat-get.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.CHAT_GET, () => {
  //#region Mocked Responses  
  const findGroupChatsByMembersResponse: any = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats(id,topic,createdDateTime,members,members())", "@odata.nextLink": "https://graph.microsoft.com/v1.0/chats?$filter=chatType eq 'group'&$expand=members&$select=id,topic,createdDateTime,members&$skiptoken=eyJDb250aW51YXRpb25Ub2tlbiI6Ilczc2ljM1JoY25RaU9pSXlNREl5TFRBeExUSXdWREE1T2pRME9qVXhMakl5Tnlzd01Eb3dNQ0lzSW1WdVpDSTZJakl3TWpJdE1ERXRNakJVTURrNk5EUTZOVEV1TWpJM0t6QXdPakF3SWl3aWMyOXlkRTl5WkdWeUlqb3dmU3g3SW5OMFlYSjBJam9pTVRrM01DMHdNUzB3TVZRd01Eb3dNRG93TUNzd01Eb3dNQ0lzSW1WdVpDSTZJakU1TnpBdE1ERXRNREZVTURBNk1EQTZNREF1TURBeEt6QXdPakF3SWl3aWMyOXlkRTl5WkdWeUlqb3dmVjA9IiwiQ2hhdFR5cGUiOiJjaGF0fG1lZXRpbmd8c2ZiaW50ZXJvcGNoYXR8cGhvbmVjaGF0In0%3d", "value": [{ "id": "19:35bd5bc75e604da8a64e6cba7cfcf175@thread.v2", "topic": "Megan Bowen_Alex Wilber_Sundar Ganesan_ArchivedChat", "createdDateTime": "2021-12-22T13:13:11.023Z", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3A35bd5bc75e604da8a64e6cba7cfcf175%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTozNWJkNWJjNzVlNjA0ZGE4YTY0ZTZjYmE3Y2ZjZjE3NUB0aHJlYWQudjIjI2ExZDY1Nzk0LWMyYmUtNGEzMy04MTExLWVlY2Y2OGZlOWYzNQ==", "roles": ["Owner"], "displayName": "Alex Wilber", "visibleHistoryStartDateTime": "2021-12-22T13:13:11.023Z", "userId": "a1d65794-c2be-4a33-8111-eecf68fe9f35", "email": "AlexW@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTozNWJkNWJjNzVlNjA0ZGE4YTY0ZTZjYmE3Y2ZjZjE3NUB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "2021-12-22T13:13:11.023Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTozNWJkNWJjNzVlNjA0ZGE4YTY0ZTZjYmE3Y2ZjZjE3NUB0aHJlYWQudjIjIzcwZTM3MDExLWY2ZjItNDAwMi04MDU2LWQ2MDg1YjQ5N2E2ZA==", "roles": ["Owner"], "displayName": "Nate Grecian", "visibleHistoryStartDateTime": "2021-12-22T13:13:11.023Z", "userId": "70e37011-f6f2-4002-8056-d6085b497a6d", "email": "NateG@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }, { "id": "19:82fe7758-5bb3-4f0d-a43f-e555fd399c6f_8c0a1a67-50ce-4114-bb6c-da9c5dbcf6ca@unq.gbl.spaces", "topic": null, "createdDateTime": "2021-12-09T08:22:07.845Z", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3Ac03b5a8f9a2e42788561a89d055e6de5%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTpjMDNiNWE4ZjlhMmU0Mjc4ODU2MWE4OWQwNTVlNmRlNUB0aHJlYWQudjIjI2FkN2MxYTU5LWM0N2ItNDdmYi1hNDgxLTM1NWI0ZmM5YzEzNA==", "roles": ["Owner"], "displayName": "Andrew Konnelli", "visibleHistoryStartDateTime": "2021-12-09T08:22:07.845Z", "userId": "ad7c1a59-c47b-47fb-a481-355b4fc9c134", "email": "AndrewK@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTpjMDNiNWE4ZjlhMmU0Mjc4ODU2MWE4OWQwNTVlNmRlNUB0aHJlYWQudjIjIzI4YzRlMTdkLWI1NzktNGUxZS1iMDNjLWEyOTZkMTJjYmZiOQ==", "roles": ["Owner"], "displayName": "Dave Kapowski", "visibleHistoryStartDateTime": "2021-12-09T08:22:07.845Z", "userId": "28c4e17d-b579-4e1e-b03c-a296d12cbfb9", "email": "DaveK@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTpjMDNiNWE4ZjlhMmU0Mjc4ODU2MWE4OWQwNTVlNmRlNUB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "2021-12-09T08:22:07.845Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }, { "id": "19:82fe7758-5bb3-4f0d-a43f-e555fd399c6f_8c0a1a67-50ce-4114-bb6c-da9c5dbcf6ca@unq.gbl.spaces", "topic": null, "createdDateTime": "2021-12-09T07:17:25.322Z", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3A8a2a5e0f94f74346908e6a7b0023da50%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo4YTJhNWUwZjk0Zjc0MzQ2OTA4ZTZhN2IwMDIzZGE1MEB0aHJlYWQudjIjI2FkN2MxYTU5LWM0N2ItNDdmYi1hNDgxLTM1NWI0ZmM5YzEzNA==", "roles": ["Owner"], "displayName": "Alex Wilber", "visibleHistoryStartDateTime": "2021-12-09T07:17:25.322Z", "userId": "ad7c1a59-c47b-47fb-a481-355b4fc9c134", "email": "AlexW@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo4YTJhNWUwZjk0Zjc0MzQ2OTA4ZTZhN2IwMDIzZGE1MEB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "2021-12-09T07:17:25.322Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }] };

  const findGroupChatsByMembersResponseWithNextLink: any = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats(id,topic,createdDateTime,members,members())", "value": [{ "id": "19:5fb8d18dd38b40a4ae0209888adf5c38@thread.v2", "topic": "CC Call v3", "createdDateTime": "2021-10-18T16:56:30.205Z", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3A5fb8d18dd38b40a4ae0209888adf5c38%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo1ZmI4ZDE4ZGQzOGI0MGE0YWUwMjA5ODg4YWRmNWMzOEB0aHJlYWQudjIjI2M2MWYxYjc5LTA4MmItNDRhYy05YzFiLTZhZTFhZjc5NTMzNg==", "roles": ["Owner"], "displayName": "Alex Wilber", "visibleHistoryStartDateTime": "2021-10-18T16:56:30.205Z", "userId": "c61f1b79-082b-44ac-9c1b-6ae1af795336", "email": "AlexW@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo1ZmI4ZDE4ZGQzOGI0MGE0YWUwMjA5ODg4YWRmNWMzOEB0aHJlYWQudjIjI2Y2ZjVlNzA2LWY5NjYtNDlkYi1iNWEwLTEyMGFiZGE3MTc2Nw==", "roles": ["Owner"], "displayName": "Nate Grecian", "visibleHistoryStartDateTime": "2021-10-18T16:56:30.205Z", "userId": "f6f5e706-f966-49db-b5a0-120abda71767", "email": "NateG@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo1ZmI4ZDE4ZGQzOGI0MGE0YWUwMjA5ODg4YWRmNWMzOEB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "2021-10-18T16:56:30.205Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }, { "id": "19:d08368bb4b5c4a70a4606b8914108327@thread.v2", "topic": null, "createdDateTime": "2020-06-26T14:20:19.997Z", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3Ad08368bb4b5c4a70a4606b8914108327%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo1ZmI4ZDE4ZGQzOGI0MGE0YWUwMjA5ODg4YWRmNWMzOEB0aHJlYWQudjIjI2M2MWYxYjc5LTA4MmItNDRhYy05YzFiLTZhZTFhZjc5NTMzNg==", "roles": ["Owner"], "displayName": null, "visibleHistoryStartDateTime": "2021-10-18T16:56:30.205Z", "userId": "d3d5g634-082b-44ac-9c1b-6ae1af795336", "email": null, "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo1ZmI4ZDE4ZGQzOGI0MGE0YWUwMjA5ODg4YWRmNWMzOEB0aHJlYWQudjIjI2Y2ZjVlNzA2LWY5NjYtNDlkYi1iNWEwLTEyMGFiZGE3MTc2Nw==", "roles": ["Owner"], "displayName": "Nate Grecian", "visibleHistoryStartDateTime": "2021-10-18T16:56:30.205Z", "userId": "f6f5e706-f966-49db-b5a0-120abda71767", "email": "NateG@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo1ZmI4ZDE4ZGQzOGI0MGE0YWUwMjA5ODg4YWRmNWMzOEB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "2021-10-18T16:56:30.205Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }] };

  const singleChatByNameResponse: any = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats(id,topic,createdDateTime,chatType,members())", "value": [{ "id": "19:28aca38f8f684a71babac6ab063b4041@thread.v2", "topic": "Just a conversation", "createdDateTime": "2021-04-30T07:36:14.152Z", "chatType": "group", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3A98a7bf5fe7884694b8078541c5eb6e56%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo5OGE3YmY1ZmU3ODg0Njk0YjgwNzg1NDFjNWViNmU1NkB0aHJlYWQudjIjIzY4Nzg2ZjQ5LTMzN2ItNGFmNy05Y2E5LTQ1Y2NmNDM2MTE5Yw==", "roles": ["Owner"], "displayName": "Dave Kapowski", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "68786f49-337b-4af7-9ca9-45ccf436119c", "email": "DaveK@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo5OGE3YmY1ZmU3ODg0Njk0YjgwNzg1NDFjNWViNmU1NkB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo5OGE3YmY1ZmU3ODg0Njk0YjgwNzg1NDFjNWViNmU1NkB0aHJlYWQudjIjI2EwNjA0NjIzLTdjMjgtNDk2Zi05ZDNjLWU4N2RmNjE4YjMxMA==", "roles": ["Owner"], "displayName": "Andrew Konelli", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "a0604623-7c28-496f-9d3c-e87df618b310", "email": "AndrewK@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }] };

  const multipleChatByNameResponse: any = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats(id,topic,createdDateTime,chatType,members())", "value": [{ "id": "19:28aca38f8f684a71babac6ab063b4041@thread.v2", "topic": "Just a conversation with same name", "createdDateTime": "2021-09-14T07:44:11.5Z", "chatType": "group", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3A309128478c1743b19bebd08efc390efb%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTozMDkxMjg0NzhjMTc0M2IxOWJlYmQwOGVmYzM5MGVmYkB0aHJlYWQudjIjI2ExZDY1Nzk0LWMyYmUtNGEzMy04MTExLWVlY2Y2OGZlOWYzNQ==", "roles": ["Owner"], "displayName": "Alex Wilber", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "a1d65794-c2be-4a33-8111-eecf68fe9f35", "email": "AlexW@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTozMDkxMjg0NzhjMTc0M2IxOWJlYmQwOGVmYzM5MGVmYkB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTozMDkxMjg0NzhjMTc0M2IxOWJlYmQwOGVmYzM5MGVmYkB0aHJlYWQudjIjIzg4MGRlNWIyLTk5MjQtNGViMS1iZjdhLWVlZDhkNzFiNjExNg==", "roles": ["Guest"], "displayName": "Nate Grecian", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "880de5b2-9924-4eb1-bf7a-eed8d71b6116", "email": "NateG@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }, { "id": "19:650081f4700a4414ac15cd7993129f80@thread.v2", "topic": "Just a conversation with same name", "createdDateTime": "2020-06-26T08:27:55.154Z", "chatType": "group", "members@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats('19%3A650081f4700a4414ac15cd7993129f80%40thread.v2')/members", "members": [{ "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo2NTAwODFmNDcwMGE0NDE0YWMxNWNkNzk5MzEyOWY4MEB0aHJlYWQudjIjIzQ4ZDMxODg3LTVmYWQtNGQ3My1hOWY1LTNjMzU2ZTY4YTAzOA==", "roles": ["Owner"], "displayName": "Megan Bowen", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "48d31887-5fad-4d73-a9f5-3c356e68a038", "email": "MeganB@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo2NTAwODFmNDcwMGE0NDE0YWMxNWNkNzk5MzEyOWY4MEB0aHJlYWQudjIjIzU4YmE0NzI3LTVjOWYtNDllOS04NDM4LTFiMzI4NTM1Mzc5MQ==", "roles": ["Owner"], "displayName": "Alex Wilber", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "58ba4727-5c9f-49e9-8438-1b3285353791", "email": "AlexW@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }, { "@odata.type": "#microsoft.graph.aadUserConversationMember", "id": "MCMjMCMjZGNkMjE5ZGQtYmM2OC00YjliLWJmMGItNGEzM2E3OTZiZTM1IyMxOTo2NTAwODFmNDcwMGE0NDE0YWMxNWNkNzk5MzEyOWY4MEB0aHJlYWQudjIjIzE5ODA2ZjhjLTAxNTMtNDQxNC05MzA1LWRjNDgwMTJiNDc4OQ==", "roles": ["Owner"], "displayName": "Nate Grecian", "visibleHistoryStartDateTime": "0001-01-01T00:00:00Z", "userId": "19806f8c-0153-4414-9305-dc48012b4789", "email": "NateG@M365x214355.onmicrosoft.com", "tenantId": "dcd219dd-bc68-4b9b-bf0b-4a33a796be35" }] }] };

  const singleChatResponse: any = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats/$entity", "id": "19:82fe7758-5bb3-4f0d-a43f-e555fd399c6f_8c0a1a67-50ce-4114-bb6c-da9c5dbcf6ca@unq.gbl.spaces", "topic": null, "createdDateTime": "2022-01-31T16:03:21.762Z", "lastUpdatedDateTime": "2022-01-31T16:03:21.762Z", "chatType": "oneOnOne", "webUrl": "https://teams.microsoft.com/l/chat/19%3A82fe7758-5bb3-4f0d-a43f-e555fd399c6f_8c0a1a67-50ce-4114-bb6c-da9c5dbcf6ca%40unq.gbl.spaces/0?tenantId=a501f294-03c4-4acd-bbb1-8b9c4e1a218d", "tenantId": "a501f294-03c4-4acd-bbb1-8b9c4e1a218d", "onlineMeetingInfo": null };

  const singleGroupChatResponse: any = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats/$entity", "id": "19:28aca38f8f684a71babac6ab063b4041@thread.v2", "topic": "Just a conversation", "createdDateTime": "2022-01-22T12:51:53.017Z", "lastUpdatedDateTime": "2022-01-22T12:52:08.381Z", "chatType": "group", "webUrl": "https://teams.microsoft.com/l/chat/19%3A28aca38f8f684a71babac6ab063b4041%40thread.v2/0?tenantId=27739880-7742-4a18-aa98-6de28d7dbf85", "tenantId": "27739880-7742-4a18-aa98-6de28d7dbf85", "onlineMeetingInfo": null };

  const noChatByNameResponse: any = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#chats(id,topic,createdDateTime,chatType,members())", "value": [] };
  //#endregion

  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(accessToken, 'getUserNameFromAccessToken').returns('MeganB@M365x214355.onmicrosoft.com');
    auth.connection.active = true;
    if (!auth.connection.accessTokens[auth.defaultResource]) {
      auth.connection.accessTokens[auth.defaultResource] = {
        expiresOn: '123',
        accessToken: 'abc'
      };
    }
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/chats?$filter=chatType eq 'group'&$expand=members&$select=id,topic,createdDateTime,members`
        || opts.url === `https://graph.microsoft.com/v1.0/chats?$filter=chatType eq 'oneOnOne'&$expand=members&$select=id,topic,createdDateTime,members`) {
        return findGroupChatsByMembersResponse;
      }
      else if (opts.url === `https://graph.microsoft.com/v1.0/chats?$filter=chatType eq 'group'&$expand=members&$select=id,topic,createdDateTime,members&$skiptoken=eyJDb250aW51YXRpb25Ub2tlbiI6Ilczc2ljM1JoY25RaU9pSXlNREl5TFRBeExUSXdWREE1T2pRME9qVXhMakl5Tnlzd01Eb3dNQ0lzSW1WdVpDSTZJakl3TWpJdE1ERXRNakJVTURrNk5EUTZOVEV1TWpJM0t6QXdPakF3SWl3aWMyOXlkRTl5WkdWeUlqb3dmU3g3SW5OMFlYSjBJam9pTVRrM01DMHdNUzB3TVZRd01Eb3dNRG93TUNzd01Eb3dNQ0lzSW1WdVpDSTZJakU1TnpBdE1ERXRNREZVTURBNk1EQTZNREF1TURBeEt6QXdPakF3SWl3aWMyOXlkRTl5WkdWeUlqb3dmVjA9IiwiQ2hhdFR5cGUiOiJjaGF0fG1lZXRpbmd8c2ZiaW50ZXJvcGNoYXR8cGhvbmVjaGF0In0%3d`
        || opts.url === `https://graph.microsoft.com/v1.0/chats?$filter=chatType eq 'oneOnOne'&$expand=members&$select=id,topic,createdDateTime,members&$skiptoken=eyJDb250aW51YXRpb25Ub2tlbiI6Ilczc2ljM1JoY25RaU9pSXlNREl5TFRBeExUSXdWREE1T2pRME9qVXhMakl5Tnlzd01Eb3dNQ0lzSW1WdVpDSTZJakl3TWpJdE1ERXRNakJVTURrNk5EUTZOVEV1TWpJM0t6QXdPakF3SWl3aWMyOXlkRTl5WkdWeUlqb3dmU3g3SW5OMFlYSjBJam9pTVRrM01DMHdNUzB3TVZRd01Eb3dNRG93TUNzd01Eb3dNQ0lzSW1WdVpDSTZJakU1TnpBdE1ERXRNREZVTURBNk1EQTZNREF1TURBeEt6QXdPakF3SWl3aWMyOXlkRTl5WkdWeUlqb3dmVjA9IiwiQ2hhdFR5cGUiOiJjaGF0fG1lZXRpbmd8c2ZiaW50ZXJvcGNoYXR8cGhvbmVjaGF0In0%3d`) {
        return findGroupChatsByMembersResponseWithNextLink;
      }
      else if (opts.url === `https://graph.microsoft.com/v1.0/chats/${formatting.encodeQueryParameter('19:82fe7758-5bb3-4f0d-a43f-e555fd399c6f_8c0a1a67-50ce-4114-bb6c-da9c5dbcf6ca@unq.gbl.spaces')}`) {
        return singleChatResponse;
      }
      else if (opts.url === `https://graph.microsoft.com/v1.0/chats/${formatting.encodeQueryParameter('19:28aca38f8f684a71babac6ab063b4041@thread.v2')}`) {
        return singleGroupChatResponse;
      }
      else if (opts.url === `https://graph.microsoft.com/v1.0/chats?$filter=topic eq '${formatting.encodeQueryParameter('Just a conversation')}'&$expand=members&$select=id,topic,createdDateTime,chatType`) {
        return singleChatByNameResponse;
      }
      else if (opts.url === `https://graph.microsoft.com/v1.0/chats?$filter=topic eq '${formatting.encodeQueryParameter('Just a conversation with same name')}'&$expand=members&$select=id,topic,createdDateTime,chatType`) {
        return multipleChatByNameResponse;
      }
      else if (opts.url === `https://graph.microsoft.com/v1.0/chats?$filter=topic eq '${formatting.encodeQueryParameter('Nonexistent conversation name')}'&$expand=members&$select=id,topic,createdDateTime,chatType`) {
        return noChatByNameResponse;
      }

      throw 'Invalid Request';
    });
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
      cli.getSettingWithDefaultValue,
      cli.handleMultipleResultsFound
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.accessTokens = {};
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CHAT_GET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if id and name and participants are not specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the id is not valid', async () => {
    const actual = await command.validate({
      options: {
        id: "8b081ef6"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation for an incorrect id missing leading 19:.', async () => {
    const actual = await command.validate({
      options: {
        id: '8b081ef6-4792-4def-b2c9-c363a1bf41d5_5031bb31-22c0-4f6f-9f73-91d34ab2b32d@unq.gbl.spaces'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation for an incorrect id missing trailing @thread.v2 or @unq.gbl.spaces', async () => {
    const actual = await command.validate({
      options: {
        id: '19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_5031bb31-22c0-4f6f-9f73-91d34ab2b32d'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation for an invalid email address (single)', async () => {
    const actual = await command.validate({
      options: {
        participants: 'alexwcontoso.com'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation for invalid email addresses (multiple)', async () => {
    const actual = await command.validate({
      options: {
        participants: 'alexw@contoso.com,natecontoso.com'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if id and name properties are both defined', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        id: '19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_5031bb31-22c0-4f6f-9f73-91d34ab2b32d',
        name: 'test'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if id and participants properties are both defined', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        id: '19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_5031bb31-22c0-4f6f-9f73-91d34ab2b32d',
        participants: 'alexw@contoso.com'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if name and participants properties are both defined', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        name: 'test',
        participants: 'alexw@contoso.com'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if all three mutually exclusive properties are defined', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        id: '19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_5031bb31-22c0-4f6f-9f73-91d34ab2b32d',
        name: 'test',
        participants: 'alexw@contoso.com'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('validates for a correct id input', async () => {
    const actual = await command.validate({
      options: {
        id: "19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_5031bb31-22c0-4f6f-9f73-91d34ab2b32d@unq.gbl.spaces"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('validates for a correct name input', async () => {
    const actual = await command.validate({
      options: {
        name: 'test'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('validates for a correct participants input', async () => {
    const actual = await command.validate({
      options: {
        participants: 'alexw@contoso.com'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('validates for a correct participants (array) input', async () => {
    const actual = await command.validate({
      options: {
        participants: 'alexw@contoso.com,nateg@contoso.com'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('gets chat conversation using id', async () => {
    await command.action(logger, {
      options: {
        id: "19:82fe7758-5bb3-4f0d-a43f-e555fd399c6f_8c0a1a67-50ce-4114-bb6c-da9c5dbcf6ca@unq.gbl.spaces"
      }
    });
    assert(loggerLogSpy.calledWith(singleChatResponse));
  });

  it('gets chat conversation using name', async () => {
    await command.action(logger, {
      options: {
        name: "Just a conversation"
      }
    });
    assert(loggerLogSpy.calledWith(singleGroupChatResponse));
  });

  it('gets chat conversation using participants (single)', async () => {
    await command.action(logger, {
      options: {
        participants: "AlexW@M365x214355.onmicrosoft.com"
      }
    });
    assert(loggerLogSpy.calledWith(singleChatResponse));
  });

  it('gets chat conversation to existing conversation using participants (multiple)', async () => {
    await command.action(logger, {
      options: {
        participants: "AndrewK@M365x214355.onmicrosoft.com,DaveK@M365x214355.onmicrosoft.com"
      }
    });
    assert(loggerLogSpy.calledWith(singleChatResponse));
  });

  it('fails retrieving chat conversation with nonexistent name', async () => {
    await assert.rejects(command.action(logger, {
      options: {
        name: "Nonexistent conversation name"
      }
    } as any), new CommandError(`No chat conversation was found with this name.`));
  });

  it('fails retrieving non-existent chat conversation by participants', async () => {
    await assert.rejects(command.action(logger, {
      options: {
        participants: "NestorB@M365x214355.onmicrosoft.com"
      }
    } as any), new CommandError(`No chat conversation was found with these participants.`));
  });

  it('fails retrieving chat conversation with multiple found chat conversations by name', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: "Just a conversation with same name"
      }
    } as any), new CommandError("Multiple chat conversations with this name found. Found: 19:28aca38f8f684a71babac6ab063b4041@thread.v2, 19:650081f4700a4414ac15cd7993129f80@thread.v2."));
  });

  it('handles selecting single result when multiple chats with the specified name found and cli is set to prompt', async () => {
    sinon.stub(cli, 'handleMultipleResultsFound').resolves(singleGroupChatResponse);

    await command.action(logger, {
      options: {
        name: "Just a conversation with same name"
      }
    });
    assert(loggerLogSpy.calledWith(singleGroupChatResponse));
  });

  it('fails retrieving chat conversation with multiple found chat conversations by participants', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    await assert.rejects(command.action(logger, {
      options: {
        participants: "AlexW@M365x214355.onmicrosoft.com,NateG@M365x214355.onmicrosoft.com"
      }
    } as any), new CommandError("Multiple chat conversations with these participants found. Found: 19:35bd5bc75e604da8a64e6cba7cfcf175@thread.v2, 19:5fb8d18dd38b40a4ae0209888adf5c38@thread.v2."));
  });

  it('handles selecting single result when multiple chats conversations by participants found and cli is set to prompt', async () => {
    sinon.stub(cli, 'handleMultipleResultsFound').resolves(singleGroupChatResponse);

    await command.action(logger, {
      options: {
        participants: "AlexW@M365x214355.onmicrosoft.com,NateG@M365x214355.onmicrosoft.com"
      }
    });
    assert(loggerLogSpy.calledWith(singleGroupChatResponse));
  });
});
