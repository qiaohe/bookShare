"use strict";
var config = require('../../config');
var _ = require('lodash');
var bookDAO = require('../dao/bookDAO');
var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var Book = require('../domain/book').Book;
var redis = require('../../middleware/redisClient');
var memberDAO = require('../dao/memberDAO');
var i18n = require('../../i18n/localeMessage');
var moment = require('moment');
module.exports = {
    addBook: function (req, res, next) {
        var uid = req.user.id;
        var isbn = req.params.isbn.replace(/-/g, '');
        var book = {};
        bookDAO.findByIsbn(isbn).then(function (books) {
            return books.length ? books[0] : request(config.app.crawlerUrl.replace(':ISBN', isbn)).then(function (body) {
                book = new Book(body, uid).generate();
                return bookDAO.insert(book);
            }).then(function (result) {
                book.id = result.insertId;
                return book;
            })
        }).then(function (book) {
            var d = book.createDate.getTime();
            redis.zadd(`uid:${uid}:owned.books`, d, book.id);
            redis.zadd(`book:${book.id}:owners`, d, uid);
            redis.zadd(`uid:${uid}:will.books`, d, book.id);
            redis.zadd(`uid:${uid}:will.books.unread`, d, book.id);
            redis.zadd(`uid:${uid}:public.books`, d, book.id);
            redis.set(`uid:${uid}:book:${book.id}:holder`, uid);
            return res.send({ret: 0, data: book});
        });
        return next();
    },
    getBooksOfFriends: function (req, res, next) {
        var uid = req.user.id;
        redis.zrangeAsync([`uid:${uid}:friends`, 0, -1]).then(function (friendIdList) {
            if (!friendIdList.length) return res.send({ret: 0, data: []});
            var options = [`uid:${uid}:friends.books`, friendIdList.length];
            friendIdList.forEach(function (friendId) {
                options.push(`uid:${friendId}:public.books`);
            });
            return redis.zunionstoreAsync(options);
        }).then(function () {
            var from = +req.query.from;
            var to = +req.query.from + (+req.query.size) - 1;
            return redis.zrangeAsync([`uid:${uid}:friends.books`, from, to]);
        }).then(function (bookIdList) {
            return bookDAO.findByIds(bookIdList.join(','));
        }).then(function (books) {
            Promise.map(books, function (book) {
                return redis.zrangeAsync([`book:${book.id}:owners`, 0, -1]).then(function (ownerIdList) {
                    return memberDAO.findByIds(ownerIdList.join(','));
                }).then(function (owners) {
                    book.owners = owners;
                })
            }).then(function () {
                return res.send({ret: 0, data: books});
            });
        });
        return next();
    },

    getBook: function (req, res, next) {
        var bookId = req.params.bookId;
        var uid = req.user.id;
        bookDAO.findById(bookId).then(function (books) {
            return redis.zrangeAsync([`book:${books[0].id}:owners`, 0, -1]).then(function (ownerIdList) {
                return memberDAO.findByIds(ownerIdList.join(','));
            }).then(function (owners) {
                books[0].owners = owners;
                return res.send({ret: 0, data: books[0]});
            });
        });
        return next();
    },

    favorite: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        redis.zaddAsync([`uid:${uid}:favorite.books`, new Date().getTime(), bookId]).then(function () {
            return res.send({ret: 0, data: {bookId: bookId, favorite: true}})
        });
        return next();
    },

    unFavorite: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        redis.zremAsync([`uid:${uid}:favorite.books`, bookId]).then(function () {
            return res.send({ret: 0, data: {bookId: bookId, favorite: false}})
        });
        return next();
    },

    getFavorites: function (req, res, next) {
        var uid = req.user.id;
        var from = +req.query.from;
        var to = +req.query.from + (+req.query.size) - 1;
        redis.zrangeAsync([`uid:${uid}:favorite.books`, from, to]).then(function (bookIdList) {
            if (!bookIdList.length) return res.send({ret: 0, data: []});
            return bookDAO.findByIds(bookIdList.join(','));
        }).then(function (books) {
            res.send({ret: 0, data: books});
        });
        return next();
    },

    borrow: function (req, res, next) {
        var bookId = req.params.bookId;
        var uid = req.user.id;
        var lender = req.body.lender;
        var d = new Date().getTime();
        redis.zadd([`uid:${uid}:borrowing.books`, d, lender + ':' + bookId]);
        redis.zadd([`uid:${uid}:borrowing.books.unread`, d, lender + ':' + bookId]);
        redis.zadd([`uid:${lender}:lending.books`, d, bookId]);
        redis.zadd([`uid:${lender}:lending.books.unread`, d, bookId]);
        redis.zadd([`book:${bookId}:borrowing.users`, d, uid]);
        redis.zadd([`uid:${lender}:book:${bookId}:borrowing.users`, d, uid]);
        res.send({ret: 0, message: i18n.get('borrow.apply.success')});
        return next();
    },

    lend: function (req, res, next) {
        var bookId = req.params.bookId;
        var uid = req.user.id;
        var borrower = req.body.borrower;
        var d = new Date().getTime();
        redis.set(`uid:${uid}:book:${bookId}:holder`, borrower);
        redis.set(`uid:${uid}:book:${bookId}:borrower`, borrower);
        res.send({ret: 0, message: i18n.get('lend.book.success')});
        return next();
    },

    getBookByQueueName: function (req, res, next) {
        var uid = req.user.id;
        var queueName = req.params.queueName;
        var from = +req.query.from;
        var to = +req.query.from + (+req.query.size) - 1;
        redis.zrangeAsync([`uid:${uid}:${queueName}.books`, from, to]).then(function (bookIdList) {
            if (!bookIdList.length) throw new Error();
            if (queueName !== 'borrowing' && queueName !== 'borrowed') return bookDAO.findByIds(bookIdList.join(','));
            return Promise.map(bookIdList, function (item) {
                var ps = item.split(':');
                var book = {};
                return redis.zrank(`uid:${uid}:${queueName}.books.unread`, item).then(function (reply) {
                    book.isNew = (reply != null);
                    return bookDAO.findByIds(ps[1]).then(function (result) {
                        book = result[0];
                        book.lender = ps[0];
                        return redis.getAsync(`uid:${book.lender}:book:${book.id}:confirmReturn`);
                    }).then(function (result) {
                        book.returning = result;
                        return redis.getAsync(`uid:${book.lender}:book:${book.id}:borrower`);
                    }).then(function (borrowerId) {
                        book.borrowState = (borrowerId == uid);
                        return book;
                    });
                });
            });
        }).then(function (books) {
            if (queueName === 'lending') {
                return Promise.map(books, function (book) {
                    return redis.zrank(`uid:${uid}:${queueName}.books.unread`, item).then(function (reply) {
                        book.isNew = (reply != null);
                        return redis.getAsync(`uid:${uid}:book:${book.id}:borrower`).then(function (borrower) {
                            book.borrower = borrower;
                            return book;
                        })
                    });
                }).then(function (books) {
                    return res.send({ret: 0, data: books});
                })
            } else if (queueName === 'lent') {
                return Promise.map(books, function (book) {
                    return redis.zrank(`uid:${uid}:${queueName}.books.unread`, item).then(function (reply) {
                        book.isNew = (reply != null);
                        return redis.getAsync(`uid:${uid}:book:${book.id}:confirmReturn`).then(function (result) {
                            book.returning = result;
                            return book;
                        });
                    });
                }).then(function (books) {
                    return res.send({ret: 0, data: books});
                })
            }
            return res.send({ret: 0, data: books});
        }).catch(function () {
            return res.send({ret: 0, data: []});
        });
        return next();
    },

    borrowed: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        var lender = req.body.lender;
        var d = new Date().getTime();
        redis.zrem(`uid:${uid}:borrowing.books`, lender + ':' + bookId);
        redis.zadd([`uid:${uid}:borrowed.books`, d, lender + ':' + bookId]);
        redis.zadd([`uid:${uid}:borrowed.books.unread`, d, lender + ':' + bookId]);
        redis.zrem(`uid:${lender}:lending.books`, bookId);
        redis.zadd([`uid:${lender}:lent.books`, d, bookId]);
        redis.zadd([`uid:${lender}:lent.books.unread`, d, bookId]);
        redis.set(`uid:${lender}:book:${bookId}:holder`, uid);
        redis.set(`uid:${lender}:book:${bookId}:borrower`, uid);
        redis.set(`uid:${lender}:book:${bookId}:borrower:${uid}:date`, new Date().getTime());
        res.send({ret: 0, message: i18n.get('borrow.book.success')});
        return next();
    },

    getBookWithinLending: function (req, res, next) {
        var bookId = req.params.bookId;
        var uid = req.user.id;
        redis.zrem(`uid:${uid}:lending.books.unread`, bookId);
        bookDAO.findById(bookId).then(function (books) {
            return redis.zrangeAsync([`book:${bookId}:borrowing.users`, 0, -1]).then(function (borrowers) {
                if (!borrowers.length) return res.send({ret: 0, data: books[0]});
                return memberDAO.findByIds(borrowers.join(','));
            }).then(function (borrowers) {
                books[0].borrowers = borrowers;
                return redis.getAsync(`uid:${uid}:book:${bookId}:borrower`);
            }).then(function (borrowerId) {
                if (!borrowerId) return res.send({ret: 0, data: books[0]});
                return memberDAO.findById(borrowerId);
            }).then(function (borrows) {
                books[0].hasBorroweredUser = borrows[0];
                books[0].borrowers.splice(books[0].borrowers.indexOf(borrows[0]), 1);
                return res.send({ret: 0, data: books[0]});
            })
        });
        return next();
    },

    getBookWithinBorrowed: function (req, res, next) {
        var bookId = req.params.bookId;
        var uid = req.user.id;
        var lenderId = req.params.lenderId;
        redis.zrem(`uid:${uid}:borrowed.books.unread`, lenderId + ':' + bookId);
        var book = {};
        bookDAO.findById(bookId).then(function (books) {
            book = books[0];
            return memberDAO.findByIds(lenderId);
        }).then(function (lender) {
            book.lender = lender;
            return redis.getAsync(`uid:${lender}:book:${bookId}:borrower:${uid}:date`)
        }).then(function (date) {
            var days = moment(date).diff(moment(), 'days');
            book.escapeDays = days ? days : 0;
            return res.send({ret: 0, data: book});
        });
    },
    getBookWithinLent: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        redis.zrem(`uid:${uid}:lent.books.unread`, bookId);
        var book = {};
        bookDAO.findById(bookId).then(function (books) {
            book = books[0];
            return redis.getAsync(`uid:${uid}:book:${bookId}:borrower`);
        }).then(function (borrowerId) {
            return memberDAO.findById(borrowerId);
        }).then(function (members) {
            book.borrower = members[0];
            return redis.getAsync(`uid:${uid}:book:${bookId}:borrower:${book.borrower.id}:date`)
        }).then(function (date) {
            var days = moment(date).diff(moment(), 'days');
            book.escapeDays = days ? days : 0;
            return redis.getAsync(`uid:${uid}:book:${bookId}:confirmReturn`);
        }).then(function (result) {
            book.returning = result;
            return res.send({ret: 0, data: book});
        });
        return next();
    },

    getBookWithinBorrowing: function (req, res, next) {
        var bookId = req.params.bookId;
        var lenderId = req.params.lenderId;
        var result = {};
        redis.zrem(`uid:${uid}:borrowing.books.unread`, lenderId + ':' + bookId);
        bookDAO.findById(bookId).then(function (books) {
            result = books[0];
            return memberDAO.findByIds(lenderId);
        }).then(function (lender) {
            result.lender = lender;
            return redis.getAsync(`uid:${lenderId}:book:${bookId}:borrower`);
        }).then(function (borrowerId) {
            result.borrowState = (borrowerId == req.user.id);
            return res.send({ret: 0, data: result});
        });
        return next();
    },

    getUidBooks: function (req, res, next) {
        var friendId = req.params.friendId;
        var from = +req.query.from;
        var to = +req.query.from + (+req.query.size) - 1;
        redis.zrangeAsync([`uid:${friendId}:public.books`, from, to]).then(function (bookIdList) {
            if (!bookIdList.length) return res.send({ret: 0, data: []});
            return bookDAO.findByIds(bookIdList);
        }).then(function (books) {
            res.send({ret: 0, data: books});
        });
        return next();
    },

    getBookOfFriend: function (req, res, next) {
        var bookId = req.params.bookId;
        bookDAO.findById(bookId).then(function (books) {
            var book = books[0];
            return redis.zrangeAsync([`book:${book.id}:owners`, 0, -1]).then(function (ownerIdList) {
                return memberDAO.findByIds(ownerIdList.join(','));
            }).then(function (owners) {
                book.owners = owners;
                return res.send({ret: 0, data: book});
            });
        });
        return next();
    },

    returnBook: function (req, res, next) {
        var uid = req.user.id;
        var lender = req.params.lenderId;
        var bookId = req.params.bookId;
        redis.set(`uid:${lender}:book:${bookId}:confirmReturn`, true);
        return res.send({ret: 0, message: i18n.get('book.return.success')});
    },

    confirmReturnBook: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        var borrower = req.params.borrower;
        redis.zrem(`uid:${uid}:lent.books`, bookId);
        redis.zadd(`uid:${uid}:will.books`, bookId);
        redis.zadd(`uid:${uid}:will.books.unread`, bookId);
        redis.zrem(`uid:${borrower}:borrowed.books`, uid + ':' + bookId);
        return res.send({ret: 0, message: i18n.get('book.confirmReturn.success')});
    },

    getQueueSummary: function (req, res, next) {
        var uid = req.user.id;
        var result = {};
        Promise.map(['lending', 'lent', 'borrowing', 'borrowed', 'private', 'will'], function (queue) {
            return redis.zcardAsync(`uid:${uid}:${queue}.books.unread`).then(function (count) {
                result[queue] = count;
            });
        }).then(function () {
            return redis.zcardAsync(`uid:${uid}:favorite.books`);
        }).then(function (favoriteCount) {
            result.favorite = favoriteCount;
            return res.send({ret: 0, data: result});
        });
        return next();
    },

    removeBook: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        redis.zrem(`uid:${uid}:owned.books`, bookId);
        redis.zrem(`uid:${uid}:will.books`, bookId);
        redis.zrem(`uid:${uid}:will.books.unread`, bookId);
        redis.zrem(`uid:${uid}:private.books`, bookId);
        redis.zrem(`uid:${uid}:private.books.unread`, bookId);
        redis.zrem(`uid:${uid}:lending.books`, bookId);
        redis.zrem(`uid:${uid}:lending.books.unread`, bookId);
        redis.zrem(`uid:${uid}:public.books`, bookId);
        redis.del(`uid:${uid}:book:${bookId}:holder`);
        res.send({ret: 0, message: i18n.get('book.remove.success')})
    },

    putIntoPrivate: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        var d = new Date().getTime();
        redis.zadd(`uid:${uid}:private.books`, d, bookId);
        redis.zrem(`uid:${uid}:public.books`, bookId);
        redis.zrem(`uid:${uid}:will.books`, bookId);
        redis.zrem(`uid:${uid}:will.books.unread`, bookId);
        redis.zrem(`uid:${uid}:lending.books`, bookId);
        redis.zrem(`uid:${uid}:lending.books.unread`, bookId);
        res.send({ret: 0, message: i18n.get('book.put.private.success')})
    },
    putIntoWill: function (req, res, next) {
        var uid = req.user.id;
        var bookId = req.params.bookId;
        var d = new Date().getTime();
        redis.zadd(`uid:${uid}:will.books`, d, bookId);
        redis.zadd(`uid:${uid}:public.books`, d, bookId);
        redis.zadd(`uid:${uid}:will.books.unread`, d, bookId);
        redis.zadd(`book:${bookId}:owners`, d, uid);
        res.send({ret: 0, message: i18n.get('book.put.will.success')})
        return next();
    }
}
