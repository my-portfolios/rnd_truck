const express = require('express');
const router = express.Router();

const logger = require(__loggerPath);

const TokenHelper = require(__rootPath + '/components/helpers/TokenHelper');
const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

//////////////////////////////////////////////////////////
// 답글 추가 기능
router.post('/reply/comment/insert', TokenHelper.decodedNext, async (req, res) => {

  await DatabaseHelper.executeQuery('Reply', 'insertReplyComment', req.body);

  // 답글 등록 후 원래 화면으로 전환 시킨다.
  res.redirect('/board/' + req.body.BOARD_TYPE + '/view/' + req.body.BOARD_KEY);
});

router.post('/reply/insert', TokenHelper.decodedNext, async (req, res) => {
  
  // console.log('== req :', req.body);
  let conn = await DatabaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();
  
    await conn.query(DatabaseHelper.getStatement('Reply', 'insertReply', req.body));
    
    await conn.commit();
  
    res.redirect('/board/'+ req.body.BOARD_TYPE +'/view/' + req.body.BOARD_KEY);
  
  } catch(e) {
    console.error(e);
    await conn.rollback();
  
    PageHelper.throwPageWithAlertMessage(res, '/board/' + req.body.BOARD_TYPE + '/view/' + req.body.BOARD_KEY, '', '댓글 저장 중 오류 발생');
  } finally {
    await conn.release();
  }
  
});

router.delete('/reply/delete/:REPLY_KEY', async (req, res) => {

  // console.log('== req params :', req.params);

  let conn = await DatabaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();
  
    await conn.query(DatabaseHelper.getStatement('Reply', 'deleteReply', req.params));
    
    await conn.commit();
  
    res.redirect('/board/'+ req.body.BOARD_TYPE +'/view/' + req.body.BOARD_KEY);
  
  } catch(e) {
    logger.error(e);
    await conn.rollback();
  
    res.status(500).json({result: false, code: 500, message: 'error'});
  } finally {
    await conn.release();
  }
  

});

module.exports = router;