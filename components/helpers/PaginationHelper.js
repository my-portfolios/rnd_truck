const pagination = require('pagination');

let paginator;

let m_rowsPerPage;

module.exports = {
  create: (prelink, current, rowsPerPage, totalResult) => {

    m_rowsPerPage = rowsPerPage;

    paginator = new pagination.TemplatePaginator({
      prelink: prelink, current: current, rowsPerPage: rowsPerPage, totalResult: totalResult,
      slashSeparator: true,  // prelink시 slash 로 구분 지을지 여부
      template: (result) => {
        var i, len, prelink;
        var html = '<nav><ul class="pagination">';
        if(result.pageCount < 2) {
            html += '</ul>';
            return html;
        }
        prelink = paginator.preparePreLink(result.prelink);
        
        if(result.previous) {
            html += '<li class="disabled"><a href="'+ prelink + result.previous +'" aria-label="Previous">' + '<span aria-hidden="true"> << </span></a></li>';
        }
        if(result.range.length) {
            for( i = 0, len = result.range.length; i < len; i++) {
                if(result.range[i] === result.current) {
                    html += '<li class="active"><a class="page-link" href="' + prelink + result.range[i] + '">' + result.range[i] + '</a></li>';
                } else {
                    html += '<li><a class="page-link" href="' + prelink + result.range[i] + '">' + result.range[i] + '</a></li>';
                }
            }
        }
        if(result.next) {
            html += '<li><a aria-label="Next" href="' + prelink + result.next + '"><sapn aria-hidden="true"> >> </a></li>';
        }
        html += '</ul></nav>';
        return html;
      }});
  },
  getPaginationData: () => {

    let pageData = paginator.getPaginationData();
    pageData.limitIndex = pageData.fromResult - 1; // mysql limit 작업용 param
    pageData.rowsPerPage = m_rowsPerPage;

    return pageData;
  },
  render: () => {
    return paginator.render();
  }
}