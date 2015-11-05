var memberController = require('./controller/memberController');
var thirdPartyController = require('./controller/thirdPartyController');
var tagPartyController = require('./controller/tagController');
var bookController = require('./controller/bookController');
var deviceController = require('./controller/deviceController');
var friendController = require('./controller/friendController');
module.exports = [
    {
        method: "get",
        path: "/api/me",
        handler: memberController.getMemberInfo,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/me",
        handler: memberController.update,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/register",
        handler: memberController.register
    },
    {
        method: "post",
        path: "/api/login",
        handler: memberController.login
    },
    {
        method: "post",
        path: "/api/logout",
        handler: memberController.login
    },
    {
        method: "get",
        path: "/api/sms/:mobile",
        handler: thirdPartyController.sendSMS
    },
    {
        method: "post",
        path: "/api/tags",
        handler: tagPartyController.addTag,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/tags",
        handler: tagPartyController.getTags,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/books/isbn/:isbn",
        handler: bookController.addBook,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/books/:bookId",
        handler: bookController.getBook,
        secured: 'user'
    },
    {
        method: "del",
        path: "/api/books/:bookId",
        handler: bookController.removeBook,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/private/books/:bookId",
        handler: bookController.putIntoPrivate,
        secured: 'user'
    },

    {
        method: "post",
        path: "/api/will/books/:bookId",
        handler: bookController.putIntoWill,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/books/:bookId/borrow",
        handler: bookController.borrow,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/books/:bookId/lend",
        handler: bookController.lend,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/lending/books/:bookId",
        handler: bookController.getBookWithinLending,
        secured: 'user'
    },

    {
        method: "get",
        path: "/api/lent/books/:bookId",
        handler: bookController.getBookWithinLent,
        secured: 'user'
    },

    {
        method: "get",
        path: "/api/books/borrowed/:bookId/lenders/:lenderId",
        handler: bookController.getBookWithinBorrowed,
        secured: 'user'
    },

    {
        method: "post",
        path: "/api/books/:bookId/lenders/:lenderId/returnBook",
        handler: bookController.returnBook,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/books/:bookId/borrowers/:borrower/confirmReturn",
        handler: bookController.confirmReturnBook,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/books/borrowing/:bookId/lenders/:lenderId",
        handler: bookController.getBookWithinBorrowing,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/friends/:friendId/books",
        handler: bookController.getUidBooks,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/friends/:friendId/books/:bookId",
        handler: bookController.getBookOfFriend,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/friends/:friendId",
        handler: friendController.getFriend,
        secured: 'user'
    },

    {
        method: "post",
        path: "/api/books/:bookId/borrowed",
        handler: bookController.borrowed,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/books/:bookId/tags",
        handler: tagPartyController.addTagForBook,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/books/:bookId/tags",
        handler: tagPartyController.getTagsForBook,
        secured: 'user'
    },

    {
        method: "post",
        path: "/api/books/:bookId/favorite",
        handler: bookController.favorite,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/books/:bookId/unFavorite",
        handler: bookController.unFavorite,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/friends/books",
        handler: bookController.getBooksOfFriends,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/books/queue/:queueName",
        handler: bookController.getBookByQueueName,
        secured: 'user'
    },

    {
        method: "get",
        path: "/api/favorites",
        handler: bookController.getFavorites,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/devices",
        handler: deviceController.addDevice,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/notifications",
        handler: deviceController.pushNotification,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/friends",
        handler: friendController.getFriends,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/friends",
        handler: friendController.addFriend,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/summary",
        handler: bookController.getQueueSummary,
        secured: 'user'
    }
];