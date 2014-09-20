// notesForAppEngine.js

/**

The MIT License (MIT)

Copyright (c) 2014 James Mortensen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/


var addFontAwesome = function() {
    var fontAwesomeCSS = '//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css';
    var fontAwesomeStyle = document.createElement('link');
    fontAwesomeStyle.setAttribute('rel', 'stylesheet');
    fontAwesomeStyle.setAttribute('href', fontAwesomeCSS);
    document.head.appendChild(fontAwesomeStyle);
};


/**
 * Get the key for the row using targetElement as a reference point.
 * 
 * @param {DOMElement} targetElement Any direct child of the table row containing the key.
 * @return {String} The unique key representing that row.
 */
var getKeyFromRow = function(targetElement) {
    return $(targetElement).parent().parent().find('td.cbc input').val();
};


/**
 * On click of a list item and on every keystroke, update the stored note.
 *
 * @param {jQueryElement} explorerEntitiesElement A jQuery object representing the table.
 */
var bindEventsToNotesBox = function(explorerEntitiesElement) {
    var keyFilterer = new KeyFilterer();

    explorerEntitiesElement.on('click keyup', '.notes-for-appengine-note input', function(event) {
        if (event.type === 'keyup') {
            var isValidKey = keyFilterer.isValidKey(event.keyCode);
            var key = getKeyFromRow(event.currentTarget);
            var value = $(event.currentTarget).val();
            if (isValidKey) {
                saveNotes(key, value);
            }
        }
    });
};


/**
 * Add click handler for note button.
 */
var bindClickEventForNotesButton = function() {
    $('tr').on('click', 'span.notes-for-appengine-edit-note', function(event) {
        var key = getKeyFromRow(event.currentTarget);
        $(this).parent().parent().find('.notes-for-appengine-note input').focus();
    });
};


/**
 * Save the note in storage, using the datastore key as a key for the note.
 *
 * @param {String} key The datastore row key.
 * @param {String} noteText The note to store.
 */
var saveNotes = function(key, noteText) {
    var noteToStore = {};
    noteToStore[key] = noteText;
    chrome.storage.local.set(noteToStore, function() {});
};


/**
 * Get notes from storage that match an array of keys.
 *
 * @param {Array} keysToFetch An array of strings representing keys.
 * @return {Promise} The object containing the done, fail, progress methods.
 */
var getNotesFromStorage = function(keysToFetch) {
    var deferred = $.Deferred();
    chrome.storage.local.get(keysToFetch, function(notes) {
        deferred.resolve(notes);
    });
    return deferred.promise();
};


/**
 * Scrape the DOM for all of the Datastore keys that are visible on the page. This
 * helps us limit the amount of data we fetch from storage to only what we actually
 * need.
 *
 * @return {Array} The array of string keys found on the page.
 */
var getKeysFromPage = function() {
    var inputKeyElements = $('.cbc input[name="key"]');
    var keys = [];
    for (var i = 0; i < inputKeyElements.length; i++) {
        keys.push(inputKeyElements.eq(i).val());
    }
    return keys;
};


/**
 * Insert the note text in the note fields in the DOM by mapping the notes to the 
 * corresponding row in the DOM table.
 *
 * @param {Object} notes The object containing key/value pairs.
 */
var insertNotesInPage = function(notes) {
    if (notes === undefined) return;
    var keys = Object.keys(notes);
    keys.forEach(function(key) {
        var value = notes[key];
        $('.cbc input[value="' + key + '"]').parent().parent().find('.notes-for-appengine-note input').val(value);
    });
};


/**
 * Insert the column fields themselves into the DOM.
 *
 * @param {jQueryElement} explorerEntitiesElement jQuery DOM object representing the table.
 */
var insertNotesColumns = function(explorerEntitiesElement) {
    var tableHeaderElement = explorerEntitiesElement.find('thead tr .cbc');

    var editNoteElement = '<span class="fa fa-edit notes-for-appengine-edit-note"></span>';
    var noteHeaderElement = '<th class="notes-for-appengine-note">Note</th>';
    var noteElement = '<td class="notes-for-appengine-note"><input type="text"></input></td>';

    tableHeaderElement.before(
    '<th class="notes-for-appengine-edit-note-cell">' + editNoteElement + '</th>' + noteHeaderElement
    );

    var bodyHeaderElement = explorerEntitiesElement.find('tbody tr .cbc');
    bodyHeaderElement.before(
    '<td class="notes-for-appengine-edit-note-cell">' + editNoteElement + '</td>' + noteElement
    );
};


/**
 * We use Font Awesome for all icons, and load the CSS prior to the pageload event to speed up rendering.
 */
addFontAwesome();


/**
 * Entry point to the content script. This loads all data on the page and binds all click and keydown
 * events in the DOM, as well as retrieving the notes from storage and inserting them in the page.
 */
//window.addEventListener('load', function() {
    var explorerEntitiesElement = $('#ae-datastore-explorer-entities');
    insertNotesColumns(explorerEntitiesElement);
    bindEventsToNotesBox(explorerEntitiesElement);
    bindClickEventForNotesButton();
    var keys = getKeysFromPage();
    var notesResults = getNotesFromStorage(keys);
    notesResults.done(function(notes) {
        insertNotesInPage(notes);
    });
//});

