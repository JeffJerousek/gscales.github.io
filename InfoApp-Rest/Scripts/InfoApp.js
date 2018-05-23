﻿// This function is run when the app is ready to start interacting with the host application
// It ensures the DOM is ready before updating the span elements with values from the current message
Office.initialize = function () {
    $(document).ready(function () {
        var item = Office.context.mailbox.userProfile;
        var diag = Office.context.mailbox.diagnostics;
        $('#DisplayName').text("DisplayName : " + item.displayName);
        $('#EmailAddress').text("EmailAddress : " + item.emailAddress);
        $('#TimeZone').text("Timezone : " + item.timeZone);
        $('#displayLanguage').text("Display Language : " + Office.context.displayLanguage);
        $('#HostVersion').text("HostVersion : " + diag.hostVersion);
        $('#UserAgent').text("UserAgent : " + window.navigator.userAgent);
        $('#OWAView').text("OWAView : " + Office.context.mailbox.ewsUrl);
        Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
            if (result.status === "succeeded") {
                var accessToken = result.value;
                getCurrentItem(accessToken);
            } else {
                // Handle the error
            }
        });
    });
};

function getCurrentItem(accessToken) {
    // Get the item's REST ID
    var itemId = getItemRestId();

    // Construct the REST URL to the current item
    // Details for formatting the URL can be found at 
    // https://msdn.microsoft.com/office/office365/APi/mail-rest-operations#get-a-message-rest
    var getMessageUrl = Office.context.mailbox.restUrl +
        '/v2.0/me/messages/' + itemId;

    $.ajax({
        url: getMessageUrl,
        dataType: 'json',
        headers: { 'Authorization': 'Bearer ' + accessToken }
    }).done(function (item) {
        // Message is passed in `item`
        var subject = item.Subject;
        $('#ServerName').text("Message Subject : " + subject);
    }).fail(function (error) {
        // Handle error
    });
}

function getItemRestId() {
    if (Office.context.mailbox.diagnostics.hostName === 'OutlookIOS') {
        // itemId is already REST-formatted
        return Office.context.mailbox.item.itemId;
    } else {
        // Convert to an item ID for API v2.0
        return Office.context.mailbox.convertToRestId(
            Office.context.mailbox.item.itemId,
            Office.MailboxEnums.RestVersion.v2_0
        );
    }
}
function getSoapEnvelope(request) {
    // Wrap an Exchange Web Services request in a SOAP envelope.
    var result =

        '<?xml version="1.0" encoding="utf-8"?>' +
        '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
        '               xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
        '               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
        '               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">' +
        '  <soap:Header>' +
        '    <RequestServerVersion Version="Exchange2013" xmlns="http://schemas.microsoft.com/exchange/services/2006/types" soap:mustUnderstand="0" />' +
        '  </soap:Header>' +
        '  <soap:Body>' +

        request +

        '  </soap:Body>' +
        '</soap:Envelope>';

    return result;
}

function GetFolder() {
    var results =

        '      <GetFolder xmlns="http://schemas.microsoft.com/exchange/services/2006/messages">' +
        '      <FolderShape>' +
        '        <t:BaseShape>AllProperties</t:BaseShape>' +
        '        <t:AdditionalProperties>' +
        '          <t:ExtendedFieldURI PropertyTag="26180" PropertyType="String" />' +
        '        </t:AdditionalProperties>' +
        '      </FolderShape>' +
        '      <FolderIds>' +
        '        <t:DistinguishedFolderId Id="inbox" />' +
        '      </FolderIds>' +
        '    </GetFolder>';

    return results;
}

function GetFolderCnt() {
    var results =
        ' <FindFolder Traversal="Deep" xmlns="http://schemas.microsoft.com/exchange/services/2006/messages">' +
        '<FolderShape>' +
        '<t:BaseShape>Default</t:BaseShape>' +
        '</FolderShape>' +
        '<IndexedPageFolderView MaxEntriesReturned="1" Offset="0" BasePoint="Beginning" />' +
        '<ParentFolderIds>' +
        ' <t:DistinguishedFolderId Id="msgfolderroot"/>' +
        '</ParentFolderIds>' +
        ' </FindFolder>';
    return results;
}
function callbackGetFolder(asyncResult) {
    var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    if (is_chrome) {
        // var xml = $.parseXML(asyncResult.value),
        //  $xml = $(xml);
        //  totalCount = $xml.find('TotalCount');
        //  $('#InboxItemCount').text("Inbox Total Item Count : " + totalCount[0].textContent);
        var parser = new DOMParser();
        var doc = parser.parseFromString(asyncResult.value, "text/xml");
        var values = doc.getElementsByTagName("Value");
        var totalCount = doc.getElementsByTagName("TotalCount");
        var UnreadCount = doc.getElementsByTagName("UnreadCount");
        $('#ServerName').text("Mailbox ServerName : " + values[0].textContent);
        $('#InboxItemCount').text("Inbox Total Item Count : " + totalCount[0].textContent);
        $('#InboxUnread').text("Inbox Unread Item Count : " + UnreadCount[0].textContent);
    }
    else {
        var parser = new DOMParser();
        var doc = parser.parseFromString(asyncResult.value, "text/xml");
        var values = doc.getElementsByTagName("t:Value");
        var totalCount = doc.getElementsByTagName("t:TotalCount");
        var UnreadCount = doc.getElementsByTagName("t:UnreadCount");
        $('#ServerName').text("Mailbox ServerName : " + values[0].textContent);
        $('#InboxItemCount').text("Inbox Total Item Count : " + totalCount[0].textContent);
        $('#InboxUnread').text("Inbox Unread Item Count : " + UnreadCount[0].textContent);
    }


}
function callbackFindFolder(asyncResult) {
    var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    if (is_chrome) {
        var xml = $.parseXML(asyncResult.value),
            $xml = $(xml),
            $RootFolder = $xml.find('RootFolder');
        $('#TotalFolderCount').text("Total Mailbox Folder Count : " + $RootFolder[0].attributes.getNamedItem("TotalItemsInView").textContent);
    }
    else {

        var parser = new DOMParser();
        var doc = parser.parseFromString(asyncResult.value, "text/xml");
        var values = doc.childNodes[0].getElementsByTagName("m:RootFolder");
        $('#TotalFolderCount').text("Total Mailbox Folder Count : " + values[0].attributes.getNamedItem("TotalItemsInView").textContent);
    }
}

