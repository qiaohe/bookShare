"use strict";
var _ = require('lodash');
const IMAGE_PATTERNS = ['large', 'medium', 'small'];
const REMOVE_PROPERTIES = ['rating', 'tags', 'images', 'alt', 'id', 'alt_title', 'url', 'series'];
class Book {
    constructor(body, uid) {
        this.body = body;
        this.uid = uid;
    }

    generate() {
        var result = JSON.parse(this.body[1]);
        IMAGE_PATTERNS.forEach(function (p) {
            result['image_' + p] = result.images[p];
        });
        result = _.omit(result, REMOVE_PROPERTIES);
        var author = result.author.join(',');
        var translator = result.translator.join(',');
        return _.assign(result, {
            uid: this.uid, createDate: new Date(), author: author, translator: translator
        });
    }
}
module.exports.Book = Book;