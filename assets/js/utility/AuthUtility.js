var AuthUtility = new Object();

AuthUtility.isAuthenticated = function() {
    var isAuthenticated = false;

    $.ajax({
        url: '/auth/check', 
        type: 'post',
        async: false,
        success: function(data) { isAuthenticated = data.isAuthenticated; }
    });

    return isAuthenticated;
}