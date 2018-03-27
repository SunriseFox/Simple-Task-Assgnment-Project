
$(window).on('popstate', function (e) {
  var state = e.originalEvent.state;
  if (state !== null) {
    switch (state.type){
      case 'modal': showModal(null, state.path || '/index'); break
      case 'view': loadView(null, state.path || '/index'); break
    }
    $('.modal').modal('hide')
  }
});
$('#main_menu a').click(function () {
  var path = $(this).attr('path')
  loadView(this, path)
})

$('.ui.search').search({
  apiSettings: {
    url: '/search/{query}'
  },
  minCharacters : 1
});

if(localStorage.getItem('hide_banner') === 'true')
  $('#banner').remove()
