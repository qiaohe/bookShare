module.exports = {
    user: {
        insert: 'insert member set ?',
        findAll: 'select * from member',
        findByName: 'select * from member where mobile=?',
        findById: 'select * from member where id =?',
        findByIds: 'select id, mobile, nickName, headPic from member where id in (?) order by field(id,?)',
        update: 'update member set ? where id = ?',
        search: 'select id, mobile, nickName, headPic from member where mobile like ? or nickName like ?'
    },
    book: {
        insert: 'insert book set ?',
        findByIsbn: 'select * from book where isbn10=? or isbn13=?',
        findById: 'select * from book where id = ?',
        findByIds: 'select id, title, image, image_large, image_medium, image_small from book where id in(?) order by field(id, ?)',
        search: 'select * from book where title like ?'
    },
    device: {
        insert: 'insert device set ?',
        findByToken: 'select * from device where token = ?',
        update: 'update device set ? where id =?'
    },
    notification: {
        insert: 'insert notification set ?'
    }
}
