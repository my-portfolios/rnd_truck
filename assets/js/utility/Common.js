/**
 * 2020-11-11 : 김경식
 * ejs 내 사용하는 공통 스크립트
 * jquery를 기본으로 사용 함.
 */

///////////////////////////////////////////////////////////////////////////////////
// 전역 function
function fn_search() {
  event.preventDefault();

  const keyword = $('#keyword').val();

  if(keyword == '') { 
    alert('검색어를 입력 하세요.');
    return;
  }

  $('#searchForm').attr('action', '/search/result/' + $('#keyword').val()).submit();
}

////////////////////////////////////////////////////////////////////////////////////
// jquery
$(function () {

  /**
   * 메인 화면 검색 버튼 사용
   */
  $('#keyword').keypress(function (e) {
    if(e.keyCode != 13) { return; }
    fn_search();
  });

  /**
  * input type="text" 숫자만 입력
  */ 
  $('.onlyNumber').on('keyup', function (e) {
    $(this).val( $(this).val().replace(/[^0-9]/g, '') );
  });


  
});